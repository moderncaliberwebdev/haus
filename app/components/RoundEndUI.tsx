'use client'
import { type Player } from '../lib/gameStart'
import { createTeams } from '../lib/teamLogic'
import styles from './RoundEndUI.module.scss'

interface RoundEndUIProps {
  roundWinner: 1 | 2
  team1Score: number
  team2Score: number
  roundPoints: number
  players: Player[]
}

export default function RoundEndUI({
  roundWinner,
  team1Score,
  team2Score,
  roundPoints,
  players,
}: RoundEndUIProps) {
  const { team1, team2 } = createTeams(players, [team1Score, team2Score])
  const winningTeam = roundWinner === 1 ? team1 : team2
  const losingTeam = roundWinner === 1 ? team2 : team1

  return (
    <div className={styles.roundEndUI}>
      <div className={styles.content}>
        <h2 className={styles.title}>Round Complete!</h2>
        <div className={styles.winner}>
          {winningTeam.players.map((p, idx) => (
            <span key={p.key}>
              {p.nickname}
              {idx < winningTeam.players.length - 1 && ' & '}
            </span>
          ))}{' '}
          won the round!
        </div>
        <div className={styles.scores}>
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
            {roundWinner === 1 && (
              <div className={styles.points}>+{Math.abs(roundPoints)}</div>
            )}
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
            {roundWinner === 2 && (
              <div className={styles.points}>+{Math.abs(roundPoints)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

