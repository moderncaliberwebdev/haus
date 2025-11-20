import { type Card } from './dealLogic'
import { type Player } from './gameStart'
import { getPartner, isPartner } from './teamLogic'

/**
 * Special bid types that require card exchange
 */
export type SpecialBidType = 'haus' | 'double-haus' | 'ace-haus'

/**
 * Checks if a bid type requires special handling (card exchange)
 */
export function isSpecialBid(
  bidType: string | null
): bidType is SpecialBidType {
  return (
    bidType === 'haus' || bidType === 'double-haus' || bidType === 'ace-haus'
  )
}

/**
 * Gets the partner for the bidding winner
 */
export function getBiddingWinnerPartner(
  players: Player[],
  biddingWinnerKey: string
): Player | null {
  const biddingWinner = players.find((p) => p.key === biddingWinnerKey)
  if (!biddingWinner) return null

  const winnerIndex = players.findIndex((p) => p.key === biddingWinnerKey)
  return getPartner(players, winnerIndex)
}

/**
 * Checks if a player needs to participate in card exchange
 * Both the bidding winner and their partner exchange cards
 */
export function needsToExchangeCards(
  players: Player[],
  biddingWinnerKey: string,
  playerKey: string
): boolean {
  const partner = getBiddingWinnerPartner(players, biddingWinnerKey)
  return playerKey === biddingWinnerKey || partner?.key === playerKey
}

/**
 * Validates that exactly 2 cards are selected for exchange
 */
export function validateCardSelection(selectedCards: Card[]): boolean {
  return selectedCards.length === 2
}

/**
 * Removes selected cards from hand
 */
export function removeCardsFromHand(
  hand: Card[],
  cardsToRemove: Card[]
): Card[] {
  const cardIdsToRemove = new Set(cardsToRemove.map((c) => c.id))
  return hand.filter((card) => !cardIdsToRemove.has(card.id))
}

/**
 * Adds cards to hand
 */
export function addCardsToHand(hand: Card[], cardsToAdd: Card[]): Card[] {
  return [...hand, ...cardsToAdd]
}

/**
 * Exchanges cards between two players
 *
 * @param player1Hand Player 1's hand
 * @param player1Cards Cards player 1 is sending
 * @param player2Hand Player 2's hand
 * @param player2Cards Cards player 2 is sending
 * @returns Updated hands for both players
 */
export function exchangeCards(
  player1Hand: Card[],
  player1Cards: Card[],
  player2Hand: Card[],
  player2Cards: Card[]
): { player1NewHand: Card[]; player2NewHand: Card[] } {
  // Create deep copies of cards being sent to avoid reference issues
  const player1CardsToSend = player1Cards.map((c) => ({ ...c }))
  const player2CardsToSend = player2Cards.map((c) => ({ ...c }))

  // Remove cards being sent from each hand
  const player1AfterRemove = removeCardsFromHand(
    player1Hand,
    player1CardsToSend
  )
  const player2AfterRemove = removeCardsFromHand(
    player2Hand,
    player2CardsToSend
  )

  // Ensure received cards are not already in the hand (defensive check)
  const player1HandIds = new Set(player1AfterRemove.map((c) => c.id))
  const player2HandIds = new Set(player2AfterRemove.map((c) => c.id))

  // Filter out any cards that are already in the receiving hand
  const player2CardsToAdd = player2CardsToSend.filter(
    (c) => !player1HandIds.has(c.id)
  )
  const player1CardsToAdd = player1CardsToSend.filter(
    (c) => !player2HandIds.has(c.id)
  )

  // Add received cards to each hand
  const player1NewHand = addCardsToHand(player1AfterRemove, player2CardsToAdd)
  const player2NewHand = addCardsToHand(player2AfterRemove, player1CardsToAdd)

  return { player1NewHand, player2NewHand }
}

/**
 * Gets the player who sits out for special bids
 * The partner of the bidding winner sits out
 */
export function getSittingOutPlayer(
  players: Player[],
  biddingWinnerKey: string
): Player | null {
  return getBiddingWinnerPartner(players, biddingWinnerKey)
}

/**
 * Gets active players for special bids (excludes sitting out partner)
 */
export function getActivePlayers(
  players: Player[],
  biddingWinnerKey: string
): Player[] {
  const sittingOutPlayer = getSittingOutPlayer(players, biddingWinnerKey)
  if (!sittingOutPlayer) return players

  return players.filter((p) => p.key !== sittingOutPlayer.key)
}
