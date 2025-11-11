import { type Player } from './gameStart'

/**
 * Bid types in the game
 */
export type BidType =
  | 'pass'
  | 4
  | 5
  | 6
  | 7
  | 'ace-haus'
  | 'haus'
  | 'double-haus'

/**
 * Bid information stored for each player
 */
export interface Bid {
  playerKey: string
  playerIndex: number
  bid: BidType | null
  timestamp?: number
}

/**
 * Bid hierarchy (from lowest to highest)
 */
export const BID_HIERARCHY: BidType[] = [
  'pass',
  4,
  5,
  6,
  7,
  'ace-haus',
  'haus',
  'double-haus',
]

/**
 * Gets the numeric value of a bid for comparison
 */
export function getBidValue(bid: BidType): number {
  const index = BID_HIERARCHY.indexOf(bid)
  return index === -1 ? -1 : index
}

/**
 * Checks if bid1 is higher than bid2
 */
export function isBidHigher(bid1: BidType, bid2: BidType): boolean {
  return getBidValue(bid1) > getBidValue(bid2)
}

/**
 * Gets the next bidder index (left of dealer starts first)
 *
 * @param dealerIndex Index of the dealer
 * @param currentBidderIndex Index of current bidder (or -1 to start)
 * @returns Next bidder index
 */
export function getNextBidderIndex(
  dealerIndex: number,
  currentBidderIndex: number
): number {
  if (currentBidderIndex === -1) {
    // First bidder is to the left of dealer
    return (dealerIndex + 1) % 4
  }
  // Move clockwise
  return (currentBidderIndex + 1) % 4
}

/**
 * Gets the current highest bid from all bids
 */
export function getHighestBid(bids: Bid[]): BidType | null {
  let highest: BidType | null = null

  for (const bid of bids) {
    if (bid.bid === null || bid.bid === 'pass') continue
    if (highest === null || isBidHigher(bid.bid, highest)) {
      highest = bid.bid
    }
  }

  return highest
}

/**
 * Gets the highest bid value for comparison
 */
export function getHighestBidValue(bids: Bid[]): number {
  const highest = getHighestBid(bids)
  return highest ? getBidValue(highest) : -1
}

/**
 * Gets all valid bids a player can make
 *
 * @param currentHighestBid Current highest bid (null if none)
 * @param isDealer Whether the current player is the dealer
 * @param hasHausBeenBid Whether anyone has bid Haus
 * @returns Array of valid bid types
 */
export function getValidBids(
  currentHighestBid: BidType | null,
  isDealer: boolean,
  hasHausBeenBid: boolean
): BidType[] {
  const allBids: BidType[] = ['pass', 4, 5, 6, 7, 'ace-haus', 'haus']

  // Double Haus can only be bid by dealer and only if Haus has been bid
  if (isDealer && hasHausBeenBid) {
    allBids.push('double-haus')
  }

  // If there's no current bid, all bids are valid
  if (currentHighestBid === null) {
    return allBids
  }

  // Filter out bids that are not higher than current highest
  return allBids.filter((bid) => {
    if (bid === 'pass') return true // Pass is always available
    if (currentHighestBid === 'pass') return true // Can bid over pass
    return isBidHigher(bid, currentHighestBid)
  })
}

/**
 * Gets the player who won the bidding (highest non-pass bid)
 */
export function getBiddingWinner(bids: Bid[]): Bid | null {
  let winner: Bid | null = null
  let highestBid: BidType | null = null

  for (const bid of bids) {
    if (bid.bid === null || bid.bid === 'pass') continue
    if (highestBid === null || isBidHigher(bid.bid, highestBid)) {
      highestBid = bid.bid
      winner = bid
    }
  }

  return winner
}

/**
 * Checks if bidding is complete (all 4 players have bid)
 */
export function isBiddingComplete(
  bids: Bid[],
  playerCount: number = 4
): boolean {
  return bids.length >= playerCount && bids.every((b) => b.bid !== null)
}

/**
 * Gets the formatted display text for a bid
 */
export function getBidDisplayText(bid: BidType): string {
  switch (bid) {
    case 'pass':
      return 'Pass'
    case 4:
    case 5:
    case 6:
    case 7:
      return `${bid}`
    case 'ace-haus':
      return 'Aces'
    case 'haus':
      return 'Haus'
    case 'double-haus':
      return 'D-Haus'
    default:
      return 'Unknown'
  }
}

/**
 * Gets the message to display when a player bids
 */
export function getBidMessage(bid: BidType): string {
  switch (bid) {
    case 'pass':
      return "I'm passing"
    case 4:
    case 5:
    case 6:
    case 7:
      return `I went ${bid}`
    case 'ace-haus':
      return 'I went Aces'
    case 'haus':
      return 'I went Haus'
    case 'double-haus':
      return 'I went D-Haus'
    default:
      return 'Unknown bid'
  }
}

/**
 * Checks if Haus has been bid by anyone
 */
export function hasHausBeenBid(bids: Bid[]): boolean {
  return bids.some((bid) => bid.bid === 'haus' || bid.bid === 'double-haus')
}

/**
 * Handles the "stuck dealer" scenario - if all 4 players pass, dealer is stuck with bid of 4
 */
export function handleStuckDealer(
  bids: Bid[],
  dealerIndex: number,
  players: Player[]
): Bid {
  // Check if all players passed
  const allPassed = bids.length === 4 && bids.every((bid) => bid.bid === 'pass')

  if (allPassed) {
    const dealer = players[dealerIndex]
    return {
      playerKey: dealer.key,
      playerIndex: dealerIndex,
      bid: 4,
      timestamp: Date.now(),
    }
  }

  return null as any // Should not happen if not stuck
}

/**
 * Initializes bidding state for a new round
 */
export function initializeBidding(dealerIndex: number): {
  currentBidderIndex: number
  bids: Bid[]
} {
  return {
    currentBidderIndex: (dealerIndex + 1) % 4, // Left of dealer starts
    bids: [],
  }
}
