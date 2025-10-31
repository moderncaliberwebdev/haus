import { useEffect, useMemo, useState } from 'react'
import { db } from './firebase'
import {
  off,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  get,
} from 'firebase/database'

export function useLobbyLogic() {
  const [joining, setJoining] = useState(false)
  const [hosting, setHosting] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [playersCount, setPlayersCount] = useState(0)
  const [dots, setDots] = useState(1)
  const [playerKey, setPlayerKey] = useState<string>('')
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [joinError, setJoinError] = useState('')
  const [hostDisconnected, setHostDisconnected] = useState(false)

  // animate waiting dots 1..3 for host or joined player
  useEffect(() => {
    if (!hosting && !hasJoined) return
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 1000)
    return () => clearInterval(id)
  }, [hosting, hasJoined])

  // host: subscribe to players list
  useEffect(() => {
    if (!hosting || !roomCode) return
    const playersRef = ref(db, `games/${roomCode}/players`)
    const unsub = onValue(playersRef, (snap) => {
      const val = snap.val() || {}
      const entries = Object.values(val) as { nickname?: string }[]
      const names = entries
        .map((p) => (p?.nickname || '').trim())
        .filter(Boolean)
      setPlayersCount(names.length)
      setPlayerNames(names.slice(0, 3))
    })
    return () => off(playersRef)
  }, [hosting, roomCode])

  // joiner: subscribe to players list
  useEffect(() => {
    if (!hasJoined || !joinCode) return
    const playersRef = ref(db, `games/${joinCode}/players`)
    const unsub = onValue(playersRef, (snap) => {
      const val = snap.val() || {}
      const entries = Object.values(val) as { nickname?: string }[]
      const names = entries
        .map((p) => (p?.nickname || '').trim())
        .filter(Boolean)
      setPlayersCount(names.length)
      setPlayerNames(names.slice(0, 3))
    })
    return () => off(playersRef)
  }, [hasJoined, joinCode])

  // joiner: detect host/game removal
  useEffect(() => {
    if (!hasJoined || !joinCode) return
    const gameRef = ref(db, `games/${joinCode}`)
    const unsub = onValue(gameRef, (snap) => {
      setHostDisconnected(!snap.exists())
    })
    return () => off(gameRef)
  }, [hasJoined, joinCode])

  // host: listen for game status to navigate
  const [gameStatus, setGameStatus] = useState<'lobby' | 'active' | null>(null)
  useEffect(() => {
    if (!hosting || !roomCode) return
    const gameRef = ref(db, `games/${roomCode}`)
    const unsub = onValue(gameRef, (snap) => {
      const data = snap.val()
      setGameStatus(data?.status || 'lobby')
    })
    return () => off(gameRef)
  }, [hosting, roomCode])

  // joiner: listen for game status to navigate
  useEffect(() => {
    if (!hasJoined || !joinCode) return
    const gameRef = ref(db, `games/${joinCode}`)
    const unsub = onValue(gameRef, (snap) => {
      const data = snap.val()
      setGameStatus(data?.status || 'lobby')
    })
    return () => off(gameRef)
  }, [hasJoined, joinCode])

  const codeText = useMemo(() => '.'.repeat(dots), [dots])

  function generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let out = ''
    for (let i = 0; i < 5; i++)
      out += letters[Math.floor(Math.random() * letters.length)]
    return out
  }

  async function startGame() {
    const code = generateRoomCode()
    setRoomCode(code)
    setHosting(true)
    setJoining(false)
    const gameRef = ref(db, `games/${code}`)
    await set(gameRef, { createdAt: serverTimestamp(), status: 'lobby' })
    // Store host info in localStorage (host will be first player)
    if (nickname.trim()) {
      localStorage.setItem(`nickname_${code}`, nickname)
    }
  }

  async function closeHost() {
    if (roomCode) await remove(ref(db, `games/${roomCode}`))
    setHosting(false)
    setRoomCode('')
    setPlayersCount(0)
  }

  async function startGameSession() {
    if (!roomCode || playersCount < 3 || !nickname.trim()) return // Need at least 3 other players + host 4 total
    // Get host player key (host is not in players list, need to add them)
    const playersRef = ref(db, `games/${roomCode}/players`)
    const playersSnap = await get(playersRef)
    const existingPlayers = playersSnap.val() || {}

    // Check if host already has a player entry
    const hostExists = Object.values(existingPlayers).some(
      (p: any) =>
        String(p?.nickname || '')
          .trim()
          .toLowerCase() === nickname.trim().toLowerCase()
    )

    if (!hostExists) {
      // Add host as first player
      const newRef = push(playersRef)
      const hostKey = newRef.key || ''
      await set(newRef, { nickname, joinedAt: serverTimestamp(), isHost: true })
      setPlayerKey(hostKey)
      if (hostKey) {
        localStorage.setItem(`playerKey_${roomCode}`, hostKey)
        localStorage.setItem(`nickname_${roomCode}`, nickname)
      }
    }

    const gameRef = ref(db, `games/${roomCode}`)
    // Use update() instead of set() to preserve existing data (like players)
    await update(gameRef, {
      status: 'active',
      startedAt: serverTimestamp(),
    })
    // Navigation will be handled by the component
    return roomCode
  }

  async function joinGame() {
    if (!joinCode || !nickname) return
    const playersSnap = await get(ref(db, `games/${joinCode}/players`))
    const players = playersSnap.val() || {}
    const playersList = Object.values(players) as { nickname?: string }[]
    if (playersList.length >= 3) {
      setJoinError('This game is full (3 players maximum).')
      return
    }
    const taken = playersList.some(
      (p: any) =>
        String(p?.nickname || '')
          .trim()
          .toLowerCase() === nickname.trim().toLowerCase()
    )
    if (taken) {
      setJoinError('Someone else is already using that nickname.')
      return
    }
    const listRef = ref(db, `games/${joinCode}/players`)
    const newRef = push(listRef)
    const playerKey = newRef.key || ''
    await set(newRef, { nickname, joinedAt: serverTimestamp() })
    setPlayerKey(playerKey)
    // Store in localStorage for game page
    if (playerKey) {
      localStorage.setItem(`playerKey_${joinCode}`, playerKey)
      localStorage.setItem(`nickname_${joinCode}`, nickname)
    }
    setHasJoined(true)
    setJoinError('')
  }

  async function closeJoin() {
    if (playerKey && joinCode)
      await remove(ref(db, `games/${joinCode}/players/${playerKey}`))
    setPlayerKey('')
    setJoining(false)
    setHasJoined(false)
  }

  return {
    // state
    joining,
    hosting,
    roomCode,
    joinCode,
    nickname,
    hasJoined,
    playersCount,
    playerNames,
    joinError,
    hostDisconnected,
    codeText,
    playerKey,
    gameStatus,
    // setters
    setJoining,
    setJoinCode,
    setNickname,
    // actions
    startGame,
    joinGame,
    closeJoin,
    closeHost,
    startGameSession,
  }
}
