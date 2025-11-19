import { ref, update, push, get } from 'firebase/database'
import { db } from './firebase'
import { type Card, type Suit } from './dealLogic'
import { type Player } from './gameStart'
import {
  type Trick,
  type PlayedCard,
  playCard,
  determineTrickWinnerAndUpdate,
  getNextPlayerToPlay,
  isTrickComplete,
  areAllTricksComplete,
} from './trickLogic'
import { sortHand } from './dealLogic'

/**
 * Submits a card to be played in the current trick
 */
export async function submitCardPlay(
  gameCode: string,
  playerKey: string,
  playerIndex: number,
  card: Card,
  currentTrick: Trick | null,
  trump: Suit | null,
  biddingWinnerKey: string,
  players: Player[],
  sittingOutPlayerKey: string | null
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)
  const tricksRef = ref(db, `games/${gameCode}/tricks`)

  // If currentTrick is null (first card of first trick), create a new trick
  const trickToUse = currentTrick || createTrick()

  // Play the card
  const updatedTrick = playCard(trickToUse, card, playerKey, playerIndex)

  // Remove card from player's hand
  const handsRef = ref(db, `games/${gameCode}/hands`)
  const handsSnap = await get(handsRef)
  const hands = handsSnap.val() || {}
  const playerHand: Card[] = Object.values(hands[playerIndex] || {}) as Card[]
  const updatedHand = playerHand.filter((c) => c.id !== card.id)
  const sortedHand = sortHand(updatedHand)

  // Convert back to Firebase format
  const handObject: Record<string, Card> = {}
  sortedHand.forEach((card, idx) => {
    handObject[idx] = card
  })

  // Check if trick is complete
  const activePlayerCount = players.filter(
    (p) => p.key !== sittingOutPlayerKey
  ).length
  const trickComplete = isTrickComplete(updatedTrick, activePlayerCount)

  if (trickComplete) {
    // Determine winner
    const finalTrick = determineTrickWinnerAndUpdate(
      updatedTrick,
      trump,
      players
    )

    // Ensure final trick is properly serialized for Firebase
    const finalTrickForFirebase = {
      cards: finalTrick.cards.map((pc) => ({
        card: pc.card,
        playerKey: pc.playerKey,
        playerIndex: pc.playerIndex,
        playOrder: pc.playOrder,
      })),
      ledSuit: finalTrick.ledSuit,
      winnerIndex: finalTrick.winnerIndex,
      winnerPlayerKey: finalTrick.winnerPlayerKey,
      winnerTeam: finalTrick.winnerTeam,
    }

    // Update currentTrick with the final trick (so UI can show winner)
    // Set currentPlayer to null to pause play during winner display
    await update(gameRef, {
      currentTrick: finalTrickForFirebase,
      currentPlayer: null, // Pause play to show winner
      [`hands/${playerIndex}`]: handObject,
    })

    // Add completed trick to tricks array
    await push(tricksRef, finalTrickForFirebase)

    // Check if all tricks are complete
    const tricksSnap = await get(tricksRef)
    const allTricks = tricksSnap.val() || {}
    const tricksArray: Trick[] = Object.values(allTricks) as Trick[]
    const allComplete = areAllTricksComplete(tricksArray)

    if (allComplete) {
      // All tricks complete - move to scoring phase after winner display
      // The client will handle the transition after showing the winner
      // For now, just keep currentTrick visible with winner and currentPlayer null
    }
    // Note: Starting the next trick will be handled by the client after 3-second delay
    // If all tricks are complete, the client should transition to scoring phase instead
  } else {
    // Get next player to play
    const nextPlayer = getNextPlayerToPlay(
      updatedTrick,
      biddingWinnerKey,
      players,
      sittingOutPlayerKey
    )

    // Ensure trick is properly serialized for Firebase
    // Convert the trick object to a plain object that Firebase can store
    // Don't include winner fields until trick is complete
    const trickForFirebase = {
      cards: updatedTrick.cards.map((pc) => ({
        card: pc.card,
        playerKey: pc.playerKey,
        playerIndex: pc.playerIndex,
        playOrder: pc.playOrder,
      })),
      ledSuit: updatedTrick.ledSuit,
      winnerIndex: null, // Only set when trick is complete
      winnerPlayerKey: null, // Only set when trick is complete
      winnerTeam: null, // Only set when trick is complete
    }

    // Update trick and move to next player
    await update(gameRef, {
      currentTrick: trickForFirebase,
      currentPlayer: nextPlayer,
      [`hands/${playerIndex}`]: handObject,
    })
  }
}

/**
 * Creates an empty trick
 */
export function createTrick(): Trick {
  return {
    cards: [],
    ledSuit: null,
    winnerIndex: null,
    winnerPlayerKey: null,
    winnerTeam: null,
  }
}

/**
 * Gets trick data from Firebase
 */
export function parseTrickFromFirebase(firebaseTrick: any): Trick | null {
  if (!firebaseTrick) return null
  return firebaseTrick as Trick
}

/**
 * Initializes the first trick after card exchange completes
 */
export async function startFirstTrick(
  gameCode: string,
  biddingWinnerKey: string
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)

  // Don't set currentTrick here - Firebase drops empty objects
  // currentTrick will be created when the first card is played
  // Also don't set tricks - it will be created when the first trick completes
  await update(gameRef, {
    phase: 'trick-playing',
    currentPlayer: biddingWinnerKey, // Bidding winner leads first trick
  })
}

/**
 * Starts the next trick after the previous one completes
 */
export async function startNextTrick(
  gameCode: string,
  winnerPlayerKey: string
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)

  // Clear currentTrick and set currentPlayer to the winner
  // currentTrick will be created when the winner plays their first card
  await update(gameRef, {
    currentTrick: null,
    currentPlayer: winnerPlayerKey, // Winner leads the next trick
  })
}
