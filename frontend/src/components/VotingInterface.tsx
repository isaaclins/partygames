import React, { useState } from 'react';

export interface VotingInterfaceProps {
  currentVoter: string;
  otherPlayers: string[];
  onVote: (target: string) => void;
}

const VotingInterface: React.FC<VotingInterfaceProps> = ({ currentVoter, otherPlayers, onVote }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePlayerClick = (player: string) => {
    setSelectedTarget(player);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedTarget) {
      onVote(selectedTarget);
      setSelectedTarget(null);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedTarget(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h2 className="text-2xl font-bold mb-2" data-testid="voter-name">{currentVoter}, it’s your turn to vote</h2>
      <p className="mb-4 text-center text-gray-600" data-testid="voting-instructions">
        Select the player you suspect is the spy. You cannot vote for yourself. Confirm your choice to proceed.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6" data-testid="player-grid">
        {otherPlayers.map((player) => (
          <button
            key={player}
            className={`rounded-lg px-6 py-3 text-lg font-medium border border-gray-300 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedTarget === player ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-100'}`}
            onClick={() => handlePlayerClick(player)}
            data-testid={`player-button-${player}`}
            disabled={showConfirmation}
          >
            {player}
          </button>
        ))}
      </div>
      {showConfirmation && selectedTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" data-testid="confirmation-dialog">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full flex flex-col items-center">
            <p className="mb-4 text-lg font-semibold">Vote for <span className="text-blue-600">{selectedTarget}</span>?</p>
            <div className="flex gap-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
                onClick={handleConfirm}
                data-testid="confirm-vote"
              >
                Yes
              </button>
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none"
                onClick={handleCancel}
                data-testid="cancel-vote"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface; 
