import { ref, update, get } from 'firebase/database'
import { db } from './firebase'
import { type Card } from './dealLogic'
import { type Player } from './gameStart'
import { exchangeCards, validateCardSelection } from './specialBidLogic'
import { sortHand } from './dealLogic'
import { startFirstTrick } from './trickState'

/**
 * Submits cards for exchange from one player
 */
export async function submitCardsForExchange(
  gameCode: string,
  playerKey: string,
  selectedCards: Card[]
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)
  const exchangeRef = ref(db, `games/${gameCode}/cardExchange`)

  // Validate selection
  if (!validateCardSelection(selectedCards)) {
    throw new Error('Must select exactly 2 cards')
  }

  // Store the cards this player is sending
  await update(exchangeRef, {
    [`${playerKey}/cardsToSend`]: selectedCards,
    [`${playerKey}/ready`]: true,
  })
}

/**
 * Checks if both players have submitted their cards for exchange
 */
export function areBothPlayersReady(
  exchangeData: any,
  biddingWinnerKey: string,
  partnerKey: string | null
): boolean {
  if (!exchangeData || !partnerKey) return false

  const winnerReady = exchangeData[biddingWinnerKey]?.ready === true
  const partnerReady = exchangeData[partnerKey]?.ready === true

  // Both must have ready flag and cardsToSend
  const winnerHasCards =
    exchangeData[biddingWinnerKey]?.cardsToSend?.length === 2
  const partnerHasCards = exchangeData[partnerKey]?.cardsToSend?.length === 2

  return winnerReady && partnerReady && winnerHasCards && partnerHasCards
}

/**
 * Completes the card exchange between partners
 */
export async function completeCardExchange(
  gameCode: string,
  players: Player[],
  biddingWinnerKey: string,
  exchangeData: any
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)

  // Find partner
  const partner = players.find((p) => {
    const winner = players.find((pw) => pw.key === biddingWinnerKey)
    if (!winner) return false
    const winnerIndex = players.findIndex((pw) => pw.key === biddingWinnerKey)
    const partnerIndex = (winnerIndex + 2) % 4
    return players[partnerIndex]?.key === p.key
  })

  if (!partner) {
    throw new Error('Partner not found')
  }

  // Get cards being sent
  const winnerCards = exchangeData[biddingWinnerKey]?.cardsToSend || []
  const partnerCards = exchangeData[partner.key]?.cardsToSend || []

  // Get current hands from Firebase
  const gameSnap = await get(gameRef)
  const gameData = gameSnap.val() || {}
  const hands = gameData.hands || {}

  // Convert Firebase hands to arrays
  const winnerHand: Card[] = Object.values(
    hands[players.findIndex((p) => p.key === biddingWinnerKey)] || {}
  )
  const partnerHand: Card[] = Object.values(
    hands[players.findIndex((p) => p.key === partner.key)] || {}
  )

  // Exchange cards
  const { player1NewHand, player2NewHand } = exchangeCards(
    winnerHand,
    winnerCards,
    partnerHand,
    partnerCards
  )

  // Sort hands
  const sortedWinnerHand = sortHand(player1NewHand)
  const sortedPartnerHand = sortHand(player2NewHand)

  // Convert back to Firebase format
  const winnerHandIndex = players.findIndex((p) => p.key === biddingWinnerKey)
  const partnerHandIndex = players.findIndex((p) => p.key === partner.key)

  // Get existing hands structure
  const existingHands = gameData.hands || {}
  const updatedHands: Record<string, Record<string, Card>> = {
    ...existingHands,
  }

  // Update winner's hand
  updatedHands[winnerHandIndex] = {}
  sortedWinnerHand.forEach((card, idx) => {
    updatedHands[winnerHandIndex][idx] = card
  })

  // Update partner's hand
  updatedHands[partnerHandIndex] = {}
  sortedPartnerHand.forEach((card, idx) => {
    updatedHands[partnerHandIndex][idx] = card
  })

  // Update Firebase with exchanged hands
  // Note: We'll start the first trick separately after this completes
  await update(gameRef, {
    hands: updatedHands,
    cardExchange: {}, // Clear exchange data
    sittingOutPlayer: partner.key, // Mark partner as sitting out
  })

  // Start the first trick
  await startFirstTrick(gameCode, biddingWinnerKey)
}
