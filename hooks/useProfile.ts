
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export interface ComprehensiveProfile {
  id: string;
  type: 'team' | 'client';
  name: string;
  email: string;
  role: string;
  avatar: string;
  bio: string;
  location: string;
  timezone: string;
  website: string;
  joined: string;
  socials: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  timeline: {
    id: number;
    role: string;
    company: string;
    period: string;
    current: boolean;
  }[];
  stats: {
    projects: number;
    tasks: number;
    activity: number;
  };
  skills?: string[]; // Team only
  company?: string; // Client only
}

export const useProfile = (profileId?: string) => {
  const { user, updateUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [profile, setProfile] = useState<ComprehensiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = user && profile && profile.email === user.email;

  // Helper to format DB response to Frontend structure
  const formatProfile = (data: any, type: 'team' | 'client'): ComprehensiveProfile => ({
    id: data.id,
    type,
    name: data.name,
    email: data.email,
    role: data.role || data.position || (type === 'client' ? 'Partner' : 'Team Member'),
    avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
    bio: data.bio || `A valued ${type} in the AgencyOS ecosystem.`,
    location: data.location || 'Remote',
    timezone: data.timezone || 'UTC',
    website: data.website || '',
    joined: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    socials: data.socials || { twitter: '', github: '', linkedin: '' },
    timeline: data.timeline || [],
    stats: data.stats || { projects: 0, tasks: 0, activity: 0 },
    skills: data.skills || [],
    company: data.company
  });

  const fetchProfile = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    
    // Determine Target ID
    const targetId = (!profileId || profileId === 'current') ? user.uid : profileId;

    try {
      // 1. Try finding in Team Member table (Singular)
      let teamQuery = supabase
        .from('team_member')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);
        
      if (targetId === user.uid) {
          teamQuery = teamQuery.eq('email', user.email);
      } else {
          teamQuery = teamQuery.eq('id', targetId);
      }

      const { data: teamData, error: teamError } = await teamQuery.maybeSingle();

      if (teamData) {
        setProfile(formatProfile(teamData, 'team'));
        setLoading(false);
        return;
      }

      // 2. If not found, try Clients
      let clientQuery = supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);
        
      if (targetId === user.uid) {
          clientQuery = clientQuery.eq('email', user.email);
      } else {
          clientQuery = clientQuery.eq('id', targetId);
      }

      const { data: clientData, error: clientError } = await clientQuery.maybeSingle();

      if (clientData) {
        setProfile(formatProfile(clientData, 'client'));
        setLoading(false);
        return;
      }

      // 3. Fallback: If 'current' and no profile exists yet (new user sync lag), create minimal local representation
      if (targetId === user.uid) {
         setProfile({
             id: user.uid,
             type: 'team',
             name: user.name,
             email: user.email,
             role: user.role,
             avatar: user.avatar,
             bio: 'New user.',
             location: 'Remote',
             timezone: 'UTC',
             website: '',
             joined: 'Just now',
             socials: { twitter: '', github: '', linkedin: '' },
             timeline: [],
             stats: { projects: 0, tasks: 0, activity: 0 },
             skills: []
         });
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user, profileId]);

  const updateProfile = async (updates: Partial<ComprehensiveProfile>) => {
    if (!profile) return;

    // Merge updates with existing profile to ensure we have a complete object for upsert
    const merged = { ...profile, ...updates };

    const basePayload = {
        id: profile.id,
        workspace_id: currentWorkspace?.id,
        name: merged.name,
        email: merged.email,
        avatar: merged.avatar,
    };

    const payload = profile.type === 'team' 
        ? {
            ...basePayload,
            role: merged.role,
            bio: merged.bio,
            location: merged.location,
            timezone: merged.timezone,
            socials: merged.socials,
            skills: merged.skills
        }
        : {
            ...basePayload,
            position: merged.role,
            website: merged.website,
            company: merged.company
        };

    const table = profile.type === 'team' ? 'team_member' : 'clients';

    // Optimistic
    setProfile(merged);
    
    if (isOwnProfile) {
        updateUser({ avatar: merged.avatar, name: merged.name });
        // Also update auth metadata so it syncs globally
        supabase.auth.updateUser({
            data: { avatar_url: merged.avatar, full_name: merged.name }
        });
    }

    const { error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'id' })
        .select();

    if (error) {
        console.error("Update failed:", error);
        fetchProfile(); // Revert
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refresh: fetchProfile };
};
