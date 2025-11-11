'use client'
import { type Suit } from '../lib/dealLogic'
import { getSuitDisplayName, getAvailableSuits } from '../lib/trumpSelection'
import styles from './TrumpSelectionUI.module.scss'

interface TrumpSelectionUIProps {
  biddingWinnerKey: string
  currentPlayerKey: string
  onSelectTrump: (trump: Suit) => void
}

export default function TrumpSelectionUI({
  biddingWinnerKey,
  currentPlayerKey,
  onSelectTrump,
}: TrumpSelectionUIProps) {
  const isCurrentPlayerWinner = biddingWinnerKey === currentPlayerKey
  const suits = getAvailableSuits()

  if (!isCurrentPlayerWinner) {
    return (
      <div className={styles.waitingBox}>
        <div className={styles.waitingText}>
          Waiting for the bidding winner to select trump...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.trumpSelectionBox}>
      <div className={styles.trumpQuestion}>Choose your trump suit</div>
      <div className={styles.suitButtons}>
        {suits.map((suit) => (
          <button
            key={suit}
            className={`${styles.suitButton} ${styles[`suit-${suit}`]}`}
            onClick={() => onSelectTrump(suit)}
          >
            <div className={styles.suitIcon}>{getSuitIcon(suit)}</div>
            <div className={styles.suitName}>{getSuitDisplayName(suit)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Gets the suit icon/emoji for display
 */
function getSuitIcon(suit: Suit): string {
  const icons: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }
  return icons[suit]
}
