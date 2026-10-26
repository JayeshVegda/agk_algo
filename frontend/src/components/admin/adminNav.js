import {
  LayoutDashboard, CreditCard, Zap, Cpu, Bell, Package, Users as UsersIcon, Radio, Settings as Cog,
} from 'lucide-react';

export const SECTIONS = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard, group: 'Main' },
  { id: 'payments', label: 'Money Queue', short: 'Money', icon: CreditCard, group: 'Main', badge: 'pendingPayments' },
  { id: 'signals', label: 'Signals', short: 'Signals', icon: Zap, group: 'Main' },
  { id: 'briefings', label: 'Briefings', short: 'Briefs', icon: Bell, group: 'Desk' },
  { id: 'bots', label: 'Expert Advisors', short: 'Bots', icon: Cpu, group: 'Desk' },
  { id: 'resources', label: 'Traders Kit', short: 'Kit', icon: Package, group: 'Desk' },
  { id: 'users', label: 'Traders', short: 'Traders', icon: UsersIcon, group: 'Desk' },
  { id: 'connectors', label: 'Managed Accounts', short: 'Accounts', icon: Radio, group: 'Desk', badge: 'pendingConnectors' },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: Cog, group: 'Desk' },
];

export const MOBILE_TABS = ['overview', 'payments', 'signals'];

export const SECTION_IDS = new Set(SECTIONS.map((s) => s.id));
