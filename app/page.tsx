'use client'
import styles from './page.module.scss'
import { HeroCard } from './components/HeroCard'
import { JoinCard } from './components/JoinCard'
import { StartCard } from './components/StartCard'
import { useLobbyLogic } from './lib/lobbyLogic'

export default function Home() {
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
    setJoining,
    setJoinCode,
    setNickname,
    startGame,
    joinGame,
    closeJoin,
    closeHost,
  } = useLobbyLogic()

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
        />
      )}
    </main>
  )
}
