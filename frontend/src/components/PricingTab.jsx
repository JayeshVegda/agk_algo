import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { Check, ShieldAlert, Zap, ArrowRight, Timer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getPlans, useSiteSettings } from '../lib/wallets';
import { cycleDay } from '../lib/signalCycles';

export function PricingTab({ user, onNavigate, schedule }) {
  const [myPayments, setMyPayments] = useState([]);

  const loadMyPayments = useCallback(async () => {
    if (!user?.email) { setMyPayments([]); return; }
    try {
      const records = await pb.collection('payments').getFullList({
        filter: pb.filter("user_email = {:email}", { email: user.email }),
        sort: '-created'
      });
      setMyPayments(records);
    } catch {
      setMyPayments([]);
    }
  }, [user?.email]);

  useEffect(() => {
    loadMyPayments();
    if (!user?.email) return;
    const unsub = pb.collection('payments').subscribe('*', () => loadMyPayments()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, [user?.email, loadMyPayments]);

  const settings = useSiteSettings();
  const cycle = schedule?.checkout;
  const plans = getPlans(settings).map((plan) => ({
    ...plan,
    price: cycle ? (plan.id === 'SR_SIGNAL_BOX' ? cycle.srPrice : cycle.vipPrice) : plan.price,
  }));
  const pendingPlans = new Set(myPayments
    .filter((payment) => payment.status === 'pending' && payment.signal_cycle === cycle?.id)
    .map((payment) => payment.plan));

  const planCta = (plan) => {
    if (!cycle) return { label: 'Checkout closed', disabled: true };
    if (pendingPlans.size) return { label: 'Verification in progress', icon: 'timer', disabled: true };
    return { label: `Select ${plan.name}`, icon: 'arrow' };
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans text-akg-text">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Badge variant="emerald" className="gap-1.5 py-1 px-3 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Scheduled Signal Cycles</span>
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-akg-text tracking-tight font-display">
          Signal Subscriptions and Memberships
        </h1>
        <p className="text-sm text-akg-muted max-w-lg mx-auto leading-relaxed">
          Predictable cycle renewals. Zero automated credit card charges or recurring fees. Direct crypto settlement in USDT.
        </p>
      </div>

      <div className="rounded-xl border border-akg-hairline bg-akg-card px-5 py-4 text-sm text-akg-text" role="status">
        {cycle ? <><strong>{cycle.name}</strong> · {cycleDay(cycle.startsAt)} to {cycleDay(cycle.endsAt, true)}</> :
          schedule?.enrolledNext ? <>You’re enrolled. Access starts {cycleDay(schedule.enrolledNext.startsAt)}.</> :
          schedule?.next ? <>Renewals open {cycleDay(schedule.next.renewalsAt)}. The next cycle starts {cycleDay(schedule.next.startsAt)}.</> :
          'Checkout opens when the desk schedules a cycle.'}
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = schedule?.plan === plan.id;
          const cta = planCta(plan);
          const hasPending = pendingPlans.has(plan.id);

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all bg-akg-card ${
                plan.popular
                  ? 'border-akg-accent/50 ring-1 ring-akg-accent/20 shadow-sm'
                  : 'border-akg-hairline hover:border-akg-hairline/80'
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.popular ? 'emerald' : 'secondary'}>
                      {plan.tag}
                    </Badge>
                    {isCurrentPlan ? (
                      <span className="text-xs font-semibold text-akg-green flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <Check className="h-3 w-3" /> Your current plan
                      </span>
                    ) : hasPending && user ? (
                      <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        <Timer className="h-3 w-3" /> Pending Verification
                      </span>
                    ) : null}
                  </div>

                  <CardTitle className="mt-3 text-2xl font-bold text-akg-text">
                    {plan.name}
                  </CardTitle>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tabular-nums text-akg-text">${plan.price}</span>
                    <span className="text-xs text-akg-accent font-bold">USDT</span>
                    <span className="text-xs text-akg-muted ml-1">/ {plan.period}</span>
                  </div>

                  <CardDescription className="mt-2 text-xs text-akg-muted">
                    Access follows the dates set by the desk.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-[10px] font-mono font-semibold text-akg-muted uppercase tracking-wider mb-2">
                    Included Benefits
                  </div>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-akg-text">
                      <Check className="h-4 w-4 text-akg-green shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="pt-6 border-t border-akg-hairline mt-6 space-y-2">
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  disabled={cta.disabled}
                  onClick={() => {
                    if (!cycle) return;
                    sessionStorage.setItem('akg_order', JSON.stringify({
                      kind: 'plan', id: plan.id, name: plan.name, price: plan.price, cycleId: cycle.id,
                      cycleName: cycle.name, startsAt: cycle.startsAt, endsAt: cycle.endsAt,
                    }));
                    if (onNavigate) onNavigate('checkout');
                  }}
                  className="w-full justify-center gap-2"
                >
                  {cta.icon === 'timer' && <Timer className="h-4 w-4" />}
                  {cta.icon === 'arrow' && <ArrowRight className="h-4 w-4" />}
                  <span>{cta.label}</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Risk Notice */}
      <div className="p-4 rounded-xl border border-akg-hairline bg-akg-card text-xs text-akg-muted flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-akg-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for educational and analytical purposes.
        </p>
      </div>

    </div>
  );
}
