import { type Suit } from './dealLogic'
import { getLeftBarSuit, COLOR_PAIRS } from './cardRanking'

/**
 * Trump selection information
 */
export interface TrumpSelection {
  trump: Suit | null
  rightBar: Suit | null // The trump suit (Right Bar is Jack of this suit)
  leftBar: Suit | null // The same-color suit (Left Bar is Jack of this suit)
}

/**
 * Gets the Right Bar suit (trump suit)
 */
export function getRightBarSuit(trump: Suit): Suit {
  return trump
}

/**
 * Gets the Left Bar suit (same color as trump)
 */
export function getLeftBarSuitFromTrump(trump: Suit): Suit {
  return getLeftBarSuit(trump)
}

/**
 * Creates a trump selection object
 */
export function createTrumpSelection(trump: Suit): TrumpSelection {
  return {
    trump,
    rightBar: getRightBarSuit(trump),
    leftBar: getLeftBarSuitFromTrump(trump),
  }
}

/**
 * Gets all available suits for selection
 */
export function getAvailableSuits(): Suit[] {
  return ['hearts', 'diamonds', 'clubs', 'spades']
}

/**
 * Gets the display name for a suit
 */
export function getSuitDisplayName(suit: Suit): string {
  const names: Record<Suit, string> = {
    hearts: 'Hearts',
    diamonds: 'Diamonds',
    clubs: 'Clubs',
    spades: 'Spades',
  }
  return names[suit]
}

/**
 * Gets the color description for a suit pair
 */
export function getColorDescription(trump: Suit): string {
  const leftBar = getLeftBarSuitFromTrump(trump)
  const isRed = trump === 'hearts' || trump === 'diamonds'
  return isRed ? 'Red (Hearts/Diamonds)' : 'Black (Clubs/Spades)'
}

/**
 * Gets description of what will happen when this trump is selected
 */
export function getTrumpDescription(trump: Suit): string {
  const leftBar = getLeftBarSuitFromTrump(trump)
  return `Right Bar: Jack of ${getSuitDisplayName(trump)}\nLeft Bar: Jack of ${getSuitDisplayName(leftBar)}`
}
