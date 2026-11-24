import type { Recurrence } from '../types/planner';

export function getLocalTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatEditorialHeaderDate(date = new Date()): {
  weekday: string;
  monthYear: string;
  dayNum: string;
  fullLine: string;
} {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const dayNum = String(date.getDate());
  const year = date.getFullYear();
  return {
    weekday,
    monthYear: `${month} ${year}`,
    dayNum,
    fullLine: `${weekday} · ${month} ${dayNum}, ${year}`,
  };
}

export function formatShortDueDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const today = getLocalTodayISO();
  if (isoDate === today) return 'Today';

  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(target.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function isOverdueDate(isoDate: string | null, isCompleted: boolean): boolean {
  if (!isoDate || isCompleted) return false;
  return isoDate < getLocalTodayISO();
}

export function isDueTodayOrOverdue(isoDate: string | null): boolean {
  if (!isoDate) return false;
  return isoDate <= getLocalTodayISO();
}

export function isUpcomingDate(isoDate: string | null): boolean {
  if (!isoDate) return false;
  return isoDate > getLocalTodayISO();
}

export function computeNextDueDate(currentDueDate: string | null, recurrence: Recurrence): string {
  const baseStr = currentDueDate || getLocalTodayISO();
  const [y, m, d] = baseStr.split('-').map(Number);
  const next = new Date(y, m - 1, d);

  if (recurrence === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  }

  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  const nd = String(next.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning — take your time today.';
  if (hour < 17) return 'Good afternoon — steady progress counts.';
  return 'Good evening — gather what matters for tomorrow.';
}
