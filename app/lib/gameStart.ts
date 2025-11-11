import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from './firebase'
import { onValue, ref } from 'firebase/database'
import { type Card } from './dealLogic'

export interface Player {
  nickname: string
  key: string
  role?: string
}

export interface PositionedPlayers {
  bottom: Player | null
  left: Player | null
  top: Player | null
  right: Player | null
}

/**
 * Check if game exists in database, redirect if it doesn't
 */
export function useGameExistenceCheck(gameCode: string | null) {
  const router = useRouter()

  useEffect(() => {
    if (!gameCode) return
    const gameRef = ref(db, `games/${gameCode}`)
    const unsub = onValue(gameRef, (snap) => {
      if (!snap.exists()) {
        // Game no longer exists, redirect to home
        // Clear localStorage
        localStorage.removeItem('activeGameCode')
        localStorage.removeItem('activeGameStatus')
        localStorage.removeItem('activeGameRole')
        router.push('/')
      }
    })
    return () => unsub()
  }, [gameCode, router])
}

/**
 * Get current player info from localStorage and update active game info
 */
export function useCurrentPlayerInfo(
  gameCode: string | null,
  setCurrentPlayerKey: (key: string) => void,
  setCurrentPlayerNickname: (nickname: string) => void
) {
  useEffect(() => {
    if (!gameCode) return

    const storedKey = localStorage.getItem(`playerKey_${gameCode}`)
    const storedNickname = localStorage.getItem(`nickname_${gameCode}`)
    if (storedKey) setCurrentPlayerKey(storedKey)
    if (storedNickname) setCurrentPlayerNickname(storedNickname)

    // Update active game info in localStorage
    localStorage.setItem('activeGameCode', gameCode)
    localStorage.setItem('activeGameStatus', 'active')
  }, [gameCode, setCurrentPlayerKey, setCurrentPlayerNickname])
}

/**
 * Subscribe to game state (dealer, hands, phase, bidding, trump, cardExchange)
 */
export function useGameState(
  gameCode: string | null,
  setDealerKey: (key: string) => void,
  setHands: (hands: Card[][]) => void,
  setPhase?: (phase: string) => void,
  setBiddingState?: (state: any) => void,
  setBiddingWinner?: (key: string | null) => void,
  setTrump?: (trump: string | null) => void,
  setCardExchange?: (state: any) => void
) {
  useEffect(() => {
    if (!gameCode) return
    const gameRef = ref(db, `games/${gameCode}`)
    const unsub = onValue(gameRef, (snap) => {
      const gameData = snap.val() || {}
      setDealerKey(gameData.dealerKey || '')
      if (gameData.hands) {
        // Convert Firebase object format back to array format
        const handsArray: Card[][] = []
        for (let i = 0; i < 4; i++) {
          const playerHand = gameData.hands[i] || {}
          handsArray[i] = Object.values(playerHand) as Card[]
        }
        setHands(handsArray)
      }
      if (setPhase && gameData.phase) {
        setPhase(gameData.phase)
      }
      if (setBiddingState && gameData.bidding) {
        setBiddingState(gameData.bidding)
      }
      if (setBiddingWinner) {
        setBiddingWinner(gameData.biddingWinner || null)
      }
      if (setTrump) {
        setTrump(gameData.trump || null)
      }
      if (setCardExchange && gameData.cardExchange) {
        setCardExchange(gameData.cardExchange)
      }
    })
    return () => unsub()
  }, [
    gameCode,
    setDealerKey,
    setHands,
    setPhase,
    setBiddingState,
    setBiddingWinner,
    setTrump,
    setCardExchange,
  ])
}

/**
 * Subscribe to players list
 */
export function usePlayersList(
  gameCode: string | null,
  setPlayers: (players: Player[]) => void
) {
  useEffect(() => {
    if (!gameCode) return
    const playersRef = ref(db, `games/${gameCode}/players`)
    const unsub = onValue(playersRef, (snap) => {
      const val = snap.val() || {}
      const playersList: Player[] = Object.entries(val).map(
        ([key, p]: [string, any]) => ({
          key,
          nickname: p?.nickname || '',
          role: p?.role || '',
        })
      )
      // Sort by key to maintain consistent order
      playersList.sort((a, b) => a.key.localeCompare(b.key))
      setPlayers(playersList)
    })
    return () => unsub()
  }, [gameCode, setPlayers])
}

/**
 * Get current player index
 */
export function getCurrentPlayerIndex(
  players: Player[],
  currentPlayerKey: string
): number {
  if (!currentPlayerKey) return -1
  return players.findIndex((p) => p.key === currentPlayerKey)
}

/**
 * Get positioned players: current at bottom, others at left, top, right
 * Orders players clockwise starting from current player
 */
export function getPositionedPlayers(
  players: Player[],
  currentPlayerIndex: number
): PositionedPlayers {
  if (currentPlayerIndex === -1 || players.length === 0)
    return { bottom: null, left: null, top: null, right: null }

  const currentPlayer = players[currentPlayerIndex]
  const numPlayers = players.length

  // Order players clockwise: current at bottom, then left, top, right
  // For 4 players: bottom = i, left = (i+1)%4, top = (i+2)%4, right = (i+3)%4
  return {
    bottom: currentPlayer, // Current player at bottom
    left: players[(currentPlayerIndex + 1) % numPlayers] || null, // Next player clockwise (left)
    top: players[(currentPlayerIndex + 2) % numPlayers] || null, // Two positions ahead (top)
    right: players[(currentPlayerIndex + 3) % numPlayers] || null, // Three positions ahead (right)
  }
}

/**
 * Helper function to get image path from role
 */
export function getImageFromRole(role: string | undefined): string {
  const roleToImage: Record<string, string> = {
    king: '/king.png',
    queen: '/queen.png',
    jack: '/jack.png',
    ace: '/ace.png',
  }
  return roleToImage[role || ''] || '/ace.png'
}

/**
 * Check if current player is dealer
 */
export function isCurrentPlayerDealer(
  currentPlayerKey: string,
  dealerKey: string
): boolean {
  return currentPlayerKey === dealerKey
}

/**
 * Get dealer index in players array
 */
export function getDealerIndex(players: Player[], dealerKey: string): number {
  if (!dealerKey) return -1
  return players.findIndex((p) => p.key === dealerKey)
}

/**
 * Get player hand index based on their position
 */
export function getPlayerHandIndex(
  players: Player[],
  playerKey: string
): number {
  const playerIdx = players.findIndex((p) => p.key === playerKey)
  return playerIdx
}

/**
 * Get hand for a specific player position
 */
export function getHandForPosition(
  positionedPlayers: PositionedPlayers,
  position: 'bottom' | 'left' | 'top' | 'right',
  hands: Card[][],
  players: Player[]
): Card[] {
  if (!positionedPlayers[position] || hands.length === 0) return []
  const playerKey = positionedPlayers[position]?.key
  if (!playerKey) return []
  const handIndex = getPlayerHandIndex(players, playerKey)
  return hands[handIndex] || []
}
