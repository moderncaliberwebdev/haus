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
      const status = data?.status || 'lobby'
      setGameStatus(status)
      // Update localStorage when game status changes
      localStorage.setItem('activeGameStatus', status)
    })
    return () => off(gameRef)
  }, [hosting, roomCode])

  // joiner: listen for game status to navigate
  useEffect(() => {
    if (!hasJoined || !joinCode) return
    const gameRef = ref(db, `games/${joinCode}`)
    const unsub = onValue(gameRef, (snap) => {
      const data = snap.val()
      const status = data?.status || 'lobby'
      setGameStatus(status)
      // Update localStorage when game status changes
      localStorage.setItem('activeGameStatus', status)
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
    // Store host info in localStorage for rejoin
    if (nickname.trim()) {
      localStorage.setItem(`nickname_${code}`, nickname)
    }
    // Store active game info for rejoin
    localStorage.setItem('activeGameCode', code)
    localStorage.setItem('activeGameRole', 'host')
    localStorage.setItem('activeGameStatus', 'lobby')
  }

  async function closeHost() {
    if (roomCode) await remove(ref(db, `games/${roomCode}`))
    // Clear active game from localStorage
    localStorage.removeItem('activeGameCode')
    localStorage.removeItem('activeGameRole')
    localStorage.removeItem('activeGameStatus')
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
    // Update game status in localStorage
    localStorage.setItem('activeGameStatus', 'active')
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
    // Store in localStorage for game page and rejoin
    if (playerKey) {
      localStorage.setItem(`playerKey_${joinCode}`, playerKey)
      localStorage.setItem(`nickname_${joinCode}`, nickname)
    }
    // Store active game info for rejoin
    localStorage.setItem('activeGameCode', joinCode)
    localStorage.setItem('activeGameRole', 'joiner')
    // Check current game status
    const gameRef = ref(db, `games/${joinCode}`)
    const gameSnap = await get(gameRef)
    const gameData = gameSnap.val()
    const gameStatus = gameData?.status || 'lobby'
    localStorage.setItem('activeGameStatus', gameStatus)

    setHasJoined(true)
    setJoinError('')
  }

  async function closeJoin() {
    if (playerKey && joinCode)
      await remove(ref(db, `games/${joinCode}/players/${playerKey}`))
    // Clear active game from localStorage
    localStorage.removeItem('activeGameCode')
    localStorage.removeItem('activeGameRole')
    localStorage.removeItem('activeGameStatus')
    setPlayerKey('')
    setJoining(false)
    setHasJoined(false)
  }

  // Auto-rejoin on page load
  useEffect(() => {
    if (typeof window === 'undefined') return

    const activeGameCode = localStorage.getItem('activeGameCode')
    const activeGameRole = localStorage.getItem('activeGameRole')
    const activeGameStatus = localStorage.getItem('activeGameStatus')

    if (!activeGameCode || !activeGameRole) return

    // If game is active, redirect to game page immediately
    if (activeGameStatus === 'active') {
      // Check if we're already on the game page
      if (!window.location.pathname.startsWith(`/game/${activeGameCode}`)) {
        window.location.href = `/game/${activeGameCode}`
      }
      return
    }

    // If game is in lobby, rejoin them to the lobby
    if (activeGameStatus === 'lobby') {
      if (activeGameRole === 'host') {
        const storedNickname =
          localStorage.getItem(`nickname_${activeGameCode}`) || ''
        setRoomCode(activeGameCode)
        setHosting(true)
        setNickname(storedNickname)
      } else {
        const storedNickname =
          localStorage.getItem(`nickname_${activeGameCode}`) || ''
        const storedPlayerKey = localStorage.getItem(
          `playerKey_${activeGameCode}`
        )
        setJoinCode(activeGameCode)
        setNickname(storedNickname)
        if (storedPlayerKey) {
          setPlayerKey(storedPlayerKey)
          setHasJoined(true)
        }
      }
    }
  }, []) // Run once on mount

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
