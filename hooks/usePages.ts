
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export const usePages = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!user || !currentWorkspace) {
        console.log("[usePages] Missing user or workspace, skipping fetch", { user: !!user, workspace: !!currentWorkspace });
        return;
    }
    setLoading(true);
    try {
      console.log(`[usePages] Fetching pages for workspace: ${currentWorkspace.id}`);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Filter pages based on role and permissions
      // Owners and Admins see everything in the workspace
      console.log(`[usePages] User state for filtering:`, { 
          role: user.role, 
          isAdmin: user.isAdmin, 
          isOwner: user.isOwner, 
          allowedPageIds: user.allowedPageIds 
      });

      if (user.isOwner || user.isAdmin) {
          console.log(`[usePages] User is ${user.isOwner ? 'owner' : 'admin'}, showing all ${data?.length || 0} pages.`);
      } else {
          // Team members and clients see ONLY pages they are explicitly allowed to see
          const allowedIds = Array.isArray(user.allowedPageIds) ? user.allowedPageIds : [];
          console.log(`[usePages] User is ${user.role}, allowedPageIds:`, allowedIds);
          
          if (allowedIds.length > 0) {
              filteredData = filteredData.filter((p: any) => allowedIds.includes(p.id));
              console.log(`[usePages] Filtered pages for ${user.role}: ${filteredData.length} of ${data?.length || 0}`);
          } else {
              filteredData = [];
              console.log(`[usePages] ${user.role} has no page permissions, showing 0 pages.`);
          }
      }
      
      const formatted: Page[] = filteredData.map((p: any) => ({
          ...p,
          updatedAt: new Date(p.updated_at).toLocaleDateString(),
          // Ensure deleted is boolean
          deleted: !!p.deleted,
          // Ensure blocks is array
          blocks: p.blocks || []
      }));
      
      setPages(formatted);
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const getPageById = async (id: string): Promise<Page | null> => {
      try {
        // Fetch page by ID or Slug. 
        // Note: For public pages to work without auth, RLS policies must be set to allow SELECT on 'pages' table for anon role where status = 'Published'.
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .or(`id.eq.${id},slug.eq.${id}`)
            .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple match (unlikely with ID) or 404 if none

        if (error) {
            console.error("Supabase Error fetching page:", error);
            return null;
        }

        if (!data) return null;

        // Check permissions for non-owners/non-admins
        if (user && !user.isOwner && !user.isAdmin) {
            const allowedIds = Array.isArray(user.allowedPageIds) ? user.allowedPageIds : [];
            if (!allowedIds.includes(data.id)) {
                console.warn(`Access denied to page: ${data.id} for role: ${user.role}`);
                return null;
            }
        }

        // Increment view count if public
        if (data.status === 'Published') {
            // Fire and forget view increment
            supabase.rpc('increment_page_view', { page_id: data.id }).then(({ error }) => {
                if(error) console.warn("Failed to increment view", error);
            });
        }

        return {
            ...data,
            updatedAt: new Date(data.updated_at).toLocaleDateString(),
            blocks: data.blocks || [] // Ensure blocks exist
        };
      } catch (err) {
          console.error("Exception fetching page:", err);
          return null;
      }
  };

  const { checkSharedLimit } = usePlanEnforcement();

  const createPage = async (page: Partial<Page>) => {
      if (!user || !currentWorkspace) return null;
      
      const canCreate = await checkSharedLimit('pages', 'pagesLimit');
      if (!canCreate) {
          alert(`Page limit reached. Upgrade your plan to create more pages.`);
          return null;
      }
      
      const newPage = {
          id: page.id || `pg-${Date.now()}`,
          workspace_id: currentWorkspace.id,
          owner_id: user.uid,
          title: page.title || 'Untitled',
          slug: page.slug || `page-${Date.now()}`,
          status: 'Draft',
          blocks: page.blocks || [],
          settings: page.settings || {},
          folder_id: page.folderId || null,
          pinned: false,
          deleted: false,
          updated_at: new Date().toISOString()
      };

      // Optimistic
      setPages(prev => [newPage as any, ...prev]);

      const { error } = await supabase.from('pages').insert([newPage]);
      if (error) {
          console.error("Error creating page:", error);
          fetchPages();
          return null;
      }
      return newPage;
  };

  const updatePage = async (id: string, updates: Partial<Page>) => {
      // Optimistic
      setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      
      // Cleanup frontend keys that don't match DB if necessary
      if (updates.folderId !== undefined) {
          payload.folder_id = updates.folderId;
          delete payload.folderId;
      }
      delete payload.updatedAt; // Don't send formatted date
      delete payload.owner; // Read only
      
      const { error } = await supabase.from('pages').update(payload).eq('id', id);
      if (error) {
          console.error("Error updating page:", error);
          fetchPages();
      }
  };

  const deletePage = async (id: string) => {
      // Hard delete from DB
      setPages(prev => prev.filter(p => p.id !== id));
      await supabase.from('pages').delete().eq('id', id);
  };

  // Soft Delete toggles 'deleted' boolean
  const softDeletePage = async (id: string) => {
      updatePage(id, { deleted: true });
  };

  const restorePage = async (id: string) => {
      updatePage(id, { deleted: false });
  };

  useEffect(() => {
    fetchPages();
    const sub = supabase.channel('pages_db')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pages' }, fetchPages)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchPages]);

  return {
      pages,
      loading,
      getPageById,
      createPage,
      updatePage,
      deletePage,
      softDeletePage,
      restorePage,
      refresh: fetchPages
  };
};
