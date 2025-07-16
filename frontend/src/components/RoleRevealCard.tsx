import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Shield, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { OfflinePlayerRole } from '../../../shared/types/index.js';

interface RoleRevealCardProps {
  playerName: string;
  role: OfflinePlayerRole;
  isRevealed: boolean;
  onCardTap: () => void;
}

export default function RoleRevealCard({ playerName, role, isRevealed, onCardTap }: RoleRevealCardProps) {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true);

  const handleCardClick = () => {
    if (showPrivacyWarning) {
      setShowPrivacyWarning(false);
    } else {
      onCardTap();
    }
  };

  // Privacy warning screen
  if (showPrivacyWarning) {
    return (
      <div className='space-y-6'>
        {/* Header */}
        <div className='text-center'>
          <div className='w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <EyeOff className='w-8 h-8 text-amber-600' />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-2'>
            {playerName}'s Turn
          </h1>
          <p className='text-slate-600'>
            Make sure others can't see the screen before revealing your role.
          </p>
        </div>

        {/* Privacy Warning */}
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-6'>
          <div className='text-center space-y-4'>
            <EyeOff className='w-12 h-12 text-amber-600 mx-auto' />
            <div>
              <h3 className='font-semibold text-amber-900 mb-2'>
                Privacy Reminder
              </h3>
              <p className='text-amber-700 text-sm'>
                Make sure other players cannot see the screen before you reveal your role card.
                Only you should see this information!
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleCardClick}
          variant='primary'
          size='lg'
          className='w-full'
          leftIcon={<Eye className='w-5 h-5' />}
        >
          I'm Ready - Show My Role
        </Button>

        {/* Instructions */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h3 className='font-medium text-blue-900 mb-1'>What happens next</h3>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• Tap to reveal your role card</li>
            <li>• Remember your location and role (if not the spy)</li>
            <li>• Tap again to pass to the next player</li>
            <li>• Keep your role secret during discussion!</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          !isRevealed ? 'bg-yellow-100' : (role.isSpy ? 'bg-red-100' : 'bg-blue-100')
        }`}>
          {!isRevealed ? (
            <HelpCircle className='w-8 h-8 text-yellow-500' />
          ) : role.isSpy ? (
            <Shield className='w-8 h-8 text-red-600' />
          ) : (
            <Eye className='w-8 h-8 text-blue-600' />
          )}
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>
          {playerName}
        </h1>
        <p className='text-slate-600'>
          {isRevealed ? 'Your role is revealed below' : 'Tap the card to reveal your role'}
        </p>
      </div>

      {/* Role Card */}
      <div 
        className={`relative bg-white rounded-xl shadow-lg border-2 cursor-pointer transition-all duration-300 min-h-[300px] \
          ${isRevealed 
            ? (role.isSpy ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50')
            : 'border-slate-300 hover:border-slate-400 hover:shadow-xl'} \
          group \
        `}
        onClick={handleCardClick}
        tabIndex={0}
        role="button"
        aria-pressed={isRevealed}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        style={{ outline: 'none' }}
        onMouseDown={e => {
          e.currentTarget.classList.add('scale-95');
        }}
        onMouseUp={e => {
          e.currentTarget.classList.remove('scale-95');
        }}
        onMouseLeave={e => {
          e.currentTarget.classList.remove('scale-95');
        }}
      >
        <div className='p-8 text-center h-full flex flex-col justify-center'>
          {!isRevealed ? (
            // Card Back (Player Name, always yellow question mark)
            <>
              <div className='w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <HelpCircle className='w-10 h-10 text-yellow-500' />
              </div>
              <h2 className='text-3xl font-bold text-slate-900 mb-4'>
                {playerName}
              </h2>
              <p className='text-slate-600 mb-6'>
                Tap to reveal your role
              </p>
              <div className='flex items-center justify-center text-yellow-600'>
                <HelpCircle className='w-6 h-6 mr-2' />
                <span className='font-medium'>Reveal Role</span>
              </div>
            </>
          ) : (
            // Card Front (Role Information)
            <>
              {role.isSpy ? (
                // Spy Card
                <>
                  <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <Shield className='w-10 h-10 text-red-600' />
                  </div>
                  <h2 className='text-3xl font-bold text-red-600 mb-4'>
                    You are the SPY
                  </h2>
                  <div className='bg-red-100 rounded-lg p-4 mb-6'>
                    <p className='text-red-800 font-medium mb-2'>Your mission:</p>
                    <ul className='text-red-700 text-sm space-y-1'>
                      <li>• Figure out the location through questions</li>
                      <li>• Don't reveal you don't know the location</li>
                      <li>• Try to blend in with other players</li>
                      <li>• Avoid getting voted out!</li>
                    </ul>
                  </div>
                </>
              ) : (
                // Non-Spy Card
                <>
                  <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <Eye className='w-10 h-10 text-blue-600' />
                  </div>
                  <h2 className='text-2xl font-bold text-blue-600 mb-2'>
                    Location
                  </h2>
                  <p className='text-3xl font-bold text-slate-900 mb-4'>
                    {role.location}
                  </p>
                  <h3 className='text-lg font-semibold text-blue-600 mb-2'>
                    Your Role
                  </h3>
                  <p className='text-xl font-medium text-slate-700 mb-6'>
                    {role.role}
                  </p>
                  <div className='bg-blue-100 rounded-lg p-4'>
                    <p className='text-blue-800 font-medium mb-2'>Remember:</p>
                    <ul className='text-blue-700 text-sm space-y-1'>
                      <li>• Ask questions about this location</li>
                      <li>• Don't reveal the location directly</li>
                      <li>• Try to identify the spy</li>
                      <li>• Act like you belong in this role</li>
                    </ul>
                  </div>
                </>
              )}
              
              <div className='mt-6 flex items-center justify-center text-slate-500'>
                <span className='text-sm mr-2'>Tap to continue</span>
                <ArrowRight className='w-4 h-4' />
              </div>
            </>
          )}
        </div>
        {/* Interactive overlay for visual feedback */}
        <style dangerouslySetInnerHTML={{__html: `.group:active { transform: scale(0.97); } .group:focus { box-shadow: 0 0 0 3px #2563eb33; }`}} />
      </div>

      {/* Action Button */}
      {/* Removed: Only card tap advances */}

      {/* Privacy Reminder (when revealed) */}
      {isRevealed && (
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <EyeOff className='w-5 h-5 text-amber-600' />
            <div>
              <p className='text-sm text-amber-800 font-medium'>
                Keep this information secret!
              </p>
              <p className='text-xs text-amber-700'>
                Don't let other players see your role when passing the device.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
