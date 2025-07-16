import {
  GameSession,
  SpyfallGameState,
  SpyfallGameAction,
  SpyfallPlayerRole,
  SpyfallVote,
  SpyfallLocationGuess,
  SPYFALL_LOCATIONS,
  RoundResults,
  GameResults,
} from '../../../shared/types/index.js';

export class SpyfallGame {
  private gameState: SpyfallGameState;
  private scores: Record<string, number> = {};
  private playersReadyToVote: Set<string> = new Set();

  constructor(private gameSession: GameSession) {
    // Initialize scores
    this.gameSession.players.forEach((player) => {
      this.scores[player.id] = 0;
    });

    // Set up initial game state
    this.gameState = this.initializeGame();
  }

  private initializeGame(): SpyfallGameState {
    // Select random location
    const randomLocation = SPYFALL_LOCATIONS[Math.floor(Math.random() * SPYFALL_LOCATIONS.length)];
    
    // Select random spy
    const spyIndex = Math.floor(Math.random() * this.gameSession.players.length);
    const spyId = this.gameSession.players[spyIndex].id;

    // Assign roles to players
    const playerRoles: SpyfallPlayerRole[] = this.gameSession.players.map((player, index) => {
      if (player.id === spyId) {
        return {
          playerId: player.id,
          location: null,
          role: null,
          isSpy: true,
        };
      } else {
        // Assign random role from the location
        const availableRoles = [...randomLocation.roles];
        const roleIndex = Math.floor(Math.random() * availableRoles.length);
        const role = availableRoles[roleIndex];
        
        return {
          playerId: player.id,
          location: randomLocation.name,
          role: role,
          isSpy: false,
        };
      }
    });

    return {
      phase: 'playing',
      location: randomLocation.name,
      spyId: spyId,
      playerRoles: playerRoles,
      votes: [],
      gameStartedAt: new Date(),
    };
  }

  public handleAction(action: SpyfallGameAction): {
    success: boolean;
    error?: string;
    gameStateUpdate?: any;
  } {
    switch (action.type) {
      case 'ready_to_vote':
        return this.handleReadyToVote(action);
      case 'submit_vote':
        return this.handleSubmitVote(action);
      case 'guess_location':
        return this.handleGuessLocation(action);
      default:
        return { success: false, error: 'Invalid action type' };
    }
  }

  private handleReadyToVote(action: SpyfallGameAction): {
    success: boolean;
    error?: string;
    gameStateUpdate?: any;
  } {
    if (this.gameState.phase !== 'playing') {
      return { success: false, error: 'Not in playing phase' };
    }

    this.playersReadyToVote.add(action.playerId);

    // Check if all players are ready to vote
    if (this.playersReadyToVote.size === this.gameSession.players.length) {
      this.gameState.phase = 'voting';
      return { 
        success: true, 
        gameStateUpdate: this.getPublicGameState()
      };
    }

    return { success: true };
  }

  private handleSubmitVote(action: SpyfallGameAction): {
    success: boolean;
    error?: string;
    gameStateUpdate?: any;
  } {
    if (this.gameState.phase !== 'voting') {
      return { success: false, error: 'Not in voting phase' };
    }

    if (!action.data.targetPlayerId) {
      return { success: false, error: 'Must specify target player' };
    }

    // Check if player already voted
    const existingVote = this.gameState.votes.find(v => v.voterId === action.playerId);
    if (existingVote) {
      return { success: false, error: 'Already voted' };
    }

    // Validate target player exists
    const targetExists = this.gameSession.players.some(p => p.id === action.data.targetPlayerId);
    if (!targetExists) {
      return { success: false, error: 'Target player not found' };
    }

    // Add vote
    const vote: SpyfallVote = {
      voterId: action.playerId,
      targetPlayerId: action.data.targetPlayerId,
      submittedAt: new Date(),
    };

    this.gameState.votes.push(vote);

    // Check if all players have voted
    if (this.gameState.votes.length === this.gameSession.players.length) {
      this.processVotingResults();
      return { 
        success: true, 
        gameStateUpdate: this.getPublicGameState()
      };
    }

    return { success: true };
  }

