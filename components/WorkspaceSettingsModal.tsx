import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Users, Shield, Trash2, Mail, Plus, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface WorkspaceSettingsModalProps {
  workspaceId: string;
  onClose: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ workspaceId, onClose }) => {
  const { workspaces, updateWorkspace, getWorkspaceMembers, addWorkspaceMember, removeWorkspaceMember, updateMemberRole } = useWorkspace();
  const workspace = workspaces.find(ws => ws.id === workspaceId);
  
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [name, setName] = useState(workspace?.name || '');
  const [logoUrl, setLogoUrl] = useState(workspace?.logo_url || '');
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'team' | 'client'>('team');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a storage service (like Supabase Storage or S3)
      // and get back a public URL. For now, we'll simulate this with a data URL.
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadMembers = async () => {
    const data = await getWorkspaceMembers(workspaceId);
    setMembers(data);
  };

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      await updateWorkspace(workspaceId, { name, logo_url: logoUrl });
      onClose();
    } catch (err) {
      setError("Failed to update workspace settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await addWorkspaceMember(workspaceId, newMemberEmail, newMemberRole);
      setNewMemberEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message || "Failed to add member.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await removeWorkspaceMember(id);
        await loadMembers();
      } catch (err) {
        setError("Failed to remove member.");
      }
    }
  };

  if (!workspace) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Workspace Settings</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-1">{workspace.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-100 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'general' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}
          >
            General
            {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'members' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}
          >
            Members
            {activeTab === 'members' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-500" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {activeTab === 'general' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Workspace Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Workspace Logo URL</label>
                <div className="flex gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Upload size={24} className="text-slate-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <input 
                    type="text" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm h-fit"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Add Member */}
              <form onSubmit={handleAddMember} className="bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus size={16} className="text-blue-600" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Invite New Member</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder="email@example.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm"
                    />
                  </div>
                  <select 
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm min-w-[120px]"
                  >
                    <option value="team">Team</option>
                    <option value="client">Client</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={isLoading || !newMemberEmail.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    Invite
                  </button>
                </div>
              </form>

              {/* Members List */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Existing Members ({members.length})</h3>
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl group transition-all hover:border-slate-200 dark:hover:border-zinc-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-black flex items-center justify-center border border-slate-200 dark:border-zinc-800">
                          <Users size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{member.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              member.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                              member.role === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {member.role !== 'owner' && (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveGeneral}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
