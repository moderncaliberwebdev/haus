import { type Card, type Suit } from './dealLogic'
import { type Player } from './gameStart'
import {
  compareCards,
  determineTrickWinner,
  canPlayCard,
  getValidCards,
} from './cardRanking'
import { getTrickWinningTeam } from './teamLogic'

/**
 * Represents a card played in a trick
 */
export interface PlayedCard {
  card: Card
  playerKey: string
  playerIndex: number
  playOrder: number // Order in which card was played (0 = first, 1 = second, etc.)
}

/**
 * Represents a complete trick
 */
export interface Trick {
  cards: PlayedCard[]
  ledSuit: Suit | null // Suit of the first card played
  winnerIndex: number | null // Index of winning card in cards array
  winnerPlayerKey: string | null
  winnerTeam: 1 | 2 | null
}

/**
 * Gets the led suit from a trick (suit of first card)
 */
export function getLedSuit(trick: Trick): Suit | null {
  if (trick.cards.length === 0) return null
  return trick.cards[0].card.suit
}

/**
 * Checks if a trick is complete (all active players have played)
 */
export function isTrickComplete(
  trick: Trick,
  activePlayerCount: number
): boolean {
  return trick.cards.length >= activePlayerCount
}

/**
 * Plays a card in a trick
 */
export function playCard(
  trick: Trick,
  card: Card,
  playerKey: string,
  playerIndex: number
): Trick {
  const newTrick = { ...trick }
  const playOrder = newTrick.cards.length

  // If this is the first card, set the led suit
  if (playOrder === 0) {
    newTrick.ledSuit = card.suit
  }

  // Add the card to the trick
  newTrick.cards.push({
    card,
    playerKey,
    playerIndex,
    playOrder,
  })

  return newTrick
}

/**
 * Determines the winner of a trick and updates the trick
 */
export function determineTrickWinnerAndUpdate(
  trick: Trick,
  trump: Suit | null,
  players: Player[]
): Trick {
  if (trick.cards.length === 0 || !trick.ledSuit) {
    return trick
  }

  const cardArray = trick.cards.map((pc) => pc.card)
  const { winnerIndex, winnerCard } = determineTrickWinner(
    cardArray,
    trump,
    trick.ledSuit
  )

  const winner = trick.cards[winnerIndex]
  const winnerTeam = getTrickWinningTeam(players, winner.playerKey)

  return {
    ...trick,
    winnerIndex,
    winnerPlayerKey: winner.playerKey,
    winnerTeam,
  }
}

/**
 * Gets the next player to play in a trick
 */
export function getNextPlayerToPlay(
  trick: Trick,
  biddingWinnerKey: string,
  players: Player[],
  sittingOutPlayerKey: string | null
): string | null {
  // Get active players (excluding sitting out player)
  const activePlayers = players.filter((p) => p.key !== sittingOutPlayerKey)

  if (trick.cards.length === 0) {
    // First card: bidding winner plays first
    return biddingWinnerKey
  }

  if (trick.cards.length >= activePlayers.length) {
    // Trick is complete
    return null
  }

  // Get the last player who played
  const lastPlayedCard = trick.cards[trick.cards.length - 1]
  const lastPlayerIndex = lastPlayedCard.playerIndex

  // Find next active player (clockwise)
  let nextIndex = (lastPlayerIndex + 1) % players.length
  let attempts = 0

  // Skip sitting out player
  while (
    players[nextIndex]?.key === sittingOutPlayerKey &&
    attempts < players.length
  ) {
    nextIndex = (nextIndex + 1) % players.length
    attempts++
  }

  return players[nextIndex]?.key || null
}

/**
 * Gets valid cards a player can play
 */
export function getValidCardsForPlayer(
  hand: Card[],
  trick: Trick,
  trump: Suit | null
): Card[] {
  const ledSuit = getLedSuit(trick)
  return getValidCards(hand, ledSuit, trump)
}

/**
 * Checks if a card can be played by a player
 */
export function canPlayerPlayCard(
  card: Card,
  hand: Card[],
  trick: Trick,
  trump: Suit | null
): boolean {
  const ledSuit = getLedSuit(trick)
  return canPlayCard(card, hand, ledSuit, trump)
}

/**
 * Gets the number of tricks won by each team
 */
export function getTricksWonByTeam(
  tricks: Trick[],
  players: Player[]
): { team1: number; team2: number } {
  let team1 = 0
  let team2 = 0

  for (const trick of tricks) {
    if (trick.winnerTeam === 1) {
      team1++
    } else if (trick.winnerTeam === 2) {
      team2++
    }
  }

  return { team1, team2 }
}

/**
 * Gets the current trick number (1-8)
 */
export function getCurrentTrickNumber(tricks: Trick[]): number {
  return tricks.length + 1
}

/**
 * Checks if all tricks have been played (8 total)
 */
export function areAllTricksComplete(tricks: Trick[]): boolean {
  return tricks.length >= 8
}
