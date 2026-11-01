import React, { useEffect, useState } from 'react';
import { pb } from '../../../lib/pocketbase';
import SignalRoom from '../../SignalRoom';

// Same SignalRoom the public tab renders, embedded straight into the admin
// portal (?s=signals) so the composer lives inside the desk shell.
export default function Signals() {
  const [user, setUser] = useState(pb.authStore.record);
  useEffect(() => pb.authStore.onChange((_, model) => setUser(model || null)), []);
  return (
    <div className="mx-auto w-full max-w-[1100px] px-1 pb-14 lg:pb-2">
      <SignalRoom user={user} onOpenPricing={() => {}} onOpenAuth={() => {}} />
    </div>
  );
}
