'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.scss'
import { getCardImagePath, type Card, handleDeal } from '../../lib/dealLogic'
import {
  type Player,
  useGameExistenceCheck,
  useCurrentPlayerInfo,
  useGameState,
  usePlayersList,
  getCurrentPlayerIndex,
  getPositionedPlayers,
  getImageFromRole,
  isCurrentPlayerDealer,
  getDealerIndex,
  getHandForPosition,
} from '../../lib/gameStart'
import BiddingUI from '../../components/BiddingUI'
import TrumpSelectionUI from '../../components/TrumpSelectionUI'
import CardExchangeUI from '../../components/CardExchangeUI'
import {
  type Bid,
  type BidType,
  getBiddingWinner,
} from '../../lib/biddingLogic'
import {
  submitBid,
  startBidding,
  parseBidsFromFirebase,
} from '../../lib/biddingState'
import { submitTrumpSelection } from '../../lib/trumpState'
import {
  submitCardsForExchange,
  areBothPlayersReady,
  completeCardExchange,
} from '../../lib/cardExchangeState'
import { isSpecialBid } from '../../lib/specialBidLogic'
import { type Suit } from '../../lib/dealLogic'

export default function GamePage() {
  const params = useParams()
  const gameCode = params?.gameCode as string
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerKey, setCurrentPlayerKey] = useState<string>('')
  const [currentPlayerNickname, setCurrentPlayerNickname] = useState<string>('')
  const [dealerKey, setDealerKey] = useState<string>('')
  const [hands, setHands] = useState<Card[][]>([])
  const [isDealing, setIsDealing] = useState(false)
  const [dealingIndex, setDealingIndex] = useState(0)
  const [gamePhase, setGamePhase] = useState<string>('dealing')
  const [biddingState, setBiddingState] = useState<any>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [currentBidderIndex, setCurrentBidderIndex] = useState<number | null>(
    null
  )
  const [biddingWinnerKey, setBiddingWinnerKey] = useState<string | null>(null)
  const [trump, setTrump] = useState<string | null>(null)
  const [cardExchangeState, setCardExchangeState] = useState<any>(null)

  // Use extracted hooks
  useGameExistenceCheck(gameCode)
  useCurrentPlayerInfo(gameCode, setCurrentPlayerKey, setCurrentPlayerNickname)
  useGameState(
    gameCode,
    setDealerKey,
    setHands,
    setGamePhase,
    setBiddingState,
    setBiddingWinnerKey,
    setTrump,
    setCardExchangeState
  )
  usePlayersList(gameCode, setPlayers)

  // Get current player index
  const currentPlayerIndex = useMemo(
    () => getCurrentPlayerIndex(players, currentPlayerKey),
    [players, currentPlayerKey]
  )

  // Get positioned players: current at bottom, others at left, top, right
  const positionedPlayers = useMemo(
    () => getPositionedPlayers(players, currentPlayerIndex),
    [players, currentPlayerIndex]
  )

  // Check if current player is dealer
  const isCurrentPlayerDealerValue = useMemo(
    () => isCurrentPlayerDealer(currentPlayerKey, dealerKey),
    [currentPlayerKey, dealerKey]
  )

  // Get dealer index in players array
  const dealerIndex = useMemo(
    () => getDealerIndex(players, dealerKey),
    [players, dealerKey]
  )

  // Parse bidding state from Firebase
  useEffect(() => {
    if (biddingState) {
      setCurrentBidderIndex(biddingState.currentBidderIndex ?? null)
      const parsedBids = parseBidsFromFirebase(biddingState)
      setBids(parsedBids)
    }
  }, [biddingState])

  // Start bidding phase when deal completes
  useEffect(() => {
    const isDealComplete =
      hands.length > 0 && hands.every((hand) => hand.length === 8)
    if (
      isDealComplete &&
      gamePhase === 'dealing' &&
      dealerIndex !== -1 &&
      players.length === 4
    ) {
      startBidding(gameCode, dealerIndex)
    }
  }, [hands, gamePhase, dealerIndex, gameCode, players.length])

  // Handle deal button click
  const onDeal = async () => {
    if (!gameCode || dealerIndex === -1 || isDealing) return

    setIsDealing(true)
    setDealingIndex(0)

    try {
      await handleDeal(gameCode, dealerIndex, players.length, (progress) => {
        setDealingIndex(progress.dealingIndex)
      })
    } finally {
      setIsDealing(false)
      setDealingIndex(0)
    }
  }

  // Get hand for a specific player position
  const getHandForPositionLocal = (
    position: 'bottom' | 'left' | 'top' | 'right'
  ): Card[] => {
    return getHandForPosition(positionedPlayers, position, hands, players)
  }

  // Check if deal is complete (all hands have cards)
  const isDealComplete = useMemo(() => {
    if (hands.length === 0) return false
    // Check if all 4 players have 8 cards each
    return hands.every((hand) => hand.length === 8)
  }, [hands])

  // Get current bidder key
  const currentBidderKey = useMemo(() => {
    if (currentBidderIndex === null || currentBidderIndex === -1) return null
    return players[currentBidderIndex]?.key || null
  }, [currentBidderIndex, players])

  // Handle bid submission
  const handleBid = async (bid: BidType) => {
    if (!currentBidderKey || currentBidderIndex === null) return
    await submitBid(
      gameCode,
      currentPlayerKey,
      currentPlayerIndex,
      bid,
      bids,
      dealerIndex,
      players
    )
  }

  // Get winning bid type for trump selection logic
  const winningBid = useMemo(() => {
    if (bids.length === 0) return null
    const winner = getBiddingWinner(bids)
    const bid = winner?.bid || null
    // Convert bid to string if it's a number
    if (bid === null) return null
    return typeof bid === 'number' ? String(bid) : bid
  }, [bids])

  // Handle trump selection
  const handleTrumpSelection = async (trumpSuit: Suit) => {
    await submitTrumpSelection(gameCode, trumpSuit, winningBid)
  }

  // Get current player's hand
  const currentPlayerHand = useMemo(() => {
    if (currentPlayerIndex === -1 || hands.length === 0) return []
    return hands[currentPlayerIndex] || []
  }, [currentPlayerIndex, hands])

  // Get partner for bidding winner
  const biddingWinnerPartner = useMemo(() => {
    if (!biddingWinnerKey || players.length === 0) return null
    const winnerIndex = players.findIndex((p) => p.key === biddingWinnerKey)
    if (winnerIndex === -1) return null
    const partnerIndex = (winnerIndex + 2) % 4
    return players[partnerIndex] || null
  }, [biddingWinnerKey, players])

  // Handle card exchange submission
  const handleCardExchange = async (cards: Card[]) => {
    await submitCardsForExchange(gameCode, currentPlayerKey, cards)
  }

  // Check if both players are ready and complete exchange
  useEffect(() => {
    if (
      gamePhase === 'card-exchange' &&
      biddingWinnerKey &&
      biddingWinnerPartner &&
      cardExchangeState
    ) {
      const bothReady = areBothPlayersReady(
        cardExchangeState,
        biddingWinnerKey,
        biddingWinnerPartner.key
      )
      if (bothReady) {
        // Complete the exchange automatically
        completeCardExchange(
          gameCode,
          players,
          biddingWinnerKey,
          cardExchangeState
        ).catch((err) => {
          console.error('Error completing card exchange:', err)
        })
      }
    }
  }, [
    gamePhase,
    biddingWinnerKey,
    biddingWinnerPartner,
    cardExchangeState,
    gameCode,
    players,
  ])

  // If no players, redirect back
  if (players.length === 0) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>Loading game...</div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.gameContainer}>
        {/* Top Player */}
        {positionedPlayers.top && (
          <div
            className={`${styles.playerPosition} ${styles.playerPositionTop}`}
          >
            {/* Cards */}
            {getHandForPositionLocal('top').length > 0 && (
              <div className={`${styles.cardHand} ${styles.cardHandTop}`}>
                {getHandForPositionLocal('top').map((card, idx) => (
                  <div
                    key={card.id}
                    className={`${styles.card} ${styles.cardTop}`}
                    style={{
                      transform: `translateX(${(idx - 3.5) * 2.5}%)`,
                      zIndex: idx,
                    }}
                  >
                    <Image
                      src='/Card Back.png'
                      alt='Card back'
                      fill
                      className={styles.cardImage}
                    />
                  </div>
                ))}
              </div>
            )}
            <Image
              src={getImageFromRole(positionedPlayers.top.role)}
              alt={positionedPlayers.top.nickname}
              width={80}
              height={80}
              className={styles.avatar}
            />
            <div className={styles.playerName}>
              {positionedPlayers.top.nickname}
            </div>
          </div>
        )}

        {/* Left Player */}
        {positionedPlayers.left && (
          <div
            className={styles.playerPosition}
            style={{ left: '2%', top: '50%', transform: 'translateY(-50%)' }}
          >
            {/* Cards */}
            {getHandForPositionLocal('left').length > 0 && (
              <div className={`${styles.cardHand} ${styles.cardHandLeft}`}>
                {getHandForPositionLocal('left').map((card, idx) => (
                  <div
                    key={card.id}
                    className={`${styles.card} ${styles.cardLeft}`}
                    style={{
                      transform: `rotate(90deg)`,
                      zIndex: idx,
                    }}
                  >
                    <Image
                      src='/Card Back.png'
                      alt='Card back'
                      fill
                      className={styles.cardImage}
                    />
                  </div>
                ))}
              </div>
            )}
            <Image
              src={getImageFromRole(positionedPlayers.left.role)}
              alt={positionedPlayers.left.nickname}
              width={80}
              height={80}
              className={styles.avatar}
            />
            <div className={styles.playerName}>
              {positionedPlayers.left.nickname}
            </div>
          </div>
        )}

        {/* Right Player */}
        {positionedPlayers.right && (
          <div
            className={styles.playerPosition}
            style={{ right: '2%', top: '50%', transform: 'translateY(-50%)' }}
          >
            {/* Cards */}
            {getHandForPositionLocal('right').length > 0 && (
              <div className={`${styles.cardHand} ${styles.cardHandRight}`}>
                {getHandForPositionLocal('right').map((card, idx) => (
                  <div
                    key={card.id}
                    className={`${styles.card} ${styles.cardRight}`}
                    style={{
                      transform: `rotate(-90deg)`,
                      zIndex: idx,
                    }}
                  >
                    <Image
                      src='/Card Back.png'
                      alt='Card back'
                      fill
                      className={styles.cardImage}
                    />
                  </div>
                ))}
              </div>
            )}
            <Image
              src={getImageFromRole(positionedPlayers.right.role)}
              alt={positionedPlayers.right.nickname}
              width={80}
              height={80}
              className={styles.avatar}
            />
            <div className={styles.playerName}>
              {positionedPlayers.right.nickname}
            </div>
          </div>
        )}

        {/* Bottom Player (Current Player) */}
        {positionedPlayers.bottom && (
          <div
            className={`${styles.playerPosition} ${styles.playerPositionBottom}`}
          >
            {/* Cards - Show face up for current player */}
            {getHandForPositionLocal('bottom').length > 0 && (
              <div className={`${styles.cardHand} ${styles.cardHandBottom}`}>
                {getHandForPositionLocal('bottom').map((card, idx) => (
                  <div
                    key={card.id}
                    className={`${styles.card} ${styles.cardBottom}`}
                    style={{
                      transform: `translateX(${(idx - 3.5) * 3.5}%)`,
                      zIndex: idx,
                    }}
                  >
                    <Image
                      src={getCardImagePath(card)}
                      alt={`${card.rank} of ${card.suit}`}
                      fill
                      className={styles.cardImage}
                    />
                  </div>
                ))}
              </div>
            )}
            <Image
              src={getImageFromRole(positionedPlayers.bottom.role)}
              alt={positionedPlayers.bottom.nickname}
              width={80}
              height={80}
              className={styles.avatar}
            />
            <div className={styles.playerName}>
              {positionedPlayers.bottom.nickname}
            </div>
          </div>
        )}

        {/* Bidding UI - Show during bidding phase */}
        {gamePhase === 'bidding' && currentBidderKey && (
          <BiddingUI
            currentBidderKey={currentBidderKey}
            currentPlayerKey={currentPlayerKey}
            bids={bids}
            players={players}
            positionedPlayers={positionedPlayers}
            dealerIndex={dealerIndex}
            onBid={handleBid}
          />
        )}

        {/* Trump Selection UI - Show during trump selection phase */}
        {gamePhase === 'trump-selection' &&
          biddingWinnerKey &&
          winningBid !== 'ace-haus' && (
            <TrumpSelectionUI
              biddingWinnerKey={biddingWinnerKey}
              currentPlayerKey={currentPlayerKey}
              onSelectTrump={handleTrumpSelection}
            />
          )}

        {/* Card Exchange UI - Show during card exchange phase for special bids */}
        {gamePhase === 'card-exchange' &&
          biddingWinnerKey &&
          isSpecialBid(winningBid) && (
            <CardExchangeUI
              biddingWinnerKey={biddingWinnerKey}
              currentPlayerKey={currentPlayerKey}
              players={players}
              hand={currentPlayerHand}
              exchangeData={cardExchangeState || {}}
              onSelectCards={handleCardExchange}
            />
          )}

        {/* Center Deck - Only show if deal not complete */}
        {!isDealComplete && (
          <div className={styles.deckContainer}>
            <div className={styles.deck}>
              <Image
                src='/Card Back.png'
                alt='Card back'
                width={120}
                height={168}
                className={styles.cardBack}
                style={{ zIndex: 4 }}
              />
              <Image
                src='/Card Back.png'
                alt='Card back'
                width={120}
                height={168}
                className={styles.cardBack}
                style={{ zIndex: 3, transform: 'translate(3px, 3px)' }}
              />
              <Image
                src='/Card Back.png'
                alt='Card back'
                width={120}
                height={168}
                className={styles.cardBack}
                style={{ zIndex: 2, transform: 'translate(6px, 6px)' }}
              />
              <Image
                src='/Card Back.png'
                alt='Card back'
                width={120}
                height={168}
                className={styles.cardBack}
                style={{ zIndex: 1, transform: 'translate(9px, 9px)' }}
              />
            </div>
            {isCurrentPlayerDealerValue && !isDealComplete && (
              <button
                className={styles.dealButton}
                onClick={onDeal}
                disabled={isDealing}
              >
                {isDealing ? 'Dealing...' : 'Deal'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
