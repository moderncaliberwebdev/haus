'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import { HeroCard } from './components/HeroCard'
import { JoinCard } from './components/JoinCard'
import { StartCard } from './components/StartCard'
import { useLobbyLogic } from './lib/lobbyLogic'

export default function Home() {
  const router = useRouter()
  const {
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
    gameStatus,
    setJoining,
    setJoinCode,
    setNickname,
    startGame,
    joinGame,
    closeJoin,
    closeHost,
    startGameSession,
  } = useLobbyLogic()

  async function handleStartGame() {
    const code = await startGameSession()
    if (code) {
      router.push(`/game/${code}`)
    }
  }

  // Auto-navigate players when game starts
  useEffect(() => {
    if (gameStatus === 'active') {
      const code = hosting ? roomCode : joinCode
      if (code) {
        router.push(`/game/${code}`)
      }
    }
  }, [gameStatus, hosting, roomCode, joinCode, router])

  return (
    <main className={styles.main}>
      {!joining && !hosting ? (
        <HeroCard onJoin={() => setJoining(true)} onStart={startGame} />
      ) : joining ? (
        <JoinCard
          hasJoined={hasJoined}
          joinCode={joinCode}
          nickname={nickname}
          joinError={joinError}
          codeText={codeText}
          playerNames={playerNames}
          hostDisconnected={hostDisconnected}
          onClose={closeJoin}
          onJoin={joinGame}
          setJoinCode={setJoinCode}
          setNickname={setNickname}
        />
      ) : (
        <StartCard
          roomCode={roomCode}
          nickname={nickname}
          setNickname={setNickname}
          playersCount={playersCount}
          playerNames={playerNames}
          codeText={codeText}
          onClose={closeHost}
          onStartGame={handleStartGame}
        />
      )}
    </main>
  )
}
