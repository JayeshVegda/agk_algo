import { matchesBotPurchase } from '../lib/bots';
import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Cpu, X } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { Button } from './ui/Button';

export function NewRobotModal({ enabled, user, onCheckout }) {
  const [robot, setRobot] = useState(null);
  const [closed, setClosed] = useState('');
  const userEmail = user?.email;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      const page = await pb.collection('bots').getList(1, 1, {
        filter: 'is_live = true && published_at != ""',
        sort: '-published_at',
        fields: 'id,name,platform,price,published_at',
      });
      const latest = page.items[0];
      if (!latest) return;
      if (userEmail) {
        const purchases = await pb.collection('payments').getFullList({
          filter: pb.filter('user_email = {:email} && status != "rejected" && plan ~ {:name}',
            { email: userEmail, name: 'BOT: ' + latest.name }),
          fields: 'plan',
        });
        if (purchases.some(({ plan }) => matchesBotPurchase(plan, latest.name))) return;
      }
      if (active) setRobot(latest);
    })().catch(() => {});
    return () => { active = false; setRobot(null); };
  }, [enabled, userEmail]);

  return (
    <Dialog.Root open={!!(enabled && robot && closed !== robot.id)} onOpenChange={(open) => { if (!open) setClosed(robot?.id); }}>
      {robot && (
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-11/12 max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-akg-hairline bg-akg-card p-6 text-akg-text shadow-2xl">
            <Dialog.Close className="absolute right-3 top-3 rounded-lg p-2 text-akg-muted hover:bg-akg-raised focus-visible:outline-2 focus-visible:outline-akg-accent">
              <X aria-hidden className="h-4 w-4" /><span className="sr-only">Close robot checkout</span>
            </Dialog.Close>
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-akg-accent"><Cpu className="h-5 w-5" /> New trading robot</div>
            <Dialog.Title className="pr-5 font-display text-2xl font-bold">{robot.name}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-akg-muted">{robot.platform} · {robot.price} USDT · One-time purchase</Dialog.Description>
            <Button className="mt-6 w-full justify-between" onClick={() => { setClosed(robot.id); onCheckout(robot); }}>
              Go to checkout <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
