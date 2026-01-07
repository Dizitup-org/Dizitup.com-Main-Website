export type PortfolioProject = {
  id: number;
  title: string;
  category: string;
  link: string;
  timestamp?: string;
};

const STORAGE_KEY = 'dizitup_portfolio';
const EVENT_NAME = 'dizitup:portfolio-updated';

const safeParse = (raw: string | null): unknown => {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getPortfolioProjects = (): PortfolioProject[] => {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((p) => p && typeof p === 'object')
    .map((p: any) => ({
      id: typeof p.id === 'number' ? p.id : Number(p.id) || Date.now(),
      title: typeof p.title === 'string' ? p.title : '',
      category: typeof p.category === 'string' ? p.category : '',
      link: typeof p.link === 'string' ? p.link : '',
      timestamp: typeof p.timestamp === 'string' ? p.timestamp : undefined,
    }))
    .filter((p) => Boolean(p.title) && Boolean(p.link));
};

export const setPortfolioProjects = (projects: PortfolioProject[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

  // Native storage event won't fire on the same tab; we broadcast our own.
  window.dispatchEvent(new Event(EVENT_NAME));
  // Keep the old listener pattern working too.
  window.dispatchEvent(new Event('storage'));
};

export const subscribePortfolioProjects = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const handler = () => onChange();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
};
