import React from 'react';
import SignalRoom from './SignalRoom';

export function SignalsTab({ user, onOpenPricing, onOpenAuth }) {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-2 pt-2 sm:px-4">
      <SignalRoom user={user} onOpenPricing={onOpenPricing} onOpenAuth={onOpenAuth} />
    </div>
  );
}

export default SignalsTab;
