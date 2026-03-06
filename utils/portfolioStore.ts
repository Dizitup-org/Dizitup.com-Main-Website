// utils/portfolioStore.ts — replaces Supabase portfolio calls
import { api } from './apiClient';

export type PortfolioProject = {
  id: string;
  title: string;
  category: string;
  link: string;
  description?: string;
  image_url?: string;
  is_featured: boolean;
  created_at?: string;
};

function mapItem(p: any): PortfolioProject {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    link: p.link || p.project_url || '',
    description: p.description,
    image_url: p.image_url,
    is_featured: p.is_featured,
    created_at: p.created_at,
  };
}

export async function getPublishedPortfolio(): Promise<PortfolioProject[]> {
  try {
    const res = await api.get('/api/portfolio') as any;
    return (res.portfolio || []).map(mapItem);
  } catch (err) { return []; }
}

export async function getAllPortfolio(): Promise<PortfolioProject[]> {
  try {
    const res = await api.get('/api/admin/portfolio') as any;
    return (res.portfolio || []).map(mapItem);
  } catch (err) { return []; }
}

export async function addPortfolioProject(project: { title: string; category: string; link: string; description?: string; image_url?: string }): Promise<{ data: PortfolioProject | null; error: string | null }> {
  try {
    const res = await api.post('/api/admin/portfolio', { ...project, is_featured: true }) as any;
    return { data: res.item, error: null };
  } catch (err: any) { return { data: null, error: err.message }; }
}

export async function deletePortfolioProject(id: string): Promise<{ error: string | null }> {
  try {
    await api.delete(`/api/admin/portfolio/${id}`);
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}

export async function togglePortfolioPublished(id: string, is_featured: boolean): Promise<{ error: string | null }> {
  try {
    await api.put(`/api/admin/portfolio/${id}`, { is_featured });
    return { error: null };
  } catch (err: any) { return { error: err.message }; }
}