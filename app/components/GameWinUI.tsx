'use client'
import { type Player } from '../lib/gameStart'
import { createTeams } from '../lib/teamLogic'
import { useRouter } from 'next/navigation'
import styles from './GameWinUI.module.scss'

interface GameWinUIProps {
  winningTeam: 1 | 2
  team1Score: number
  team2Score: number
  players: Player[]
  leaveGame: () => void
}

export default function GameWinUI({
  winningTeam,
  team1Score,
  team2Score,
  players,
  leaveGame,
}: GameWinUIProps) {
  const router = useRouter()
  const { team1, team2 } = createTeams(players, [team1Score, team2Score])
  const winningTeamData = winningTeam === 1 ? team1 : team2

  return (
    <div className={styles.gameWinUI}>
      <div className={styles.content}>
        <h1 className={styles.title}>Game Over!</h1>
        <div className={styles.winner}>
          {winningTeamData.players.map((p, idx) => (
            <span key={p.key}>
              {p.nickname}
              {idx < winningTeamData.players.length - 1 && ' & '}
            </span>
          ))}{' '}
          won the game!
        </div>
        <div className={styles.finalScores}>
          <div className={styles.teamScore}>
            <div className={styles.teamName}>
              {team1.players.map((p, idx) => (
                <span key={p.key}>
                  {p.nickname}
                  {idx < team1.players.length - 1 && ' & '}
                </span>
              ))}
            </div>
            <div className={styles.score}>{team1Score}</div>
          </div>
          <div className={styles.teamScore}>
            <div className={styles.teamName}>
              {team2.players.map((p, idx) => (
                <span key={p.key}>
                  {p.nickname}
                  {idx < team2.players.length - 1 && ' & '}
                </span>
              ))}
            </div>
            <div className={styles.score}>{team2Score}</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.leaveButton} onClick={leaveGame}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  )
}
