import { type BidType } from './biddingLogic'
import { type Trick } from './trickLogic'
import { type Player } from './gameStart'
import { getTrickWinningTeam } from './teamLogic'

/**
 * Calculates points for a round based on the bid and tricks won
 * @param bidType The type of bid (4, 5, 6, 7, haus, ace-haus, double-haus)
 * @param tricksWon Number of tricks won by the bidding team
 * @param tricksTotal Total number of tricks in the round (usually 8)
 * @returns Points for the bidding team (positive if they made it, negative if they didn't)
 */
export function calculateRoundPoints(
  bidType: BidType,
  tricksWon: number,
  tricksTotal: number = 8
): number {
  // For special bids, points are fixed
  if (bidType === 'haus') {
    // Haus: 16 points if made, -16 if not
    return tricksWon >= 8 ? 16 : -16
  }

  if (bidType === 'ace-haus') {
    // Ace Haus: 12 points if made, -12 if not
    return tricksWon >= 8 ? 12 : -12
  }

  if (bidType === 'double-haus') {
    // Double Haus: 32 points if made, -32 if not
    return tricksWon >= 8 ? 32 : -32
  }

  // For regular bids (4, 5, 6, 7), points equal the bid number
  // If they made it, they get positive points; if not, negative
  const bidNumber = parseInt(bidType as string)
  if (isNaN(bidNumber)) return 0

  return tricksWon >= bidNumber ? bidNumber : -bidNumber
}

/**
 * Gets the number of tricks won by each team in a round
 * @param tricks Array of completed tricks
 * @param players Array of all players
 * @returns Object with team1 and team2 trick counts
 */
export function getTricksWonByTeam(
  tricks: Trick[],
  players: Player[]
): { team1: number; team2: number } {
  let team1 = 0
  let team2 = 0

  for (const trick of tricks) {
    if (trick.winnerTeam === 1) {
      team1++
    } else if (trick.winnerTeam === 2) {
      team2++
    }
  }

  return { team1, team2 }
}

/**
 * Determines which team won the round
 * @param bidType The type of bid
 * @param tricksWon Number of tricks won by the bidding team
 * @param biddingTeam Team number (1 or 2) of the bidding team
 * @returns Team number (1 or 2) that won the round, or null if tie
 */
export function getRoundWinner(
  bidType: BidType,
  tricksWon: number,
  biddingTeam: 1 | 2
): 1 | 2 | null {
  const bidNumber = getBidNumber(bidType)
  const madeBid = tricksWon >= bidNumber

  if (madeBid) {
    return biddingTeam
  } else {
    // If bidding team didn't make it, the other team wins
    return biddingTeam === 1 ? 2 : 1
  }
}

/**
 * Gets the bid number from a bid type
 */
function getBidNumber(bidType: BidType): number {
  if (bidType === 'haus' || bidType === 'ace-haus' || bidType === 'double-haus') {
    return 8 // Special bids require all 8 tricks
  }
  const num = parseInt(bidType as string)
  return isNaN(num) ? 0 : num
}

/**
 * Checks if a team has won the game (reached 64 points)
 */
export function hasTeamWonGame(teamScore: number): boolean {
  return teamScore >= 64
}

