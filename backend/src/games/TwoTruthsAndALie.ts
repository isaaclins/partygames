import { randomUUID } from 'crypto';
import {
  GameSession,
  Player,
  TwoTruthsStatement,
  TwoTruthsPlayerSubmission,
  TwoTruthsVote,
  TwoTruthsRoundData,
  TwoTruthsGameAction,
  RoundResults,
  GameResults,
} from '../../../shared/types/index.js';

export class TwoTruthsAndALieGame {
  private gameData: TwoTruthsRoundData;
  private scores: Record<string, number> = {};
  private readonly POINTS_FOR_CORRECT_GUESS = 10;
  private readonly POINTS_FOR_FOOLING_OTHERS = 5;

  constructor(private gameSession: GameSession) {
    this.gameData = {
      submissions: [],
      votes: [],
      currentPhase: 'submitting',
    };

    // Initialize scores
    this.gameSession.players.forEach((player) => {
      this.scores[player.id] = 0;
    });
  }

  public handleAction(action: TwoTruthsGameAction): {
    success: boolean;
    error?: string;
  } {
    switch (action.type) {
      case 'submit_statements':
        return this.handleSubmitStatements(action);
      case 'submit_vote':
        return this.handleSubmitVote(action);
      default:
        return { success: false, error: 'Invalid action type' };
    }
  }

  private handleSubmitStatements(action: TwoTruthsGameAction): {
    success: boolean;
    error?: string;
  } {
    if (this.gameData.currentPhase !== 'submitting') {
      return { success: false, error: 'Not in submission phase' };
    }

    if (!action.data.statements || action.data.statements.length !== 3) {
      return { success: false, error: 'Must submit exactly 3 statements' };
    }

    // Check if player already submitted
    const existingSubmission = this.gameData.submissions.find(
      (s) => s.playerId === action.playerId
    );
    if (existingSubmission) {
      return { success: false, error: 'Already submitted statements' };
    }

    // Validate statements are not empty
    const statements = action.data.statements.filter(
      (s) => s.trim().length > 0
    );
    if (statements.length !== 3) {
      return { success: false, error: 'All statements must be non-empty' };
    }

    // Create statements with random lie assignment
    const lieIndex = Math.floor(Math.random() * 3);
    const submissionStatements: TwoTruthsStatement[] = statements.map(
      (text, index) => ({
        id: randomUUID(),
        text: text.trim(),
        isLie: index === lieIndex,
      })
    );

    const submission: TwoTruthsPlayerSubmission = {
      playerId: action.playerId,
      statements: submissionStatements,
      submittedAt: new Date(),
    };

    this.gameData.submissions.push(submission);

    // Check if all players have submitted
    if (this.gameData.submissions.length === this.gameSession.players.length) {
      this.startVotingPhase();
    }

    return { success: true };
  }

  private handleSubmitVote(action: TwoTruthsGameAction): {
    success: boolean;
    error?: string;
  } {
    if (this.gameData.currentPhase !== 'voting') {
      return { success: false, error: 'Not in voting phase' };
    }

    if (!action.data.selectedStatementId || !action.data.targetPlayerId) {
      return {
        success: false,
        error: 'Must specify statement and target player',
      };
    }

    // Validate target player exists and is not the voter
    if (action.data.targetPlayerId === action.playerId) {
      return { success: false, error: 'Cannot vote on your own statements' };
    }

    if (
      !this.gameData.currentTargetPlayerId ||
      this.gameData.currentTargetPlayerId !== action.data.targetPlayerId
    ) {
      return { success: false, error: 'Not voting on the current player' };
    }

    // Check if player already voted for this target
    const existingVote = this.gameData.votes.find(
      (v) =>
        v.voterId === action.playerId &&
        v.targetPlayerId === action.data.targetPlayerId
    );
    if (existingVote) {
      return { success: false, error: 'Already voted for this player' };
    }

    // Validate the statement exists for the target player
    const targetSubmission = this.gameData.submissions.find(
      (s) => s.playerId === action.data.targetPlayerId
    );
    if (!targetSubmission) {
      return {
        success: false,
        error: 'Target player has not submitted statements',
      };
    }

    const statementExists = targetSubmission.statements.find(
      (s) => s.id === action.data.selectedStatementId
    );
    if (!statementExists) {
      return { success: false, error: 'Invalid statement selection' };
    }

    const vote: TwoTruthsVote = {
      voterId: action.playerId,
      targetPlayerId: action.data.targetPlayerId,
      selectedStatementId: action.data.selectedStatementId,
      submittedAt: new Date(),
    };

    this.gameData.votes.push(vote);

    // Check if all eligible players have voted for the current target
    const eligibleVoters = this.gameSession.players.filter(
      (p) => p.id !== this.gameData.currentTargetPlayerId
    );
    const votesForCurrentTarget = this.gameData.votes.filter(
      (v) => v.targetPlayerId === this.gameData.currentTargetPlayerId
    );

    if (votesForCurrentTarget.length === eligibleVoters.length) {
      this.moveToNextVotingTarget();
    }

    return { success: true };
  }

  private startVotingPhase(): void {
    this.gameData.currentPhase = 'voting';
    this.gameData.currentTargetPlayerId = this.gameSession.players[0].id;
  }

