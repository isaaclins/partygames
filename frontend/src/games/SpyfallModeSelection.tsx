import React from 'react';
import { useNavigate } from 'react-router-dom';

const SpyfallModeSelection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-3xl font-bold mb-6">Spyfall Mode Selection</h1>
      <div className="flex flex-col gap-6 w-full max-w-xs">
        <button
          className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold shadow hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/create/spyfall')}
          data-testid="online-mode-btn"
        >
          Online
        </button>
        <button
          className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-semibold shadow hover:bg-green-700 transition-colors"
          onClick={() => navigate('/spyfall/offline')}
          data-testid="offline-mode-btn"
        >
          Offline
        </button>
      </div>
    </div>
  );
};

export default SpyfallModeSelection;
