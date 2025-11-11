'use client'
import { type Player, type PositionedPlayers } from '../lib/gameStart'
import {
  type BidType,
  type Bid,
  getValidBids,
  getBidDisplayText,
  getBidMessage,
  hasHausBeenBid,
  isBiddingComplete,
} from '../lib/biddingLogic'
import styles from './BiddingUI.module.scss'

interface BiddingUIProps {
  currentBidderKey: string | null
  currentPlayerKey: string
  bids: Bid[]
  players: Player[]
  positionedPlayers: PositionedPlayers
  dealerIndex: number
  onBid: (bid: BidType) => void
}

/**
 * Gets the position for a player key
 */
function getPlayerPosition(
  playerKey: string,
  positionedPlayers: PositionedPlayers
): 'bottom' | 'left' | 'top' | 'right' | null {
  if (positionedPlayers.bottom?.key === playerKey) return 'bottom'
  if (positionedPlayers.left?.key === playerKey) return 'left'
  if (positionedPlayers.top?.key === playerKey) return 'top'
  if (positionedPlayers.right?.key === playerKey) return 'right'
  return null
}

/**
 * Gets the player for a position
 */
function getPlayerForPosition(
  position: 'bottom' | 'left' | 'top' | 'right',
  positionedPlayers: PositionedPlayers
): Player | null {
  return positionedPlayers[position]
}

export default function BiddingUI({
  currentBidderKey,
  currentPlayerKey,
  bids,
  players,
  positionedPlayers,
  dealerIndex,
  onBid,
}: BiddingUIProps) {
  const isCurrentPlayerBidding = currentBidderKey === currentPlayerKey
  const isCurrentPlayerDealer = players[dealerIndex]?.key === currentPlayerKey

  // Get current highest bid
  const currentHighestBid = (() => {
    const validBids = bids
      .map((b) => b.bid)
      .filter((bid): bid is BidType => bid !== null && bid !== 'pass')

    if (validBids.length === 0) return null

    let highest: BidType = validBids[0]
    for (const bid of validBids) {
      if (
        ['pass', 4, 5, 6, 7, 'ace-haus', 'haus', 'double-haus'].indexOf(bid) >
        ['pass', 4, 5, 6, 7, 'ace-haus', 'haus', 'double-haus'].indexOf(highest)
      ) {
        highest = bid
      }
    }
    return highest
  })()

  const hasHausBid = hasHausBeenBid(bids)
  const biddingComplete = isBiddingComplete(bids, players.length)

  // Get valid bids for current bidder
  const validBids = isCurrentPlayerBidding
    ? getValidBids(currentHighestBid, isCurrentPlayerDealer, hasHausBid)
    : []

  // All bid options
  const allBidOptions: BidType[] = [
    'pass',
    4,
    5,
    6,
    7,
    'ace-haus',
    'haus',
    'double-haus',
  ]

  return (
    <>
      {/* Bidding box for current bidder */}
      {isCurrentPlayerBidding && (
        <div className={styles.biddingBox}>
          <div className={styles.biddingQuestion}>What is your bid?</div>
          <div className={styles.bidButtons}>
            {allBidOptions.map((bid) => {
              const isValid = validBids.includes(bid)
              return (
                <button
                  key={bid}
                  className={`${styles.bidButton} ${
                    isValid ? styles.valid : styles.invalid
                  }`}
                  onClick={() => isValid && onBid(bid)}
                  disabled={!isValid}
                >
                  {getBidDisplayText(bid)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Message bubbles for other players' bids */}
      {bids
        .filter((bid) => bid.bid !== null && bid.playerKey !== currentPlayerKey)
        .map((bid) => {
          const position = getPlayerPosition(bid.playerKey, positionedPlayers)
          if (!position) return null

          const player = players.find((p) => p.key === bid.playerKey)
          const message = getBidMessage(bid.bid!)

          return (
            <div
              key={`${bid.playerKey}-${bid.timestamp || Date.now()}`}
              className={`${styles.messageBubble} ${
                styles[`bubble-${position}`]
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messagePlayerName}>
                  {player?.nickname}
                </div>
                <div className={styles.messageText}>{message}</div>
              </div>
            </div>
          )
        })}
    </>
  )
}
