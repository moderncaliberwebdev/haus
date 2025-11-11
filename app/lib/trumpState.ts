import { ref, update } from 'firebase/database'
import { db } from './firebase'
import { type Suit } from './dealLogic'
import { createTrumpSelection } from './trumpSelection'

/**
 * Submits trump selection for the bidding winner
 */
export async function submitTrumpSelection(
  gameCode: string,
  trump: Suit,
  bidType: string | null
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)
  const trumpSelection = createTrumpSelection(trump)

  // If Ace Haus, no trump should be set
  if (bidType === 'ace-haus') {
    await update(gameRef, {
      phase: 'card-exchange', // Next phase depends on bid type
      trump: null, // Ace Haus has no trump
      biddingWinner: null, // Clear this
      cardExchange: {}, // Initialize card exchange state
    })
  } else {
    // Regular Haus or Double Haus or regular bid
    // Determine next phase based on bid type
    let nextPhase = 'trick-playing'
    if (bidType === 'haus' || bidType === 'double-haus') {
      nextPhase = 'card-exchange'
    }

    const updates: any = {
      phase: nextPhase,
      trump: trumpSelection.trump,
      rightBar: trumpSelection.rightBar,
      leftBar: trumpSelection.leftBar,
      biddingWinner: null, // Clear this
    }

    // Initialize card exchange state if needed
    if (nextPhase === 'card-exchange') {
      updates.cardExchange = {}
    }

    await update(gameRef, updates)
  }
}
