'use client'
import { useState } from 'react'
import { type Card, type Suit } from '../lib/dealLogic'
import { type Player } from '../lib/gameStart'
import { type Trick, type PlayedCard } from '../lib/trickLogic'
import {
  getValidCardsForPlayer,
  canPlayerPlayCard,
  getNextPlayerToPlay,
  isTrickComplete,
} from '../lib/trickLogic'
import { getCardImagePath } from '../lib/dealLogic'
import { getImageFromRole } from '../lib/gameStart'
import WaitingBox from './WaitingBox'
import styles from './TrickUI.module.scss'
import Image from 'next/image'

interface TrickUIProps {
  currentTrick: Trick | null
  currentPlayerKey: string | null // The player whose turn it is
  currentPlayerHand: Card[]
  players: Player[]
  trump: Suit | null
  biddingWinnerKey: string
  sittingOutPlayerKey: string | null
  onPlayCard: (card: Card) => void
  positionedPlayers: any
  myPlayerKey: string // The current user's player key
}

export default function TrickUI({
  currentTrick,
  currentPlayerKey,
  currentPlayerHand,
  players,
  trump,
  biddingWinnerKey,
  sittingOutPlayerKey,
  onPlayCard,
  positionedPlayers,
  myPlayerKey,
}: TrickUIProps) {
  // Check if it's current player's turn
  const isMyTurn = currentPlayerKey === myPlayerKey

  // Get current player info
  const currentPlayerInfo = currentPlayerKey
    ? players.find((p) => p.key === currentPlayerKey)
    : null

  // Get valid cards for current player (only if it's their turn)
  const validCards =
    currentTrick && isMyTurn
      ? getValidCardsForPlayer(currentPlayerHand, currentTrick, trump)
      : []

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || !currentTrick) return

    // Validate card can be played
    if (canPlayerPlayCard(card, currentPlayerHand, currentTrick, trump)) {
      onPlayCard(card)
    }
  }

  // Get player info for each card in trick
  const getPlayerForCard = (playerKey: string): Player | null => {
    return players.find((p) => p.key === playerKey) || null
  }

  // Get position for a player key
  const getPlayerPosition = (
    playerKey: string
  ): 'bottom' | 'left' | 'top' | 'right' | null => {
    if (positionedPlayers.bottom?.key === playerKey) return 'bottom'
    if (positionedPlayers.left?.key === playerKey) return 'left'
    if (positionedPlayers.top?.key === playerKey) return 'top'
    if (positionedPlayers.right?.key === playerKey) return 'right'
    return null
  }

  // Check if trick is complete (all active players have played)
  const activePlayerCount = players.filter(
    (p) => p.key !== sittingOutPlayerKey
  ).length
  const trickIsComplete =
    currentTrick && isTrickComplete(currentTrick, activePlayerCount)

  return (
    <>
      {/* Current Trick Display - Center of screen */}
      {currentTrick && currentTrick.cards.length > 0 && (
        <div className={styles.trickContainer}>
          <div className={styles.trickCards}>
            {currentTrick.cards.map((playedCard: PlayedCard, index) => {
              const player = getPlayerForCard(playedCard.playerKey)
              const position = getPlayerPosition(playedCard.playerKey)
              const isWinner =
                currentTrick.winnerIndex !== null &&
                index === currentTrick.winnerIndex

              return (
                <div
                  key={`${playedCard.playerKey}-${index}`}
                  className={`${styles.trickCard} ${
                    styles[`trickCard-${position}`]
                  } ${isWinner ? styles.winner : ''}`}
                >
                  <Image
                    src={getCardImagePath(playedCard.card)}
                    alt={`${playedCard.card.rank} of ${playedCard.card.suit}`}
                    width={100}
                    height={140}
                    className={styles.trickCardImage}
                  />
                  {player && (
                    <div className={styles.trickCardPlayer}>
                      {player.nickname}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {trickIsComplete &&
            currentTrick.winnerIndex !== null &&
            currentTrick.winnerPlayerKey && (
              <div className={styles.trickWinner}>
                {getPlayerForCard(currentTrick.winnerPlayerKey)?.nickname} wins
                the hand!
              </div>
            )}
        </div>
      )}

      {/* Waiting Box - Show for all players */}
      {currentPlayerKey && (
        <WaitingBox
          message={
            isMyTurn
              ? 'Your turn to lay'
              : `${currentPlayerInfo?.nickname || 'Player'}'s turn`
          }
        />
      )}

      {/* Note: Player's hand is now clickable in the bottom row, so we don't need a separate playable hand here */}
    </>
  )
}
