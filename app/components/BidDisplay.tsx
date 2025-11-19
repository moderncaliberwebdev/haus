'use client'
import { type BidType } from '../lib/biddingLogic'
import { getBidDisplayText } from '../lib/biddingLogic'
import { type Suit } from '../lib/dealLogic'
import { getSuitDisplayName } from '../lib/trumpSelection'
import styles from './BidDisplay.module.scss'

interface BidDisplayProps {
  biddingWinnerName: string | null
  winningBid: BidType | null
  trump: Suit | null
}

export default function BidDisplay({
  biddingWinnerName,
  winningBid,
  trump,
}: BidDisplayProps) {
  if (!biddingWinnerName || !winningBid) return null

  const bidText = getBidDisplayText(winningBid)
  const suitText = trump
    ? getSuitDisplayName(trump)
    : winningBid === 'ace-haus'
    ? 'Aces'
    : null

  return (
    <div className={styles.bidDisplay}>
      <span className={styles.winner}>{biddingWinnerName}</span>
      <span className={styles.bid}>bid {bidText}</span>
      {suitText && <span className={styles.suit}>• {suitText}</span>}
    </div>
  )
}

