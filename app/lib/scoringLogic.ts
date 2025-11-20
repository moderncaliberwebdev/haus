import { type BidType } from './biddingLogic'
import { type Trick } from './trickLogic'
import { type Player } from './gameStart'
import { getTrickWinningTeam } from './teamLogic'

/**
 * Calculates points for both teams in a round
 * @param bidType The type of bid (4, 5, 6, 7, haus, ace-haus, double-haus)
 * @param biddingTeamTricks Number of tricks won by the bidding team
 * @param otherTeamTricks Number of tricks won by the other team
 * @param tricksTotal Total number of tricks in the round (usually 8)
 * @returns Object with points for bidding team and other team
 */
export function calculateRoundPoints(
  bidType: BidType,
  biddingTeamTricks: number,
  otherTeamTricks: number,
  tricksTotal: number = 8
): { biddingTeamPoints: number; otherTeamPoints: number } {
  // Get bid number
  let bidNumber: number
  if (bidType === 'haus') {
    bidNumber = 8
  } else if (bidType === 'ace-haus') {
    bidNumber = 8
  } else if (bidType === 'double-haus') {
    bidNumber = 8
  } else {
    bidNumber = parseInt(bidType as string)
    if (isNaN(bidNumber)) bidNumber = 0
  }

  const madeBid = biddingTeamTricks >= bidNumber

  let biddingTeamPoints: number
  if (bidType === 'haus') {
    // Haus: 16 points if made, -16 if not
    biddingTeamPoints = madeBid ? 16 : -16
  } else if (bidType === 'ace-haus') {
    // Ace Haus: 12 points if made, -12 if not
    biddingTeamPoints = madeBid ? 12 : -12
  } else if (bidType === 'double-haus') {
    // Double Haus: 32 points if made, -32 if not
    biddingTeamPoints = madeBid ? 32 : -32
  } else {
    // Regular bids: if made, get points equal to tricks won; if not, negative bid number
    biddingTeamPoints = madeBid ? biddingTeamTricks : -bidNumber
  }

  // Other team always gets points equal to tricks they won
  const otherTeamPoints = otherTeamTricks

  return {
    biddingTeamPoints,
    otherTeamPoints,
  }
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
  if (
    bidType === 'haus' ||
    bidType === 'ace-haus' ||
    bidType === 'double-haus'
  ) {
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
