import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Users, Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-slate-200 safe-area-top'>
        <div className='max-w-lg mx-auto px-4 py-3'>
          <div className='flex items-center justify-between'>
            <Link to='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>PG</span>
              </div>
              <span className='text-lg font-semibold text-slate-900'>
                Party Games
              </span>
            </Link>
            <button className='p-2 text-slate-600 hover:text-slate-900 transition-colors'>
              <Menu className='w-5 h-5' />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 max-w-lg mx-auto w-full px-4 py-6'>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className='bg-white border-t border-slate-200 safe-area-bottom'>
        <div className='max-w-lg mx-auto px-4'>
          <div className='flex items-center justify-around py-2'>
            <Link
              to='/'
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className='w-5 h-5 mb-1' />
              <span className='text-xs font-medium'>Home</span>
            </Link>
            <Link
              to='/join'
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/join')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className='w-5 h-5 mb-1' />
              <span className='text-xs font-medium'>Join</span>
            </Link>
            <Link
              to='/create'
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive('/create')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className='w-5 h-5 mb-1' />
              <span className='text-xs font-medium'>Create</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
