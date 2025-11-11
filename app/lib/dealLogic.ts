import { ref, update } from 'firebase/database'
import { db } from './firebase'

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
  id: string
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = ['J', 'Q', 'K', 'A']
  const deck: Card[] = []

  // Create 2 decks (2 of each card)
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}-${deckNum}`,
        })
      }
    }
  }

  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCards(
  deck: Card[],
  numPlayers: number = 4,
  dealerIndex: number = 0
): Card[][] {
  const hands: Card[][] = [[], [], [], []]
  const cardsPerPlayer = 8

  // Starting player is to the left of the dealer
  let currentPlayerIndex = (dealerIndex + 1) % numPlayers

  // Deal cards one at a time, starting with player to the left of dealer
  for (let i = 0; i < deck.length; i++) {
    if (hands[currentPlayerIndex].length < cardsPerPlayer) {
      hands[currentPlayerIndex].push(deck[i])
    }
    // Move to next player (clockwise)
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers
  }

  return hands
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    clubs: 1,
    hearts: 2,
    diamonds: 3,
  }

  const rankOrder: Record<Rank, number> = {
    J: 3,
    Q: 2,
    K: 1,
    A: 0,
  }

  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit]
    }
    return rankOrder[a.rank] - rankOrder[b.rank]
  })
}

export function getCardImagePath(card: Card): string {
  const rankMap: Record<Rank, string> = {
    J: 'jack',
    Q: 'queen',
    K: 'king',
    A: 'ace',
  }
  const rankName = rankMap[card.rank]
  return `/cards/${rankName}-${card.suit}.png`
}

interface DealProgress {
  dealingIndex: number
}

export async function handleDeal(
  gameCode: string,
  dealerIndex: number,
  playersLength: number,
  onProgress?: (progress: DealProgress) => void
): Promise<void> {
  if (!gameCode || dealerIndex === -1) return

  // Create and shuffle deck
  const deck = shuffleDeck(createDeck())

  // Deal cards one at a time starting from player to left of dealer
  const gameRef = ref(db, `games/${gameCode}`)
  const totalCards = 32
  const cardsPerPlayer = 8

  // Initialize empty hands
  const handsArray: Card[][] = [[], [], [], []]
  const handsObject: Record<string, Record<string, Card>> = {
    '0': {},
    '1': {},
    '2': {},
    '3': {},
  }

  // Starting player is to the left of the dealer
  let currentPlayerIdx = (dealerIndex + 1) % playersLength

  // Deal one card at a time
  for (let cardNum = 0; cardNum < totalCards; cardNum++) {
    await new Promise((resolve) => setTimeout(resolve, 50)) // 150ms delay per card

    // Get card from deck
    const card = deck[cardNum]

    // Add card to current player's hand
    const cardIdxInHand = handsArray[currentPlayerIdx].length
    handsArray[currentPlayerIdx].push(card)
    handsObject[currentPlayerIdx][cardIdxInHand] = card

    // Sort current player's hand
    handsArray[currentPlayerIdx] = sortHand(handsArray[currentPlayerIdx])

    // Rebuild hands object with sorted hands
    const sortedHandsObject: Record<string, Record<string, Card>> = {}
    for (let i = 0; i < 4; i++) {
      sortedHandsObject[i] = {}
      const sortedHand = sortHand(handsArray[i])
      sortedHand.forEach((c, idx) => {
        sortedHandsObject[i][idx] = c
      })
    }

    // Update Firebase with current state
    await update(gameRef, { hands: sortedHandsObject })

    // Call progress callback if provided
    if (onProgress) {
      onProgress({ dealingIndex: cardNum + 1 })
    }

    // Move to next player (clockwise)
    currentPlayerIdx = (currentPlayerIdx + 1) % playersLength
  }
}
