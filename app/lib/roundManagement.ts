import { ref, update, get } from 'firebase/database'
import { db } from './firebase'
import { type Player } from './gameStart'
import { type BidType } from './biddingLogic'
import {
  calculateRoundPoints,
  getTricksWonByTeam,
  getRoundWinner,
  hasTeamWonGame,
} from './scoringLogic'
import { getTeamForPlayer } from './teamLogic'
import { type Trick } from './trickLogic'

/**
 * Moves the dealer to the left (clockwise rotation)
 */
export function getNextDealerIndex(currentDealerIndex: number): number {
  return (currentDealerIndex + 1) % 4
}

/**
 * Calculates and updates scores after a round completes
 */
export async function calculateRoundScores(
  gameCode: string,
  winningBid: BidType,
  biddingWinnerKey: string,
  tricks: Trick[],
  players: Player[],
  currentScores: [number, number] = [0, 0]
): Promise<{
  team1Score: number
  team2Score: number
  roundWinner: 1 | 2
  points: number
}> {
  // Determine which team made the bid
  const biddingTeam = getTeamForPlayer(players, biddingWinnerKey)
  if (!biddingTeam) {
    throw new Error('Bidding winner not found in players')
  }

  // Count tricks won by each team
  const { team1, team2 } = getTricksWonByTeam(tricks, players)

  // Determine which team won the round
  const tricksWonByBiddingTeam =
    biddingTeam === 1 ? team1 : team2
  const roundWinner = getRoundWinner(
    winningBid,
    tricksWonByBiddingTeam,
    biddingTeam
  )!

  // Calculate points for this round
  const points = calculateRoundPoints(
    winningBid,
    tricksWonByBiddingTeam
  )

  // Update scores
  let team1Score = currentScores[0]
  let team2Score = currentScores[1]

  if (roundWinner === 1) {
    team1Score += Math.abs(points)
  } else {
    team2Score += Math.abs(points)
  }

  // Update scores in Firebase
  const gameRef = ref(db, `games/${gameCode}`)
  await update(gameRef, {
    team1Score,
    team2Score,
    roundWinner,
    roundPoints: points,
  })

  return {
    team1Score,
    team2Score,
    roundWinner,
    points,
  }
}

/**
 * Resets game state for a new round
 */
export async function resetForNewRound(
  gameCode: string,
  newDealerIndex: number
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)

  await update(gameRef, {
    phase: 'dealing',
    dealerIndex: newDealerIndex,
    // Clear hands
    hands: {},
    // Clear bidding state
    bidding: {},
    biddingWinner: null,
    // Clear trump
    trump: null,
    rightBar: null,
    leftBar: null,
    // Clear card exchange
    cardExchange: {},
    sittingOutPlayer: null,
    // Clear tricks
    currentTrick: null,
    tricks: {},
    currentPlayer: null,
    // Clear round-specific data
    roundWinner: null,
    roundPoints: null,
  })
}

/**
 * Checks if game is won and returns winning team
 */
export function checkGameWin(
  team1Score: number,
  team2Score: number
): 1 | 2 | null {
  if (hasTeamWonGame(team1Score)) return 1
  if (hasTeamWonGame(team2Score)) return 2
  return null
}

