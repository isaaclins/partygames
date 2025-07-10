import {
  GameAction,
  GameSession,
  WouldYouRatherScenario,
  WouldYouRatherVote,
  WouldYouRatherRoundData,
  WouldYouRatherGameAction,
} from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class WouldYouRatherGame {
  private gameState: WouldYouRatherRoundData;
  private scores: Record<string, number> = {};
  private currentRound: number = 1;
  private maxRounds: number = 3;

  constructor(private lobby: GameSession) {
    this.gameState = {
      scenarios: [],
      votes: [],
      currentPhase: 'submitting',
      currentScenarioIndex: 0,
    };

    // Initialize scores
    this.lobby.players.forEach((player) => {
      this.scores[player.id] = 0;
    });
  }

  public handleAction(action: WouldYouRatherGameAction): any {
    switch (action.type) {
      case 'submit_scenario':
        return this.handleSubmitScenario(action);
      case 'submit_vote':
        return this.handleSubmitVote(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleSubmitScenario(action: WouldYouRatherGameAction): any {
    if (this.gameState.currentPhase !== 'submitting') {
      throw new Error('Not in submission phase');
    }

    if (!action.data.optionA || !action.data.optionB) {
      throw new Error('Both options are required');
    }

    // Check if player already submitted for this round
    const hasSubmitted = this.gameState.scenarios.some(
      (s) => s.submittedBy === action.playerId && s.round === this.currentRound
    );

    if (hasSubmitted) {
      throw new Error('Already submitted a scenario for this round');
    }

    // Create new scenario
    const scenario: WouldYouRatherScenario = {
      id: uuidv4(),
      optionA: action.data.optionA.trim(),
      optionB: action.data.optionB.trim(),
      submittedBy: action.playerId,
      round: this.currentRound,
    };

    this.gameState.scenarios.push(scenario);

    // Check if all players have submitted
    const currentRoundScenarios = this.gameState.scenarios.filter(
      (s) => s.round === this.currentRound
    );

    if (currentRoundScenarios.length === this.lobby.players.length) {
      this.startVotingPhase();
    }

    return this.getGameState();
  }

  private handleSubmitVote(action: WouldYouRatherGameAction): any {
    if (this.gameState.currentPhase !== 'voting') {
      throw new Error('Not in voting phase');
    }

    if (!action.data.scenarioId || !action.data.choice) {
      throw new Error('Scenario ID and choice are required');
    }

    // Validate choice
    if (action.data.choice !== 'A' && action.data.choice !== 'B') {
      throw new Error('Choice must be A or B');
    }

    // Check if scenario exists
    const scenario = this.gameState.scenarios.find(
      (s) => s.id === action.data.scenarioId
    );
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Check if player already voted for this scenario
    const hasVoted = this.gameState.votes.some(
      (v) =>
        v.voterId === action.playerId && v.scenarioId === action.data.scenarioId
    );

    if (hasVoted) {
      throw new Error('Already voted for this scenario');
    }

    // Create vote
    const vote: WouldYouRatherVote = {
      voterId: action.playerId,
      scenarioId: action.data.scenarioId!,
      choice: action.data.choice,
      submittedAt: new Date(),
    };

    this.gameState.votes.push(vote);

    // Check if all players voted for current scenario
    const currentScenario = this.getCurrentScenario();
    if (currentScenario) {
      const votesForCurrentScenario = this.gameState.votes.filter(
        (v) => v.scenarioId === currentScenario.id
      );

      // Everyone except the scenario creator should vote
      const expectedVotes = this.lobby.players.length - 1;

      if (votesForCurrentScenario.length === expectedVotes) {
        this.moveToNextScenario();
      }
    }

    return this.getGameState();
  }

  private startVotingPhase(): void {
    this.gameState.currentPhase = 'voting';
    this.gameState.currentScenarioIndex = 0;
  }

  private moveToNextScenario(): void {
    // Award points for the current scenario
    this.awardPointsForCurrentScenario();

    this.gameState.currentScenarioIndex++;

    const currentRoundScenarios = this.gameState.scenarios.filter(
      (s) => s.round === this.currentRound
    );

    if (this.gameState.currentScenarioIndex >= currentRoundScenarios.length) {
      // All scenarios for this round completed
      this.endRound();
    }
  }

  private awardPointsForCurrentScenario(): void {
    const currentScenario = this.getCurrentScenario();
    if (!currentScenario) {return;}

    const votesForScenario = this.gameState.votes.filter(
      (v) => v.scenarioId === currentScenario.id
    );

    // Award 1 point to the scenario creator for each vote
    this.scores[currentScenario.submittedBy] += votesForScenario.length;

    // Award 1 point to each voter for participating
    votesForScenario.forEach((vote) => {
      this.scores[vote.voterId] += 1;
    });
  }

  private endRound(): void {
    if (this.currentRound >= this.maxRounds) {
      this.gameState.currentPhase = 'results';
    } else {
      // Start next round
      this.currentRound++;
      this.gameState.currentPhase = 'submitting';
      this.gameState.currentScenarioIndex = 0;
    }
  }

  private getCurrentScenario(): WouldYouRatherScenario | undefined {
    const currentRoundScenarios = this.gameState.scenarios.filter(
      (s) => s.round === this.currentRound
    );
    return currentRoundScenarios[this.gameState.currentScenarioIndex];
  }

  public getGameState(): any {
    const currentScenario = this.getCurrentScenario();

    return {
      ...this.gameState,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      scores: this.scores,
      currentScenario: currentScenario,
      votingProgress: currentScenario
        ? this.getVotingProgress(currentScenario.id)
        : null,
    };
  }

  private getVotingProgress(scenarioId: string): {
    voted: number;
    total: number;
  } {
    const votesForScenario = this.gameState.votes.filter(
      (v) => v.scenarioId === scenarioId
    );
    const scenario = this.gameState.scenarios.find((s) => s.id === scenarioId);

    // Total voters = all players except the scenario creator
    const totalVoters = scenario
      ? this.lobby.players.length - 1
      : this.lobby.players.length;

    return {
      voted: votesForScenario.length,
      total: totalVoters,
    };
  }

  public isGameComplete(): boolean {
    return this.gameState.currentPhase === 'results';
  }

  public getWinner(): string | null {
    if (!this.isGameComplete()) {return null;}

    const sortedScores = Object.entries(this.scores).sort(
      ([, a], [, b]) => b - a
    );

    return sortedScores.length > 0 ? sortedScores[0][0] : null;
  }

  public getFinalResults(): any {
    return {
      finalScores: this.scores,
      winner: this.getWinner(),
      summary: `Game completed after ${this.maxRounds} rounds`,
      totalScenarios: this.gameState.scenarios.length,
      totalVotes: this.gameState.votes.length,
    };
  }
}
