import { type Card, type Suit, type Rank } from './dealLogic'

/**
 * Color pairs for Left Bar calculation
 */
export const COLOR_PAIRS: Record<Suit, Suit> = {
  hearts: 'diamonds', // Both red
  diamonds: 'hearts', // Both red
  clubs: 'spades', // Both black
  spades: 'clubs', // Both black
}

/**
 * Determines if a suit is the same color as another suit
 */
export function isSameColor(suit1: Suit, suit2: Suit): boolean {
  return COLOR_PAIRS[suit1] === suit2 || COLOR_PAIRS[suit2] === suit1
}

/**
 * Gets the color pair suit for a given suit
 */
export function getColorPair(suit: Suit): Suit {
  return COLOR_PAIRS[suit]
}

/**
 * Determines the Right Bar (Jack of Trump)
 */
export function getRightBar(trump: Suit): Card | null {
  // Right Bar is the Jack of the trump suit
  // Note: This is a reference card, actual card comparison will use isRightBar/isLeftBar
  return null
}

/**
 * Determines the Left Bar (Jack of the same color as trump)
 */
export function getLeftBarSuit(trump: Suit): Suit {
  return COLOR_PAIRS[trump]
}

/**
 * Checks if a card is the Right Bar (Jack of Trump)
 */
export function isRightBar(card: Card, trump: Suit | null): boolean {
  if (!trump) return false
  return card.rank === 'J' && card.suit === trump
}

/**
 * Checks if a card is the Left Bar (Jack of same color as Trump)
 */
export function isLeftBar(card: Card, trump: Suit | null): boolean {
  if (!trump) return false
  const leftBarSuit = getLeftBarSuit(trump)
  return card.rank === 'J' && card.suit === leftBarSuit
}

/**
 * Checks if a card is a trump card (including Left Bar and Right Bar)
 */
export function isTrumpCard(card: Card, trump: Suit | null): boolean {
  if (!trump) return false
  // Right Bar is trump
  if (isRightBar(card, trump)) return true
  // Left Bar is considered trump
  if (isLeftBar(card, trump)) return true
  // Any card in the trump suit is trump
  return card.suit === trump
}

/**
 * Gets the rank value for a card in the trump suit (excluding Bars)
 */
function getTrumpRankValue(rank: Rank): number {
  // In trump suit: A > K > Q > J
  const values: Record<Rank, number> = {
    A: 4,
    K: 3,
    Q: 2,
    J: 1,
  }
  return values[rank]
}

/**
 * Gets the rank value for a card in non-trump suit
 */
function getNonTrumpRankValue(rank: Rank): number {
  // In non-trump suit: A > K > Q > J
  const values: Record<Rank, number> = {
    A: 4,
    K: 3,
    Q: 2,
    J: 1,
  }
  return values[rank]
}

/**
 * Gets the power value of a card for comparison
 * Higher value = stronger card
 *
 * Priority order (with trump):
 * 1. Right Bar (highest)
 * 2. Left Bar (second highest)
 * 3. Trump suit cards (A, K, Q, J of trump)
 * 4. Non-trump cards (A, K, Q, J of other suits)
 */
function getCardPower(
  card: Card,
  trump: Suit | null,
  ledSuit: Suit | null
): number {
  // Ace Haus: No trump, simple ranking
  if (!trump) {
    if (!ledSuit) return 0 // Shouldn't happen
    // Only cards of the led suit matter
    if (card.suit !== ledSuit) return 0
    return getNonTrumpRankValue(card.rank)
  }

  // Right Bar is always the highest
  if (isRightBar(card, trump)) return 1000

  // Left Bar is always second highest
  if (isLeftBar(card, trump)) return 900

  // Trump cards beat non-trump
  if (isTrumpCard(card, trump)) {
    // Trump suit cards (not the bars)
    if (card.suit === trump) {
      return 100 + getTrumpRankValue(card.rank)
    }
  }

  // Non-trump cards
  if (!ledSuit) return 0 // Shouldn't happen
  if (card.suit !== ledSuit) return 0 // Wrong suit

  return getNonTrumpRankValue(card.rank)
}

/**
 * Compares two cards to determine which wins in a trick
 *
 * @param card1 First card played
 * @param card2 Second card played
 * @param trump The trump suit (null for Ace Haus)
 * @param ledSuit The suit that was led (first card played)
 * @returns 1 if card1 wins, -1 if card2 wins, 0 if equal (shouldn't happen with different card IDs)
 */
