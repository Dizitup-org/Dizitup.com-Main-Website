import { supabase } from './supabaseClient';

export type PortfolioProject = {
  id: string;
  title: string;
  category: string;
  link: string;
  display_order: number;
  is_published: boolean;
  created_at?: string;
};

// ── Fetch all published projects (public-facing) ──
export async function getPublishedPortfolio(): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getPublishedPortfolio] Error:', error);
    return [];
  }
  return data as PortfolioProject[];
}

// ── Fetch ALL projects (admin view, includes unpublished) ──
export async function getAllPortfolio(): Promise<PortfolioProject[]> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllPortfolio] Error:', error);
    return [];
  }
  return data as PortfolioProject[];
}

// ── Add a new project ──
export async function addPortfolioProject(
  project: { title: string; category: string; link: string }
): Promise<{ data: PortfolioProject | null; error: string | null }> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .insert({
      title: project.title,
      category: project.category,
      link: project.link,
      is_published: true,
      display_order: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[addPortfolioProject] Error:', error);
    return { data: null, error: error.message };
  }
  return { data: data as PortfolioProject, error: null };
}

// ── Delete a project ──
export async function deletePortfolioProject(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('portfolio_projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deletePortfolioProject] Error:', error);
    return { error: error.message };
  }
  return { error: null };
}

// ── Toggle published status ──
export async function togglePortfolioPublished(
  id: string,
  isPublished: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('portfolio_projects')
    .update({ is_published: isPublished })
    .eq('id', id);

  if (error) {
    console.error('[togglePortfolioPublished] Error:', error);
    return { error: error.message };
  }
  return { error: null };
}
