import {
  LayoutDashboard, CreditCard, Zap, Cpu, Bell, Package, Users as UsersIcon, Settings as Cog,
} from 'lucide-react';

export const SECTIONS = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard, group: 'inbox' },
  { id: 'payments', label: 'Money Queue', short: 'Money', icon: CreditCard, group: 'inbox', badge: 'pendingPayments' },
  { id: 'users', label: 'Traders', short: 'Traders', icon: UsersIcon, group: 'people' },
  { id: 'bots', label: 'Expert Advisors', short: 'Bots', icon: Cpu, group: 'catalog' },
  { id: 'resources', label: 'Traders Kit', short: 'Kit', icon: Package, group: 'catalog' },
  { id: 'signals', label: 'Signals', short: 'Signals', icon: Zap, group: 'content' },
  { id: 'briefings', label: 'Briefings', short: 'Briefs', icon: Bell, group: 'content' },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: Cog, group: 'system' },
];

export const GROUPS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'people', label: 'People' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'content', label: 'Content' },
  { id: 'system', label: 'System' },
];

export const MOBILE_TABS = ['overview', 'payments', 'signals'];

export const SECTION_IDS = new Set(SECTIONS.map((s) => s.id));
