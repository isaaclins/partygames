import { Link } from 'react-router-dom';
import { Users, Plus, Gamepad2, Zap } from 'lucide-react';
import { StateTest } from '../components/StateTest';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome to Party Games!
        </h1>
        <p className="text-slate-600 max-w-sm mx-auto">
          Real-time multiplayer games for you and your friends. Create a lobby
          or join an existing game to get started.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Quick Start</h2>
        <div className="grid grid-cols-1 gap-3">
          <Link
            to="/create"
            className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Create Game</h3>
                <p className="text-sm text-slate-600">
                  Start a new game lobby for your friends
                </p>
              </div>
            </div>
          </Link>
          <Link
            to="/join"
            className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Join Game</h3>
                <p className="text-sm text-slate-600">
                  Enter a room code to join a friend's game
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Featured Games */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Available Games
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Quick Draw</h3>
                <p className="text-sm text-slate-600">
                  Drawing and guessing game
                </p>
              </div>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">
                  Two Truths and a Lie
                </h3>
                <p className="text-sm text-slate-600">
                  Social deduction game
                </p>
              </div>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* State Management Test (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Development: State Test
          </h2>
          <StateTest />
        </div>
      )}
    </div>
  );
} 
