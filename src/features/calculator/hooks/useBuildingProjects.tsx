import { useState, useEffect } from 'react';
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BuildingProject {
  id: string;
  project_name: string;
  calculation_id: string | null;
  floor_plans: any;
  placed_items: any;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export const useBuildingProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<BuildingProject[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('building_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching building projects:', error);
      toast.error('Kunne ikke laste byggeprosjekter');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (
    projectName: string,
    calculationId: string | null,
    floorPlans: any,
    placedItems: any,
    totalCost: number
  ) => {
    if (!user) {
      toast.error('Du må være logget inn');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('building_projects')
        .insert({
          user_id: user.id,
          project_name: projectName,
          calculation_id: calculationId,
          floor_plans: floorPlans,
          placed_items: placedItems,
          total_cost: totalCost,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Byggeprosjekt lagret');
      await fetchProjects();
      return data;
    } catch (error) {
      console.error('Error saving building project:', error);
      toast.error('Kunne ikke lagre byggeprosjekt');
      return null;
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<Omit<BuildingProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('building_projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Byggeprosjekt oppdatert');
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error updating building project:', error);
      toast.error('Kunne ikke oppdatere byggeprosjekt');
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('building_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Byggeprosjekt slettet');
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error deleting building project:', error);
      toast.error('Kunne ikke slette byggeprosjekt');
      return false;
    }
  };

  const loadProject = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('building_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading building project:', error);
      toast.error('Kunne ikke laste byggeprosjekt');
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    fetchProjects,
    saveProject,
    updateProject,
    deleteProject,
    loadProject,
  };
};