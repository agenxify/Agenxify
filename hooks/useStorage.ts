
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'Client' | 'Team' | 'Private' | 'Database';
  owner: string;
  date: string;
  url?: string;
  tags?: string[];
  sharedWith?: string[];
  dimensions?: string;
  starred?: boolean;
  parentId?: string | null;
  content?: string | Blob;
  storagePath?: string;
}

export const useStorage = (currentFolderId: string | null) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { getLimit } = usePlanEnforcement();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0); // Total usage in KB

  const fetchFiles = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    try {
      // Fetch files in current folder
      let query = supabase
        .from('storage_files')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('type', { ascending: true }) // Folders usually 'folder' type, handle sort below
        .order('created_at', { ascending: false });

      if (currentFolderId) {
        query = query.eq('parent_id', currentFolderId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mappedFiles: StoredFile[] = (data || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: Number(f.size),
        category: f.category,
        owner: f.owner_name || 'User',
        date: new Date(f.created_at).toLocaleDateString(),
        url: f.url,
        starred: f.is_starred,
        parentId: f.parent_id,
        storagePath: f.storage_path
      }));

      // Sort: Folders first
      mappedFiles.sort((a, b) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return 0;
      });

      setFiles(mappedFiles);

      // Update total usage
      const { data: allFiles } = await supabase.from('storage_files')
        .select('size')
        .eq('owner_id', user.uid);
      const total = allFiles?.reduce((acc, f) => acc + Number(f.size), 0) || 0;
      setStorageUsage(total);

    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentFolderId]);

  const uploadFile = async (file: File, parentId: string | null = currentFolderId) => {
    if (!user || !currentWorkspace) return;

    const storageLimitGB = getLimit('storageLimitGB');
    if (storageLimitGB !== -1) {
        const { data: allFiles } = await supabase.from('storage_files')
            .select('size')
            .eq('owner_id', user.uid);
        const totalUsedKB = allFiles?.reduce((acc, f) => acc + Number(f.size), 0) || 0;
        const totalUsedGB = totalUsedKB / (1024 * 1024);
        const newFileSizeGB = file.size / (1024 * 1024 * 1024);

        if ((totalUsedGB + newFileSizeGB) > storageLimitGB) {
            throw new Error(`Storage limit reached (${storageLimitGB}GB) across all your workspaces. Upgrade your plan for more space.`);
        }
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `${currentWorkspace.id}/${user.uid}/${fileName}`; // Include workspace in path

      const { error: uploadError } = await supabase.storage
        .from('workspace_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('workspace_assets')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('storage_files').insert({
        workspace_id: currentWorkspace.id,
        owner_id: user.uid,
        owner_name: user.name,
        parent_id: parentId,
        name: file.name,
        type: fileExt || 'file',
        size: Math.round(file.size / 1024), // Store in KB
        category: 'Private',
        url: publicUrl,
        storage_path: filePath,
        is_starred: false
      });

      if (dbError) throw dbError;

      if (parentId === currentFolderId) fetchFiles();
      else {
         // Just update usage if we uploaded to a different folder
         const { data: allFiles } = await supabase.from('storage_files')
            .select('size')
            .eq('owner_id', user.uid);
         const total = allFiles?.reduce((acc, f) => acc + Number(f.size), 0) || 0;
         setStorageUsage(total);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      throw error; // Re-throw so UI can handle it
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async (name: string, parentId: string | null = currentFolderId) => {
    if (!user || !currentWorkspace) return null;
    try {
      const { data, error } = await supabase.from('storage_files').insert({
        workspace_id: currentWorkspace.id,
        owner_id: user.uid,
        owner_name: user.name,
        parent_id: parentId,
        name: name,
        type: 'folder',
        size: 0,
        category: 'Private'
      }).select().single();

      if (error) throw error;
      
      if (parentId === currentFolderId) fetchFiles();
      return data;
    } catch (error) {
      console.error('Create folder failed:', error);
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // Get item to find storage path
      const { data: item } = await supabase.from('storage_files').select('*').eq('id', id).single();
      
      if (item && item.storage_path) {
        await supabase.storage.from('workspace_assets').remove([item.storage_path]);
      }
      
      await supabase.from('storage_files').delete().eq('id', id);
      fetchFiles();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const toggleStar = async (id: string, currentStatus: boolean) => {
      await supabase.from('storage_files').update({ is_starred: !currentStatus }).eq('id', id);
      fetchFiles(); // Refresh to show star status
  };

  useEffect(() => {
    fetchFiles();
    
    // Subscribe to changes
    const channel = supabase
      .channel('storage_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'storage_files' }, () => {
          fetchFiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFiles]);

  return { 
    files, 
    loading, 
    uploading, 
    storageUsage,
    uploadFile, 
    createFolder, 
    deleteItem, 
    toggleStar,
    refresh: fetchFiles 
  };
};
