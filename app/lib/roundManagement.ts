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
  team1Points: number
  team2Points: number
}> {
  // Determine which team made the bid
  const biddingTeam = getTeamForPlayer(players, biddingWinnerKey)
  if (!biddingTeam) {
    throw new Error('Bidding winner not found in players')
  }

  // Count tricks won by each team
  const { team1, team2 } = getTricksWonByTeam(tricks, players)

  // Calculate points for both teams
  const biddingTeamTricks = biddingTeam === 1 ? team1 : team2
  const otherTeamTricks = biddingTeam === 1 ? team2 : team1

  const { biddingTeamPoints, otherTeamPoints } = calculateRoundPoints(
    winningBid,
    biddingTeamTricks,
    otherTeamTricks
  )

  // Determine which team won the round (team with more points this round)
  const roundWinner =
    biddingTeamPoints > otherTeamPoints
      ? biddingTeam
      : biddingTeam === 1
      ? 2
      : 1

  // Update scores
  let team1Score = currentScores[0]
  let team2Score = currentScores[1]

  if (biddingTeam === 1) {
    team1Score += biddingTeamPoints
    team2Score += otherTeamPoints
  } else {
    team1Score += otherTeamPoints
    team2Score += biddingTeamPoints
  }

  // Get sitting out player and clear their hand
  const gameRef = ref(db, `games/${gameCode}`)
  const gameSnap = await get(gameRef)
  const gameData = gameSnap.val() || {}
  const sittingOutPlayerKey = gameData.sittingOutPlayer || null

  // Prepare updates object
  const updates: Record<string, any> = {
    team1Score,
    team2Score,
    roundWinner,
    team1Points: biddingTeam === 1 ? biddingTeamPoints : otherTeamPoints,
    team2Points: biddingTeam === 1 ? otherTeamPoints : biddingTeamPoints,
  }

  // Clear sitting out player's hand if there is one
  if (sittingOutPlayerKey) {
    const sittingOutPlayerIndex = players.findIndex(
      (p) => p.key === sittingOutPlayerKey
    )
    if (sittingOutPlayerIndex !== -1) {
      updates[`hands/${sittingOutPlayerIndex}`] = {}
    }
  }

  // Update scores and clear sitting out player's hand in Firebase
  await update(gameRef, updates)

  return {
    team1Score,
    team2Score,
    roundWinner,
    team1Points: biddingTeam === 1 ? biddingTeamPoints : otherTeamPoints,
    team2Points: biddingTeam === 1 ? otherTeamPoints : biddingTeamPoints,
  }
}

/**
 * Resets game state for a new round
 */
export async function resetForNewRound(
  gameCode: string,
  newDealerIndex: number,
  players: Player[]
): Promise<void> {
  const gameRef = ref(db, `games/${gameCode}`)

  // Get the dealer's player key from the index
  const newDealer = players[newDealerIndex]
  const newDealerKey = newDealer?.key || ''

  await update(gameRef, {
    phase: 'dealing',
    dealerIndex: newDealerIndex,
    dealerKey: newDealerKey, // Update dealerKey as well
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
    team1Points: null,
    team2Points: null,
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