  private processVotingResults(): void {
    // Count votes for each player
    const voteCounts: Record<string, number> = {};
    this.gameState.votes.forEach(vote => {
      voteCounts[vote.targetPlayerId] = (voteCounts[vote.targetPlayerId] || 0) + 1;
    });

    // Find player with most votes
    let mostVotedPlayerId = '';
    let maxVotes = 0;
    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedPlayerId = playerId;
      }
    }

    this.gameState.votedOutPlayerId = mostVotedPlayerId;

    // Check if spy was voted out
    if (mostVotedPlayerId === this.gameState.spyId) {
      // Spy was voted out - give spy chance to guess location
      this.gameState.phase = 'spy_guess';
    } else {
      // Non-spy was voted out - non-spies lose, spy wins
      this.gameState.phase = 'finished';
      this.gameState.winner = 'spy';
      this.updateScores('spy');
    }
  }

  private handleGuessLocation(action: SpyfallGameAction): {
    success: boolean;
    error?: string;
    gameStateUpdate?: any;
  } {
    if (this.gameState.phase !== 'spy_guess') {
      return { success: false, error: 'Not in spy guess phase' };
    }

    if (action.playerId !== this.gameState.spyId) {
      return { success: false, error: 'Only the spy can guess the location' };
    }

    if (!action.data.guessedLocation) {
      return { success: false, error: 'Must provide location guess' };
    }

    const isCorrect = action.data.guessedLocation.toLowerCase().trim() === 
                     this.gameState.location.toLowerCase().trim();

    const locationGuess: SpyfallLocationGuess = {
      spyId: action.playerId,
      guessedLocation: action.data.guessedLocation,
      submittedAt: new Date(),
      isCorrect: isCorrect,
    };

    this.gameState.locationGuess = locationGuess;
    this.gameState.phase = 'finished';

    if (isCorrect) {
      this.gameState.winner = 'spy';
      this.updateScores('spy');
    } else {
      this.gameState.winner = 'non_spies';
      this.updateScores('non_spies');
    }

    return { 
      success: true, 
      gameStateUpdate: this.getPublicGameState()
    };
  }

  private updateScores(winner: 'spy' | 'non_spies'): void {
    this.gameSession.players.forEach(player => {
      if (winner === 'spy' && player.id === this.gameState.spyId) {
        this.scores[player.id] = (this.scores[player.id] || 0) + 3; // Spy wins
      } else if (winner === 'non_spies' && player.id !== this.gameState.spyId) {
        this.scores[player.id] = (this.scores[player.id] || 0) + 2; // Non-spy wins
      }
    });
  }

  public getPublicGameState(): any {
    return {
      phase: this.gameState.phase,
      votes: this.gameState.votes,
      votedOutPlayerId: this.gameState.votedOutPlayerId,
      winner: this.gameState.winner,
      locationGuess: this.gameState.locationGuess,
      playersReadyToVote: this.playersReadyToVote.size,
      totalPlayers: this.gameSession.players.length,
      gameStartedAt: this.gameState.gameStartedAt,
      // Only reveal location and spy after game ends
      ...(this.gameState.phase === 'finished' && {
        location: this.gameState.location,
        spyId: this.gameState.spyId,
      }),
    };
  }

  public getPlayerSpecificState(playerId: string): any {
    const publicState = this.getPublicGameState();
    const playerRole = this.gameState.playerRoles.find(pr => pr.playerId === playerId);

    if (!playerRole) {
      return publicState;
    }

    return {
      ...publicState,
      playerRole: {
        location: playerRole.location,
        role: playerRole.role,
        isSpy: playerRole.isSpy,
      },
    };
  }

  public getRoundResults(): RoundResults {
    return {
      roundNumber: 1,
      scores: { ...this.scores },
      summary: this.generateRoundSummary(),
      details: {
        location: this.gameState.location,
        spyId: this.gameState.spyId,
        winner: this.gameState.winner,
        votes: this.gameState.votes,
        locationGuess: this.gameState.locationGuess,
      },
    };
  }

  public getGameResults(): GameResults {
    const scores = Object.entries(this.scores);
    const winner = scores.length > 0
      ? scores.reduce((a, b) => (this.scores[a[0]] || 0) > (this.scores[b[0]] || 0) ? a : b)[0]
      : 'No winner';

    return {
      finalScores: { ...this.scores },
      winner,
      summary: this.generateGameSummary(),
      gameStats: {
        location: this.gameState.location,
        spyId: this.gameState.spyId,
        gameWinner: this.gameState.winner,
        totalVotes: this.gameState.votes.length,
        spyGuessedCorrectly: this.gameState.locationGuess?.isCorrect || false,
      },
    };
  }

  private generateRoundSummary(): string {
    const spyPlayer = this.gameSession.players.find(p => p.id === this.gameState.spyId);
    const spyName = spyPlayer?.name || 'Unknown';
    
    if (this.gameState.winner === 'spy') {
      if (this.gameState.locationGuess?.isCorrect) {
        return `Spy wins! ${spyName} correctly guessed the location: ${this.gameState.location}`;
      } else {
        return `Spy wins! The non-spies voted out the wrong person.`;
      }
    } else {
      return `Non-spies win! ${spyName} was the spy and failed to guess the location.`;
    }
  }

  private generateGameSummary(): string {
    return this.generateRoundSummary();
  }

  public isComplete(): boolean {
    return this.gameState.phase === 'finished';
  }

  public isGameComplete(): boolean {
    return this.gameState.phase === 'finished';
  }

  public hasPlayerVoted(playerId: string): boolean {
    return this.gameState.votes.some(v => v.voterId === playerId);
  }

  public isPlayerReadyToVote(playerId: string): boolean {
    return this.playersReadyToVote.has(playerId);
  }
} 
