
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Client, Service, Project, Profile } from '../types.ts';
import { MOCK_CLIENTS, MOCK_SERVICES, MOCK_PROJECTS, MOCK_PROFILES } from '../constants.tsx';
import { useWorkspace } from '../context/WorkspaceContext';

export const useSystemData = () => {
  const { currentWorkspace } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
        // Parallel fetching
        const [clientsRes, servicesRes, projectsRes, teamRes] = await Promise.all([
            supabase.from('clients').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
            supabase.from('services').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
            supabase.from('projects').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
            supabase.from('team_member').select('*').eq('workspace_id', currentWorkspace.id)
        ]);

        // Do not fallback to Mocks if DB is empty, only if there is an error
        setClients(clientsRes.data || []);
        setServices(servicesRes.data || []);
        
        const formattedProjects = (projectsRes.data || []).map((p: any) => ({
            ...p,
            hourlyRate: p.hourly_rate
        }));
        setProjects(formattedProjects);
        
        setTeamMembers(teamRes.data || []);
        
    } catch (e) {
        console.error("System Data Fetch Error", e);
        // Fallback to mocks to prevent app crash if SQL hasn't been run
        setClients(MOCK_CLIENTS);
        setServices(MOCK_SERVICES);
        setProjects(MOCK_PROJECTS);
        setTeamMembers(MOCK_PROFILES);
    } finally {
        setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchData();
    
    if (!currentWorkspace) return;

    // Subscribe to changes in all relevant tables
    const channels = [
        supabase.channel('public:clients').on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => fetchData()).subscribe(),
        supabase.channel('public:services').on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => fetchData()).subscribe(),
        supabase.channel('public:projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => fetchData()).subscribe(),
        supabase.channel('public:team_member').on('postgres_changes', { event: '*', schema: 'public', table: 'team_member', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => fetchData()).subscribe(),
    ];

    return () => {
        channels.forEach(c => supabase.removeChannel(c));
    };
  }, [fetchData, currentWorkspace]);

  return { clients, services, projects, teamMembers, loading, refresh: fetchData };
};
