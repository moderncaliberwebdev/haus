import { useEffect, useMemo, useState } from 'react'
import { db } from './firebase'
import {
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
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
      const names = entries.map((p) => (p?.nickname || '').trim()).filter(Boolean)
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
      const names = entries.map((p) => (p?.nickname || '').trim()).filter(Boolean)
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

  // cleanup on tab close
  useEffect(() => {
    function handleBeforeUnload() {
      if (hosting && roomCode) remove(ref(db, `games/${roomCode}`))
      if (playerKey && joinCode) remove(ref(db, `games/${joinCode}/players/${playerKey}`))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hosting, roomCode, playerKey, joinCode])

  const codeText = useMemo(() => '.'.repeat(dots), [dots])

  function generateRoomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let out = ''
    for (let i = 0; i < 5; i++) out += letters[Math.floor(Math.random() * letters.length)]
    return out
  }

  async function startGame() {
    const code = generateRoomCode()
    setRoomCode(code)
    setHosting(true)
    setJoining(false)
    const gameRef = ref(db, `games/${code}`)
    await set(gameRef, { createdAt: serverTimestamp(), status: 'lobby' })
    onDisconnect(gameRef).remove()
  }

  async function closeHost() {
    if (roomCode) await remove(ref(db, `games/${roomCode}`))
    setHosting(false)
    setRoomCode('')
    setPlayersCount(0)
  }

  async function joinGame() {
    if (!joinCode || !nickname) return
    const playersSnap = await get(ref(db, `games/${joinCode}/players`))
    const taken = Object.values(playersSnap.val() || {}).some(
      (p: any) => String(p?.nickname || '').trim().toLowerCase() === nickname.trim().toLowerCase()
    )
    if (taken) {
      setJoinError('Someone else is already using that nickname.')
      return
    }
    const listRef = ref(db, `games/${joinCode}/players`)
    const newRef = push(listRef)
    await set(newRef, { nickname, joinedAt: serverTimestamp() })
    setPlayerKey(newRef.key || '')
    onDisconnect(newRef).remove()
    setHasJoined(true)
    setJoinError('')
  }

  async function closeJoin() {
    if (playerKey && joinCode) await remove(ref(db, `games/${joinCode}/players/${playerKey}`))
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
    // setters
    setJoining,
    setJoinCode,
    setNickname,
    // actions
    startGame,
    joinGame,
    closeJoin,
    closeHost,
  }
}


