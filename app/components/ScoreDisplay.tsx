'use client'
import { type Player } from '../lib/gameStart'
import { createTeams, type Team } from '../lib/teamLogic'
import { type Trick } from '../lib/trickLogic'
import styles from './ScoreDisplay.module.scss'

interface ScoreDisplayProps {
  players: Player[]
  team1Score: number
  team2Score: number
  currentTricks: Trick[]
  biddingTeam: 1 | 2 | null
}

export default function ScoreDisplay({
  players,
  team1Score,
  team2Score,
  currentTricks,
  biddingTeam,
}: ScoreDisplayProps) {
  const { team1, team2 } = createTeams(players, [team1Score, team2Score])

  // Count tricks won by each team in current round
  const team1Tricks = currentTricks.filter(
    (trick) => trick.winnerTeam === 1
  ).length
  const team2Tricks = currentTricks.filter(
    (trick) => trick.winnerTeam === 2
  ).length

  return (
    <div className={styles.scoreDisplay}>
      {/* Team 1 */}
      <div className={styles.teamScore}>
        <div className={styles.teamPlayers}>
          {team1.players.map((player, idx) => (
            <div key={player.key} className={styles.playerName}>
              {player.nickname}
              {idx < team1.players.length - 1 && ' & '}
            </div>
          ))}
        </div>
        <div className={styles.score}>{team1Score}</div>
        <div className={styles.trickCount}>Tricks: {team1Tricks}</div>
      </div>

      {/* Team 2 */}
      <div className={styles.teamScore}>
        <div className={styles.teamPlayers}>
          {team2.players.map((player, idx) => (
            <div key={player.key} className={styles.playerName}>
              {player.nickname}
              {idx < team2.players.length - 1 && ' & '}
            </div>
          ))}
        </div>
        <div className={styles.score}>{team2Score}</div>
        <div className={styles.trickCount}>Tricks: {team2Tricks}</div>
      </div>
    </div>
  )
}
