'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { db } from '../../lib/firebase'
import { onValue, ref, get } from 'firebase/database'
import styles from './page.module.scss'

interface Player {
  nickname: string
  key: string
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameCode = params?.gameCode as string
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerKey, setCurrentPlayerKey] = useState<string>('')
  const [currentPlayerNickname, setCurrentPlayerNickname] = useState<string>('')

  // Get current player info from localStorage (set during join/host)
  useEffect(() => {
    const storedKey = localStorage.getItem(`playerKey_${gameCode}`)
    const storedNickname = localStorage.getItem(`nickname_${gameCode}`)
    if (storedKey) setCurrentPlayerKey(storedKey)
    if (storedNickname) setCurrentPlayerNickname(storedNickname)

    // Update active game info in localStorage
    localStorage.setItem('activeGameCode', gameCode)
    localStorage.setItem('activeGameStatus', 'active')
  }, [gameCode])

  // Subscribe to players list
  useEffect(() => {
    if (!gameCode) return
    const playersRef = ref(db, `games/${gameCode}/players`)
    const unsub = onValue(playersRef, (snap) => {
      const val = snap.val() || {}
      const playersList: Player[] = Object.entries(val).map(
        ([key, p]: [string, any]) => ({
          key,
          nickname: p?.nickname || '',
        })
      )
      // Sort by key to maintain consistent order
      playersList.sort((a, b) => a.key.localeCompare(b.key))
      setPlayers(playersList)
    })
    return () => unsub()
  }, [gameCode])

  // Get current player index
  const currentPlayerIndex = useMemo(() => {
    if (!currentPlayerKey) return -1
    return players.findIndex((p) => p.key === currentPlayerKey)
  }, [players, currentPlayerKey])

  // Get positioned players: current at bottom, others at left, top, right
  const positionedPlayers = useMemo(() => {
    if (currentPlayerIndex === -1 || players.length === 0)
      return { bottom: null, left: null, top: null, right: null }

    const currentPlayer = players[currentPlayerIndex]
    const otherPlayers = players.filter((_, idx) => idx !== currentPlayerIndex)

    return {
      bottom: currentPlayer, // Current player at bottom
      left: otherPlayers[0] || null, // Next player on left
      top: otherPlayers[1] || null, // Next player on top
      right: otherPlayers[2] || null, // Next player on right
    }
  }, [players, currentPlayerIndex])

  const imgs = ['/king.png', '/queen.png', '/jack.png', 'ace.png']

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
            className={styles.playerPosition}
            style={{ top: '2rem', left: '50%', transform: 'translateX(-50%)' }}
          >
            <Image
              src={imgs[1] || '/queen.png'}
              alt={positionedPlayers.top.nickname}
              width={80}
              height={80}
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
            style={{ left: '2rem', top: '50%', transform: 'translateY(-50%)' }}
          >
            <Image
              src={imgs[0] || '/king.png'}
              alt={positionedPlayers.left.nickname}
              width={80}
              height={80}
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
            style={{ right: '2rem', top: '50%', transform: 'translateY(-50%)' }}
          >
            <Image
              src={imgs[2] || '/jack.png'}
              alt={positionedPlayers.right.nickname}
              width={80}
              height={80}
            />
            <div className={styles.playerName}>
              {positionedPlayers.right.nickname}
            </div>
          </div>
        )}

        {/* Bottom Player (Current Player) */}
        {positionedPlayers.bottom && (
          <div
            className={styles.playerPosition}
            style={{
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Image
              src={imgs[currentPlayerIndex % 3] || '/ace.png'}
              alt={positionedPlayers.bottom.nickname}
              width={80}
              height={80}
            />
            <div className={styles.playerName}>
              {positionedPlayers.bottom.nickname}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
