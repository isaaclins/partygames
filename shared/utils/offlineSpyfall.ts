import {
  OfflinePlayerRole,
  OfflineVote,
  OfflineGameResults,
  SpyfallLocation,
  SPYFALL_LOCATIONS,
} from '../types/index.js';

/**
 * Gets a random location from the available Spyfall locations
 */
export function getRandomLocation(): SpyfallLocation {
  const randomIndex = Math.floor(Math.random() * SPYFALL_LOCATIONS.length);
  return SPYFALL_LOCATIONS[randomIndex];
}

/**
 * Gets a random role from a location's available roles
 */
export function getRandomRole(location: SpyfallLocation): string {
  const randomIndex = Math.floor(Math.random() * location.roles.length);
  return location.roles[randomIndex];
}

/**
 * Assigns roles to players for offline Spyfall game
 * One player is randomly selected as the spy, others get location and role
 */
export function assignRoles(playerNames: string[]): OfflinePlayerRole[] {
  if (playerNames.length < 3) {
    throw new Error('Minimum 3 players required for Spyfall');
  }
  
  if (playerNames.length > 16) {
    throw new Error('Maximum 16 players allowed for Spyfall');
  }

  const location = getRandomLocation();
  const spyIndex = Math.floor(Math.random() * playerNames.length);

  return playerNames.map((name, index) => ({
    playerName: name,
    location: index === spyIndex ? null : location.name,
    role: index === spyIndex ? null : getRandomRole(location),
    isSpy: index === spyIndex,
  }));
}

/**
 * Processes votes and determines game results
 */
export function processVotes(
  votes: OfflineVote[],
  roles: OfflinePlayerRole[]
): OfflineGameResults {
  if (votes.length === 0) {
    throw new Error('No votes to process');
  }

  // Count votes for each player
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.targetName] = (acc[vote.targetName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Find player(s) with the most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const playersWithMaxVotes = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([name]) => name);

  const isTie = playersWithMaxVotes.length > 1;
  
  // Find the spy and location from roles
  const spyRole = roles.find(role => role.isSpy);
  const nonSpyRole = roles.find(role => !role.isSpy);
  
  if (!spyRole || !nonSpyRole) {
    throw new Error('Invalid game state: missing spy or non-spy roles');
  }

  const spyName = spyRole.playerName;
  const location = nonSpyRole.location!;

  // If there's a tie, return tie result
  if (isTie) {
    return {
      votedOutPlayer: '', // No single player voted out
      voteCounts,
      spyName,
      location,
      winner: 'spy', // Spy wins on ties
      isTie: true,
    };
  }

  // Single player with most votes
  const votedOutPlayer = playersWithMaxVotes[0];
  const spyWasVotedOut = votedOutPlayer === spyName;

  return {
    votedOutPlayer,
    voteCounts,
    spyName,
    location,
    winner: spyWasVotedOut ? 'non-spies' : 'spy',
    isTie: false,
  };
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * Used for randomizing player order in voting
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a randomized voting order for players
 */
export function createVotingOrder(playerNames: string[]): string[] {
  return shuffleArray(playerNames);
}

/**
 * Validates player names for offline game setup
 */
export function validatePlayerNames(playerNames: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum players
  if (playerNames.length < 3) {
    errors.push('Minimum 3 players required');
  }

  // Check maximum players
  if (playerNames.length > 16) {
    errors.push('Maximum 16 players allowed');
  }

  // Check for empty names
  const emptyNames = playerNames.filter(name => !name.trim());
  if (emptyNames.length > 0) {
    errors.push('Player names cannot be empty');
  }

  // Check for duplicate names
  const uniqueNames = new Set(playerNames.map(name => name.trim().toLowerCase()));
  if (uniqueNames.size !== playerNames.length) {
    errors.push('Player names must be unique');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
