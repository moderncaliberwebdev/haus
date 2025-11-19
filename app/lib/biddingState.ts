import { ref, update, push } from 'firebase/database'
import { db } from './firebase'
import {
  type Bid,
  type BidType,
  getNextBidderIndex,
  isBiddingComplete,
  handleStuckDealer,
  initializeBidding,
  getBiddingWinner,
} from './biddingLogic'
import { type Player } from './gameStart'

/**
 * Submits a bid for a player
 */
export async function submitBid(
  gameCode: string,
  playerKey: string,
  playerIndex: number,
  bid: BidType,
  bids: Bid[],
  dealerIndex: number,
  players: Player[]
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)
  const bidsRef = ref(db, `games/${gameCode}/bidding/bids`)

  // Create new bid object
  const newBid: Bid = {
    playerKey,
    playerIndex,
    bid,
    timestamp: Date.now(),
  }

  // Add bid to bids array in Firebase
  await push(bidsRef, newBid)

  // Update current bidder index
  const updatedBids = [...bids, newBid]
  const nextBidderIndex = getNextBidderIndex(dealerIndex, playerIndex)

  // Check if bidding is complete
  if (isBiddingComplete(updatedBids, players.length)) {
    // Check for stuck dealer (all passed)
    const allPassed = updatedBids.every((b) => b.bid === 'pass')
    if (allPassed) {
      const stuckBid = handleStuckDealer(updatedBids, dealerIndex, players)
      await push(bidsRef, stuckBid)

      // Move to trump selection phase (stuck dealer always goes to trump selection)
      const winner = getBiddingWinner([...updatedBids, stuckBid])
      await update(gameRef, {
        'bidding/currentBidderIndex': null,
        phase: 'trump-selection',
        biddingWinner: winner?.playerKey || null,
      })
    } else {
      // Get the winning bid
      const winner = getBiddingWinner(updatedBids)
      const winningBid = winner?.bid

      // Determine next phase based on bid type
      let nextPhase = 'trump-selection'
      if (winningBid === 'ace-haus') {
        // Ace Haus skips trump selection and goes directly to card exchange
        nextPhase = 'card-exchange'
      }

      const updates: any = {
        'bidding/currentBidderIndex': null,
        phase: nextPhase,
        biddingWinner: winner?.playerKey || null,
      }

      // Initialize card exchange state if going to card exchange
      if (nextPhase === 'card-exchange') {
        updates.cardExchange = {}
        updates.trump = null // Ace Haus has no trump
      }

      await update(gameRef, updates)
    }
  } else {
    // Move to next bidder
    await update(gameRef, {
      'bidding/currentBidderIndex': nextBidderIndex,
    })
  }
}

/**
 * Starts the bidding phase after deal completes
 */
export async function startBidding(
  gameCode: string,
  dealerIndex: number
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)
  const biddingState = initializeBidding(dealerIndex)

  await update(gameRef, {
    phase: 'bidding',
    'bidding/currentBidderIndex': biddingState.currentBidderIndex,
    'bidding/bids': {}, // Initialize empty bids object
  })
}

/**
 * Converts Firebase bidding data to Bid array
 */
export function parseBidsFromFirebase(firebaseBidding: any): Bid[] {
  if (!firebaseBidding || !firebaseBidding.bids) return []

  // Firebase returns bids as an object with keys
  const bidsObject = firebaseBidding.bids
  const bidsArray: Bid[] = Object.entries(bidsObject)
    .map(([_, bidData]: [string, any]) => bidData as Bid)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)) // Sort by timestamp

  return bidsArray
}
