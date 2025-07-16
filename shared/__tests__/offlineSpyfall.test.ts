import {
  assignRoles,
  processVotes,
  getRandomLocation,
  getRandomRole,
  shuffleArray,
  createVotingOrder,
  validatePlayerNames,
} from '../utils/offlineSpyfall.js';
import {
  OfflinePlayerRole,
  OfflineVote,
  SPYFALL_LOCATIONS,
} from '../types/index.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Offline Spyfall Utilities', () => {
  describe('getRandomLocation', () => {
    it('should return a valid Spyfall location', () => {
      const location = getRandomLocation();
      expect(SPYFALL_LOCATIONS).toContain(location);
      expect(location).toHaveProperty('name');
      expect(location).toHaveProperty('roles');
      expect(Array.isArray(location.roles)).toBe(true);
    });
  });

  describe('getRandomRole', () => {
    it('should return a valid role from the given location', () => {
      const location = SPYFALL_LOCATIONS[0]; // Use first location for testing
      const role = getRandomRole(location);
      expect(location.roles).toContain(role);
      expect(typeof role).toBe('string');
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to minimum number of players (3)', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      const roles = assignRoles(playerNames);

      expect(roles).toHaveLength(3);
      expect(roles.every(role => playerNames.includes(role.playerName))).toBe(true);
    });

    it('should assign exactly one spy', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
      const roles = assignRoles(playerNames);

      const spies = roles.filter(role => role.isSpy);
      expect(spies).toHaveLength(1);
    });

    it('should assign same location to all non-spy players', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
      const roles = assignRoles(playerNames);

      const nonSpyRoles = roles.filter(role => !role.isSpy);
      const locations = nonSpyRoles.map(role => role.location);
      const uniqueLocations = new Set(locations);
      
      expect(uniqueLocations.size).toBe(1);
      expect(locations[0]).toBeTruthy();
    });

    it('should assign null location and role to spy', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      const roles = assignRoles(playerNames);

      const spy = roles.find(role => role.isSpy);
      expect(spy).toBeDefined();
      expect(spy!.location).toBeNull();
      expect(spy!.role).toBeNull();
    });

    it('should assign valid roles to non-spy players', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie', 'David'];
      const roles = assignRoles(playerNames);

      const nonSpyRoles = roles.filter(role => !role.isSpy);
      nonSpyRoles.forEach(role => {
        expect(role.location).toBeTruthy();
        expect(role.role).toBeTruthy();
        expect(typeof role.role).toBe('string');
      });
    });

    it('should throw error for less than 3 players', () => {
      expect(() => assignRoles(['Alice', 'Bob'])).toThrow('Minimum 3 players required');
    });

    it('should throw error for more than 16 players', () => {
      const tooManyPlayers = Array.from({ length: 17 }, (_, i) => `Player${i + 1}`);
      expect(() => assignRoles(tooManyPlayers)).toThrow('Maximum 16 players allowed');
    });

    it('should work with maximum number of players (16)', () => {
      const maxPlayers = Array.from({ length: 16 }, (_, i) => `Player${i + 1}`);
      const roles = assignRoles(maxPlayers);

      expect(roles).toHaveLength(16);
      expect(roles.filter(role => role.isSpy)).toHaveLength(1);
    });
  });

  describe('processVotes', () => {
    let testRoles: OfflinePlayerRole[];

    beforeEach(() => {
      testRoles = [
        { playerName: 'Alice', location: 'Casino', role: 'Dealer', isSpy: false },
        { playerName: 'Bob', location: null, role: null, isSpy: true },
        { playerName: 'Charlie', location: 'Casino', role: 'Gambler', isSpy: false },
        { playerName: 'David', location: 'Casino', role: 'Security', isSpy: false },
      ];
    });

    it('should correctly count votes', () => {
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Bob' },
        { voterName: 'Charlie', targetName: 'Bob' },
        { voterName: 'David', targetName: 'Alice' },
        { voterName: 'Bob', targetName: 'Alice' },
      ];

      const results = processVotes(votes, testRoles);
      expect(results.voteCounts).toEqual({
        'Bob': 2,
        'Alice': 2,
      });
    });

    it('should determine spy wins when spy is not voted out', () => {
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Charlie' },
        { voterName: 'Bob', targetName: 'Charlie' },
        { voterName: 'Charlie', targetName: 'Alice' },
        { voterName: 'David', targetName: 'Charlie' },
      ];

      const results = processVotes(votes, testRoles);
      expect(results.votedOutPlayer).toBe('Charlie');
      expect(results.winner).toBe('spy');
      expect(results.isTie).toBe(false);
    });

    it('should determine non-spies win when spy is voted out', () => {
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Bob' },
        { voterName: 'Charlie', targetName: 'Bob' },
        { voterName: 'David', targetName: 'Bob' },
        { voterName: 'Bob', targetName: 'Alice' },
      ];

      const results = processVotes(votes, testRoles);
      expect(results.votedOutPlayer).toBe('Bob');
      expect(results.winner).toBe('non-spies');
      expect(results.isTie).toBe(false);
    });

    it('should handle tie votes correctly', () => {
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Bob' },
        { voterName: 'Bob', targetName: 'Charlie' },
        { voterName: 'Charlie', targetName: 'Bob' },
        { voterName: 'David', targetName: 'Charlie' },
      ];

      const results = processVotes(votes, testRoles);
      expect(results.isTie).toBe(true);
      expect(results.winner).toBe('spy'); // Spy wins on ties
      expect(results.votedOutPlayer).toBe('');
    });

    it('should include correct game information', () => {
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Bob' },
        { voterName: 'Charlie', targetName: 'Bob' },
        { voterName: 'David', targetName: 'Bob' },
        { voterName: 'Bob', targetName: 'Alice' },
      ];

      const results = processVotes(votes, testRoles);
      expect(results.spyName).toBe('Bob');
      expect(results.location).toBe('Casino');
    });

    it('should throw error for empty votes', () => {
      expect(() => processVotes([], testRoles)).toThrow('No votes to process');
    });

    it('should throw error for invalid game state', () => {
      const invalidRoles = [
        { playerName: 'Alice', location: 'Casino', role: 'Dealer', isSpy: false },
        { playerName: 'Bob', location: 'Casino', role: 'Gambler', isSpy: false },
      ];
      const votes: OfflineVote[] = [
        { voterName: 'Alice', targetName: 'Bob' },
      ];

      expect(() => processVotes(votes, invalidRoles)).toThrow('Invalid game state');
    });
  });

  describe('shuffleArray', () => {
    it('should return array with same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = ['a', 'b', 'c', 'd'];
      const shuffled = shuffleArray(original);
      original.forEach(item => {
        expect(shuffled).toContain(item);
      });
    });

    it('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffleArray(original);
      expect(original).toEqual(originalCopy);
    });

    it('should handle empty array', () => {
      const shuffled = shuffleArray([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = shuffleArray(['only']);
      expect(shuffled).toEqual(['only']);
    });
  });

  describe('createVotingOrder', () => {
    it('should return all player names', () => {
      const players = ['Alice', 'Bob', 'Charlie'];
      const votingOrder = createVotingOrder(players);
      
      expect(votingOrder).toHaveLength(players.length);
      players.forEach(player => {
        expect(votingOrder).toContain(player);
      });
    });

    it('should not modify original array', () => {
      const players = ['Alice', 'Bob', 'Charlie'];
      const originalCopy = [...players];
      createVotingOrder(players);
      expect(players).toEqual(originalCopy);
    });
  });

  describe('validatePlayerNames', () => {
    it('should validate correct player names', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject less than 3 players', () => {
      const playerNames = ['Alice', 'Bob'];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum 3 players required');
    });

    it('should reject more than 16 players', () => {
      const playerNames = Array.from({ length: 17 }, (_, i) => `Player${i + 1}`);
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 16 players allowed');
    });

    it('should reject empty player names', () => {
      const playerNames = ['Alice', '', 'Charlie'];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player names cannot be empty');
    });

    it('should reject whitespace-only names', () => {
      const playerNames = ['Alice', '   ', 'Charlie'];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player names cannot be empty');
    });

    it('should reject duplicate names (case insensitive)', () => {
      const playerNames = ['Alice', 'bob', 'ALICE'];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player names must be unique');
    });

    it('should return multiple errors when applicable', () => {
      const playerNames = ['Alice', ''];
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum 3 players required');
      expect(result.errors).toContain('Player names cannot be empty');
    });

    it('should validate maximum allowed players', () => {
      const playerNames = Array.from({ length: 16 }, (_, i) => `Player${i + 1}`);
      const result = validatePlayerNames(playerNames);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
