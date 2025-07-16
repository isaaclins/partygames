import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import JoinGamePage from './pages/JoinGamePage';
import CreateGamePage from './pages/CreateGamePage';
import GameLobbyPage from './pages/GameLobbyPage';
import GamePage from './pages/GamePage';
import NotFoundPage from './pages/NotFoundPage';
import SpyfallModeSelection from './games/SpyfallModeSelection';
import OfflineSpyfallGame from './games/OfflineSpyfallGame';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/join' element={<JoinGamePage />} />
          <Route path='/create' element={<CreateGamePage />} />
          <Route path='/spyfall/mode-select' element={<SpyfallModeSelection />} />
          <Route path='/spyfall/offline' element={<OfflineSpyfallGame />} />
          <Route path='/lobby/:lobbyId' element={<GameLobbyPage />} />
          <Route path='/game/:lobbyId' element={<GamePage />} />
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