  private moveToNextVotingTarget(): void {
    const currentIndex = this.gameSession.players.findIndex(
      (p) => p.id === this.gameData.currentTargetPlayerId
    );
    const nextIndex = currentIndex + 1;

    if (nextIndex < this.gameSession.players.length) {
      this.gameData.currentTargetPlayerId =
        this.gameSession.players[nextIndex].id;
    } else {
      this.endRound();
    }
  }

  private endRound(): void {
    this.gameData.currentPhase = 'results';
    this.calculateScores();
  }

  private calculateScores(): void {
    // Award points for correct guesses
    this.gameData.votes.forEach((vote) => {
      const targetSubmission = this.gameData.submissions.find(
        (s) => s.playerId === vote.targetPlayerId
      );
      if (targetSubmission) {
        const selectedStatement = targetSubmission.statements.find(
          (s) => s.id === vote.selectedStatementId
        );
        if (selectedStatement && selectedStatement.isLie) {
          // Correct guess - award points to voter
          this.scores[vote.voterId] += this.POINTS_FOR_CORRECT_GUESS;
        }
      }
    });

    // Award points for fooling others
    this.gameData.submissions.forEach((submission) => {
      const votesForPlayer = this.gameData.votes.filter(
        (v) => v.targetPlayerId === submission.playerId
      );
      const truthStatements = submission.statements.filter((s) => !s.isLie);

      truthStatements.forEach((truthStatement) => {
        const votesForTruth = votesForPlayer.filter(
          (v) => v.selectedStatementId === truthStatement.id
        );
        // Award points for each player who incorrectly guessed a truth as the lie
        this.scores[submission.playerId] +=
          votesForTruth.length * this.POINTS_FOR_FOOLING_OTHERS;
      });
    });
  }

  public getRoundResults(): RoundResults {
    return {
      roundNumber: this.gameSession.currentRound,
      scores: { ...this.scores },
      summary: this.generateRoundSummary(),
      details: {
        submissions: this.gameData.submissions,
        votes: this.gameData.votes,
      },
    };
  }

  public getGameResults(): GameResults {
    const winner = Object.entries(this.scores).reduce((a, b) =>
      this.scores[a[0]] > this.scores[b[0]] ? a : b
    )[0];

    return {
      finalScores: { ...this.scores },
      winner,
      summary: this.generateGameSummary(),
      gameStats: {
        totalSubmissions: this.gameData.submissions.length,
        totalVotes: this.gameData.votes.length,
      },
    };
  }

  private generateRoundSummary(): string {
    const totalCorrectGuesses = this.gameData.votes.filter((vote) => {
      const targetSubmission = this.gameData.submissions.find(
        (s) => s.playerId === vote.targetPlayerId
      );
      if (targetSubmission) {
        const selectedStatement = targetSubmission.statements.find(
          (s) => s.id === vote.selectedStatementId
        );
        return selectedStatement && selectedStatement.isLie;
      }
      return false;
    }).length;

    return `Round ${this.gameSession.currentRound} complete! ${totalCorrectGuesses} correct guesses out of ${this.gameData.votes.length} total votes.`;
  }

  private generateGameSummary(): string {
    const winner = Object.entries(this.scores).reduce((a, b) =>
      this.scores[a[0]] > this.scores[b[0]] ? a : b
    );
    const winnerPlayer = this.gameSession.players.find(
      (p) => p.id === winner[0]
    );
    return `Game complete! ${winnerPlayer?.name || 'Unknown'} wins with ${winner[1]} points!`;
  }

  public getCurrentState() {
    return {
      phase: this.gameData.currentPhase,
      currentTargetPlayer: this.gameData.currentTargetPlayerId,
      submissions: this.gameData.submissions.map((s) => ({
        ...s,
        // Don't reveal which statement is the lie during gameplay
        statements: s.statements.map((stmt) => ({
          id: stmt.id,
          text: stmt.text,
          isLie:
            this.gameData.currentPhase === 'results' ? stmt.isLie : undefined,
        })),
      })),
      votes: this.gameData.votes,
      scores: { ...this.scores },
    };
  }

  public getGameState() {
    return {
      currentPhase: this.gameData.currentPhase,
      currentRound: 1,
      maxRounds: 3,
      currentTargetPlayer: this.gameData.currentTargetPlayerId,
      submissions: this.gameData.submissions.map((s) => ({
        ...s,
        // Don't reveal which statement is the lie during gameplay
        statements: s.statements.map((stmt) => ({
          id: stmt.id,
          text: stmt.text,
          isLie:
            this.gameData.currentPhase === 'results' ? stmt.isLie : undefined,
        })),
      })),
      votes: this.gameData.votes,
      scores: { ...this.scores },
    };
  }

  public hasPlayerSubmitted(playerId: string): boolean {
    return this.gameData.submissions.some((s) => s.playerId === playerId);
  }

  public hasPlayerVoted(playerId: string, targetPlayerId: string): boolean {
    return this.gameData.votes.some(
      (v) => v.voterId === playerId && v.targetPlayerId === targetPlayerId
    );
  }

  public isComplete(): boolean {
    return this.gameData.currentPhase === 'results';
  }

  public isGameComplete(): boolean {
    return this.gameData.currentPhase === 'results';
  }
}
