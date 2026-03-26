
import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { Database, Check, AlertCircle, Loader2 } from 'lucide-react';

const DataMigration: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [status, setStatus] = useState<string>('Ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const migrateClients = async () => {
    if (!user || !currentWorkspace) return;
    const local = localStorage.getItem('agencyos_clients');
    if (!local) return log('No local clients found.');
    
    const clients = JSON.parse(local);
    log(`Found ${clients.length} local clients. Uploading...`);

    for (const c of clients) {
       // Format for DB
       const payload = {
         id: c.id,
         workspace_id: currentWorkspace.id,
         owner_id: user.uid,
         name: c.name,
         company: c.company,
         email: c.email,
         status: c.status,
         revenue: c.revenue,
         avatar: c.avatar
       };

       const { error } = await supabase.from('clients').upsert(payload);
       if (error) log(`Error uploading client ${c.name}: ${error.message}`);
    }
    log('Client migration complete.');
  };

  const migrateProjects = async () => {
    if (!user || !currentWorkspace) return;
    const local = localStorage.getItem('agencyos_projects');
    if (!local) return log('No local projects found.');
    
    const projects = JSON.parse(local);
    log(`Found ${projects.length} local projects. Uploading...`);

    for (const p of projects) {
       const payload = {
         id: p.id,
         workspace_id: currentWorkspace.id,
         owner_id: user.uid,
         title: p.title,
         client_name: p.client,
         status: p.status,
         progress: p.progress,
         budget: p.budget,
         due_date: p.dueDate,
       };

       const { error } = await supabase.from('projects').upsert(payload);
       if (error) log(`Error uploading project ${p.title}: ${error.message}`);
    }
    log('Project migration complete.');
  };

  const runMigration = async () => {
     if (!user || !currentWorkspace) {
         setStatus('Error: You must be logged in and have a workspace.');
         return;
     }
     setIsMigrating(true);
     setLogs([]);
     setStatus('Migrating...');
     
     await migrateClients();
     await migrateProjects();
     // Add invoice migration calls here similarly...

     setStatus('Done');
     setIsMigrating(false);
  };

  return (
    <div className="p-10 bg-black min-h-screen text-white flex flex-col items-center">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-blue-600 rounded-2xl text-white">
                <Database size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black">System Migration Tool</h1>
                <p className="text-zinc-400 text-sm">Transfer LocalStorage data to Supabase Cloud</p>
            </div>
         </div>

         <div className="bg-black rounded-xl p-4 border border-zinc-800 h-64 overflow-y-auto font-mono text-xs text-green-400 mb-6">
            {logs.length === 0 ? <span className="text-zinc-600">Waiting to start...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
         </div>

         <button 
            onClick={runMigration} 
            disabled={isMigrating || !user}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
         >
            {isMigrating ? <Loader2 className="animate-spin" /> : <UploadCloud />} 
            {isMigrating ? 'Processing...' : 'Start Migration'}
         </button>
      </div>
    </div>
  );
};

const UploadCloud = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
    <path d="M12 12v9"/>
    <path d="m16 16-4-4-4 4"/>
  </svg>
);

export default DataMigration;