export function compareCards(
  card1: Card,
  card2: Card,
  trump: Suit | null,
  ledSuit: Suit
): number {
  const power1 = getCardPower(card1, trump, ledSuit)
  const power2 = getCardPower(card2, trump, ledSuit)

  if (power1 > power2) return 1
  if (power1 < power2) return -1

  // If same power (same card played twice), first card wins
  // This handles the case where two identical cards are played
  return 0 // Cards are equal in power, order matters
}

/**
 * Determines which card wins in an array of cards (trick)
 * Returns the index of the winning card and the card itself
 *
 * @param cards Array of cards played in the trick
 * @param trump The trump suit (null for Ace Haus)
 * @param ledSuit The suit that was led (first card's suit)
 * @returns Object with winnerIndex and winnerCard
 */
export function determineTrickWinner(
  cards: Card[],
  trump: Suit | null,
  ledSuit: Suit
): { winnerIndex: number; winnerCard: Card } {
  if (cards.length === 0) {
    throw new Error('Cannot determine winner from empty trick')
  }

  let winnerIndex = 0
  let winnerCard = cards[0]

  for (let i = 1; i < cards.length; i++) {
    const comparison = compareCards(winnerCard, cards[i], trump, ledSuit)
    if (comparison < 0) {
      // cards[i] wins
      winnerIndex = i
      winnerCard = cards[i]
    }
    // If comparison is 0 or > 0, winner stays the same (first card wins ties)
  }

  return { winnerIndex, winnerCard }
}

/**
 * Checks if a card can be played following suit rules
 *
 * @param card Card to check
 * @param hand Player's current hand
 * @param ledSuit Suit that was led (null if leading)
 * @param trump Trump suit (null for Ace Haus)
 * @returns true if card can be played
 */
export function canPlayCard(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null,
  trump: Suit | null
): boolean {
  // If leading, can play any card
  if (!ledSuit) return true

  // For Ace Haus (no trump), must follow exact suit if you have it
  if (!trump) {
    const hasLedSuit = hand.some((c) => c.suit === ledSuit)
    if (hasLedSuit) {
      return card.suit === ledSuit
    }
    // Don't have led suit, can play anything
    return true
  }

  // With trump: check if led suit is trump or non-trump
  const ledSuitIsTrump = ledSuit === trump

  // Check if player has cards that can follow the led suit
  const hasLedSuit = hand.some((c) => {
    if (ledSuitIsTrump) {
      // Led suit is trump, so can follow with trump suit OR Left Bar
      return c.suit === trump || isLeftBar(c, trump)
    }
    // Led suit is not trump, must follow exact suit
    return c.suit === ledSuit
  })

  // If player has cards that can follow, must play one
  if (hasLedSuit) {
    if (ledSuitIsTrump) {
      // Led suit is trump, can play trump suit or Left Bar
      return card.suit === trump || isLeftBar(card, trump)
    }
    // Led suit is not trump, must follow exact suit
    return card.suit === ledSuit
  }

  // Player doesn't have led suit, can play anything (including trump)
  return true
}

/**
 * Gets all valid cards that can be played from a hand
 *
 * @param hand Player's current hand
 * @param ledSuit Suit that was led (null if leading)
 * @param trump Trump suit (null for Ace Haus)
 * @returns Array of cards that can be played
 */
export function getValidCards(
  hand: Card[],
  ledSuit: Suit | null,
  trump: Suit | null
): Card[] {
  // If leading, all cards are valid
  if (!ledSuit) return hand

  // For Ace Haus (no trump), must follow exact suit if you have it
  if (!trump) {
    const hasLedSuit = hand.some((c) => c.suit === ledSuit)
    if (hasLedSuit) {
      return hand.filter((c) => c.suit === ledSuit)
    }
    // Don't have led suit, can play anything
    return hand
  }

  // With trump: check if led suit is trump
  const ledSuitIsTrump = ledSuit === trump

  // Check if player has cards that can follow the led suit
  const hasLedSuit = hand.some((c) => {
    if (ledSuitIsTrump) {
      // Led suit is trump, so can follow with trump suit OR Left Bar
      return c.suit === trump || isLeftBar(c, trump)
    }
    // Led suit is not trump, must follow exact suit
    return c.suit === ledSuit
  })

  if (hasLedSuit) {
    // Must play a card that follows the led suit
    if (ledSuitIsTrump) {
      // Led suit is trump, can play trump suit or Left Bar
      return hand.filter((c) => c.suit === trump || isLeftBar(c, trump))
    }
    // Led suit is not trump, must follow exact suit
    return hand.filter((c) => c.suit === ledSuit)
  }

  // Player doesn't have led suit, can play anything
  return hand
}
