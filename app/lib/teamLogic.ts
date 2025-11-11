import { type Player } from './gameStart'

/**
 * Team structure for Haus game
 */
export interface Team {
  teamNumber: 1 | 2
  players: Player[]
  playerKeys: string[]
  score: number
}

/**
 * Gets the partner index for a player
 * Partners sit across from each other (2 positions away)
 *
 * @param playerIndex Current player's index (0-3)
 * @returns Partner's index
 */
export function getPartnerIndex(playerIndex: number): number {
  // Partners are 2 positions away (across the table)
  return (playerIndex + 2) % 4
}

/**
 * Gets the partner player for a given player
 *
 * @param players Array of all players
 * @param playerIndex Current player's index
 * @returns Partner player or null if not found
 */
export function getPartner(
  players: Player[],
  playerIndex: number
): Player | null {
  if (playerIndex === -1 || players.length !== 4) return null
  const partnerIndex = getPartnerIndex(playerIndex)
  return players[partnerIndex] || null
}

/**
 * Gets the partner's key for a given player key
 *
 * @param players Array of all players
 * @param playerKey Current player's key
 * @returns Partner's key or null if not found
 */
export function getPartnerKey(
  players: Player[],
  playerKey: string
): string | null {
  const playerIndex = players.findIndex((p) => p.key === playerKey)
  if (playerIndex === -1) return null
  const partner = getPartner(players, playerIndex)
  return partner?.key || null
}

/**
 * Determines which team a player belongs to
 *
 * Team 1: Positions 0 and 2 (bottom and top)
 * Team 2: Positions 1 and 3 (left and right)
 *
 * @param playerIndex Player's index (0-3)
 * @returns Team number (1 or 2)
 */
export function getPlayerTeam(playerIndex: number): 1 | 2 {
  // Team 1: positions 0, 2 (bottom, top)
  // Team 2: positions 1, 3 (left, right)
  if (playerIndex === 0 || playerIndex === 2) return 1
  return 2
}

/**
 * Gets the team for a given player key
 *
 * @param players Array of all players
 * @param playerKey Player's key
 * @returns Team number (1 or 2) or null if player not found
 */
export function getTeamForPlayer(
  players: Player[],
  playerKey: string
): 1 | 2 | null {
  const playerIndex = players.findIndex((p) => p.key === playerKey)
  if (playerIndex === -1) return null
  return getPlayerTeam(playerIndex)
}

/**
 * Gets all players on a team
 *
 * @param players Array of all players
 * @param teamNumber Team number (1 or 2)
 * @returns Array of players on that team
 */
export function getTeamPlayers(players: Player[], teamNumber: 1 | 2): Player[] {
  return players.filter((_, index) => getPlayerTeam(index) === teamNumber)
}

/**
 * Creates team objects from players
 *
 * @param players Array of all players
 * @param scores Optional scores for each team [team1Score, team2Score]
 * @returns Object with team1 and team2
 */
export function createTeams(
  players: Player[],
  scores: [number, number] = [0, 0]
): { team1: Team; team2: Team } {
  const team1Players = getTeamPlayers(players, 1)
  const team2Players = getTeamPlayers(players, 2)

  return {
    team1: {
      teamNumber: 1,
      players: team1Players,
      playerKeys: team1Players.map((p) => p.key),
      score: scores[0],
    },
    team2: {
      teamNumber: 2,
      players: team2Players,
      playerKeys: team2Players.map((p) => p.key),
      score: scores[1],
    },
  }
}

/**
 * Determines which team won a trick based on the winning player
 *
 * @param players Array of all players
 * @param winnerPlayerKey Key of the player who won the trick
 * @returns Team number (1 or 2) or null if player not found
 */
export function getTrickWinningTeam(
  players: Player[],
  winnerPlayerKey: string
): 1 | 2 | null {
  return getTeamForPlayer(players, winnerPlayerKey)
}

/**
 * Checks if two players are on the same team
 *
 * @param players Array of all players
 * @param playerKey1 First player's key
 * @param playerKey2 Second player's key
 * @returns true if players are teammates
 */
export function areTeammates(
  players: Player[],
  playerKey1: string,
  playerKey2: string
): boolean {
  const team1 = getTeamForPlayer(players, playerKey1)
  const team2 = getTeamForPlayer(players, playerKey2)
  return team1 !== null && team1 === team2
}

/**
 * Checks if a player is the partner of another player
 *
 * @param players Array of all players
 * @param playerKey1 First player's key
 * @param playerKey2 Second player's key
 * @returns true if player2 is player1's partner
 */
export function isPartner(
  players: Player[],
  playerKey1: string,
  playerKey2: string
): boolean {
  const partnerKey = getPartnerKey(players, playerKey1)
  return partnerKey === playerKey2
}

/**
 * Gets the opposing team number
 *
 * @param teamNumber Current team number (1 or 2)
 * @returns Opposing team number
 */
export function getOpposingTeam(teamNumber: 1 | 2): 1 | 2 {
  return teamNumber === 1 ? 2 : 1
}
