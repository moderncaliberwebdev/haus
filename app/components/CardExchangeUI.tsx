'use client'
import { useState } from 'react'
import { type Card } from '../lib/dealLogic'
import { type Player } from '../lib/gameStart'
import {
  getBiddingWinnerPartner,
  validateCardSelection,
} from '../lib/specialBidLogic'
import { getCardImagePath } from '../lib/dealLogic'
import styles from './CardExchangeUI.module.scss'

interface CardExchangeUIProps {
  biddingWinnerKey: string
  currentPlayerKey: string
  players: Player[]
  hand: Card[]
  exchangeData: any
  onSelectCards: (cards: Card[]) => void
}

export default function CardExchangeUI({
  biddingWinnerKey,
  currentPlayerKey,
  players,
  hand,
  exchangeData,
  onSelectCards,
}: CardExchangeUIProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([])

  // Check if this player is the bidding winner or their partner
  const biddingWinner = players.find((p) => p.key === biddingWinnerKey)
  const partner = biddingWinner
    ? getBiddingWinnerPartner(players, biddingWinnerKey)
    : null

  const isBiddingWinner = currentPlayerKey === biddingWinnerKey
  const isPartner = partner?.key === currentPlayerKey

  // Only show UI for bidding winner or partner
  if (!isBiddingWinner && !isPartner) {
    return (
      <div className={styles.waitingBox}>
        <div className={styles.waitingText}>Waiting for card exchange...</div>
      </div>
    )
  }

  // Check if partner has submitted their cards
  const partnerKey = partner?.key || null
  const partnerReady = partnerKey
    ? exchangeData?.[partnerKey]?.ready === true
    : false
  const currentPlayerReady = exchangeData?.[currentPlayerKey]?.ready === true

  // Get cards received from partner (if any)
  const receivedCards =
    isPartner && !partnerReady
      ? exchangeData?.[biddingWinnerKey]?.cardsToSend || []
      : []

  // Get cards we've sent (if any)
  const sentCards = exchangeData?.[currentPlayerKey]?.cardsToSend || []

  // Check if we're waiting for partner's cards
  const waitingForPartner = currentPlayerReady && !partnerReady
  const waitingForWinner = isPartner && partnerReady && !currentPlayerReady
  const canSubmit = selectedCards.length === 2 && !currentPlayerReady

  const handleCardClick = (card: Card) => {
    const isSelected = selectedCards.some((c) => c.id === card.id)

    if (isSelected) {
      // Deselect card
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id))
    } else {
      // Select card (max 2)
      if (selectedCards.length < 2) {
        setSelectedCards([...selectedCards, card])
      }
    }
  }

  const handleSubmit = () => {
    if (validateCardSelection(selectedCards)) {
      onSelectCards(selectedCards)
      setSelectedCards([])
    }
  }

  // Display hand:
  // - For winner: their original hand (until they send, then waiting)
  // - For partner: their original hand + received cards from winner (received cards are preview only, not selectable)
  const displayHand =
    isPartner && receivedCards.length > 0 ? [...hand, ...receivedCards] : hand

  // For partner: only original hand cards are selectable (not received cards)
  const selectableCards = hand

  return (
    <div className={styles.exchangeBox}>
      <div className={styles.exchangeTitle}>
        {isBiddingWinner
          ? 'Select 2 cards to send to your partner'
          : receivedCards.length > 0
          ? 'Your partner sent you cards. Select 2 cards to send back'
          : 'Waiting for partner to send cards...'}
      </div>

      {receivedCards.length > 0 && isPartner && !currentPlayerReady && (
        <div className={styles.receivedCardsInfo}>
          You received {receivedCards.length} card
          {receivedCards.length !== 1 ? 's' : ''} from your partner
        </div>
      )}

      {waitingForPartner && (
        <div className={styles.waitingMessage}>
          You've sent your cards. Waiting for partner to select cards...
        </div>
      )}

      {waitingForWinner && (
        <div className={styles.waitingMessage}>
          You've sent your cards. Waiting for partner...
        </div>
      )}

      <div className={styles.cardSelection}>
        <div className={styles.selectedCount}>
          Selected: {selectedCards.length} / 2
        </div>

        <div className={styles.cardHand}>
          {displayHand.map((card, index) => {
            const isSelected = selectedCards.some((c: Card) => c.id === card.id)
            const isReceivedCard = receivedCards.some(
              (c: Card) => c.id === card.id
            )
            const isSentCard = sentCards.some((c: Card) => c.id === card.id)
            const isSelectable = selectableCards.some(
              (c: Card) => c.id === card.id
            )
            const canClick =
              !waitingForPartner &&
              !waitingForWinner &&
              !currentPlayerReady &&
              isSelectable

            return (
              <div
                key={card.id}
                className={`${styles.card} ${
                  isSelected ? styles.selected : ''
                } ${isReceivedCard ? styles.received : ''} ${
                  !isSelectable ? styles.notSelectable : ''
                }`}
                onClick={() => canClick && handleCardClick(card)}
                style={{
                  transform: `translateX(${
                    (index - (displayHand.length - 1) / 2) * 3
                  }%)`,
                  zIndex: isSelected ? 10 : index,
                  cursor: canClick ? 'pointer' : 'default',
                }}
              >
                <img
                  src={getCardImagePath(card)}
                  alt={`${card.rank} of ${card.suit}`}
                  className={styles.cardImage}
                />
                {isReceivedCard && (
                  <div className={styles.receivedBadge}>New</div>
                )}
              </div>
            )
          })}
        </div>

        {!waitingForPartner && !waitingForWinner && !currentPlayerReady && (
          <button
            className={`${styles.submitButton} ${
              canSubmit ? styles.ready : styles.disabled
            }`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {canSubmit ? 'Send Cards' : 'Select 2 Cards'}
          </button>
        )}
      </div>
    </div>
  )
}
