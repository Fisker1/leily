import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    // Building projects table not in staging DB
    setProjects([]);
    setLoading(false);
  };

  const saveProject = async (
    projectName: string,
    calculationId: string | null,
    floorPlans: any,
    placedItems: any,
    totalCost: number
  ) => {
    toast.error('Byggeprosjekt-funksjonen er ikke tilgjengelig i staging');
    return null;
  };

  const updateProject = async (
    id: string,
    updates: Partial<Omit<BuildingProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    return null;
  };

  const deleteProject = async (id: string) => {
    return false;
  };

  const loadProject = async (id: string) => {
    return null;
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