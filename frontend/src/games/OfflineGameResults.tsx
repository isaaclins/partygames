import React from 'react';

export interface OfflinePlayerRole {
  playerName: string;
  location: string | null;
  role: string | null;
  isSpy: boolean;
}

export interface OfflineGameResultsProps {
  results: {
    votedOutPlayer: string;
    voteCounts: Record<string, number>;
    spyName: string;
    location: string;
    winner: 'spy' | 'non-spies';
    isTie: boolean;
    roles: OfflinePlayerRole[];
  };
  onRestart: () => void;
  onReturnToDiscussion?: () => void;
}

const winnerText = (winner: 'spy' | 'non-spies') =>
  winner === 'spy' ? 'The Spy Wins!' : 'The Non-Spies Win!';
const winnerColor = (winner: 'spy' | 'non-spies') =>
  winner === 'spy' ? 'text-red-600' : 'text-green-600';

const OfflineGameResults: React.FC<OfflineGameResultsProps> = ({ results, onRestart, onReturnToDiscussion }) => {
  const { votedOutPlayer, voteCounts, spyName, location, winner, isTie, roles } = results;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-4" data-testid="results-title">Voting Results</h2>
      <div className="w-full max-w-md mb-4">
        <table className="w-full border rounded shadow-sm" data-testid="vote-tally">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Player</th>
              <th className="py-2 px-4 text-left">Votes</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(voteCounts).map(([player, count]) => (
              <tr key={player} className={player === votedOutPlayer ? 'bg-yellow-100 font-semibold' : ''}>
                <td className="py-2 px-4">{player}</td>
                <td className="py-2 px-4">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isTie ? (
        <>
          <p className="text-lg text-yellow-700 mb-4" data-testid="tie-message">It's a tie! No one is voted out.</p>
          {onReturnToDiscussion && (
            <button
              className="bg-yellow-500 text-white px-6 py-2 rounded mb-4 hover:bg-yellow-600 focus:outline-none"
              onClick={onReturnToDiscussion}
              data-testid="return-to-discussion"
            >
              Return to Discussion
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-lg mb-2" data-testid="voted-out">{votedOutPlayer} was voted out.</p>
          <p className={`text-xl font-bold mb-4 ${winnerColor(winner)}`} data-testid="winner-announcement">{winnerText(winner)}</p>
        </>
      )}
      <div className="w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Player Roles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="role-list">
          {roles.map((role) => (
            <div
              key={role.playerName}
              className={`rounded border p-3 flex flex-col items-center ${role.isSpy ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}`}
              data-testid={`role-card-${role.playerName}`}
            >
              <span className="font-bold text-base mb-1">{role.playerName}</span>
              {role.isSpy ? (
                <span className="text-red-600 font-semibold">Spy</span>
              ) : (
                <>
                  <span className="text-green-700">{role.role}</span>
                  <span className="text-gray-500 text-sm">@ {role.location}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none"
        onClick={onRestart}
        data-testid="restart-game"
      >
        Start New Game
      </button>
    </div>
  );
};

export default OfflineGameResults; 
