
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Invoice } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

// Helper to ensure we don't break if DB columns differ slightly
const mapFromDb = (data: any): Invoice & any => {
  return {
    ...data,
    // Map snake_case DB columns to camelCase frontend types
    clientEmail: data.client_email,
    dueDate: data.due_date,
    fromName: data.from_name,
    fromAddress: data.from_address,
    // JSONB columns usually come back as objects automatically in Supabase JS
    items: data.items || [],
    settings: data.settings || {},
    logo: data.logo || null
  };
};

const mapToDb = (invoice: any, userId: string, workspaceId: string) => {
  return {
    id: invoice.id,
    workspace_id: workspaceId,
    owner_id: userId,
    number: invoice.number,
    client: invoice.client,
    client_email: invoice.clientEmail,
    amount: invoice.amount,
    date: invoice.date,
    due_date: invoice.dueDate,
    status: invoice.status,
    from_name: invoice.fromName,
    from_address: invoice.fromAddress,
    notes: invoice.notes,
    logo: invoice.logo,
    items: invoice.items,      // JSONB
    settings: invoice.settings // JSONB
  };
};

export const useInvoices = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();

  const fetchInvoices = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setInvoices(data.map(mapFromDb));
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const getInvoiceById = async (id: string) => {
    if (!currentWorkspace) return null;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)
        .single();

      if (error) throw error;
      return mapFromDb(data);
    } catch (err) {
      console.error(`Error fetching invoice ${id}:`, err);
      return null;
    }
  };

  const upsertInvoice = async (invoiceData: any) => {
    if (!user || !currentWorkspace) return false;

    const isNew = !invoices.find(i => i.id === invoiceData.id);
    if (isNew) {
      const canCreate = await checkSharedLimit('invoices', 'invoicesLimit');
      if (!canCreate) {
        alert(`Invoice limit reached. Upgrade your plan to create more invoices.`);
        return false;
      }
    }

    // Optimistic Update
    setInvoices(prev => {
      const exists = prev.find(i => i.id === invoiceData.id);
      if (exists) {
        return prev.map(i => i.id === invoiceData.id ? { ...i, ...invoiceData } : i);
      }
      return [invoiceData, ...prev];
    });

    const payload = mapToDb(invoiceData, user.uid, currentWorkspace.id);

    const { error } = await supabase.from('invoices').upsert(payload);
    
    if (error) {
      console.error('Error saving invoice:', error);
      fetchInvoices(); // Revert on error
      return false;
    }
    return true;
  };

  const deleteInvoice = async (id: string) => {
    if (!currentWorkspace) return;
    setInvoices(prev => prev.filter(i => i.id !== id));
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('workspace_id', currentWorkspace.id);

    if (error) {
      console.error('Error deleting invoice:', error);
      fetchInvoices();
    }
  };

  const updateStatus = async (id: string, status: string) => {
     if (!currentWorkspace) return;
     console.log(`Updating invoice ${id} to ${status}`);
     
     // 1. Optimistic Update (Local State)
     setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: status as any } : i));
     
     // 2. Update Invoice in DB and get full object back to check settings
     const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)
        .select()
        .single();
     
     if (error) {
         console.error("Error updating invoice status in DB:", error);
         fetchInvoices(); // Revert
         return;
     }

     // 3. Sync Linked Order (If applicable)
     // Check settings JSONB column
     const settings = updatedInvoice?.settings || {};
     const linkedOrderId = settings.orderId;
     
     if (linkedOrderId) {
         console.log(`Found linked order ID: ${linkedOrderId}. Syncing status to: ${status}`);
         
         // Update the order status to match the invoice status
         const { error: orderError } = await supabase
            .from('orders')
            .update({ status: status }) 
            .eq('id', linkedOrderId);
         
         if (orderError) {
             console.error("CRITICAL: Failed to sync linked order status:", orderError);
         } else {
             console.log("Order status synced successfully.");
         }
     } else {
         console.log("No linked order ID found in invoice settings.");
     }

     // 4. Trigger Global Refresh Events to update Orders page UI
     window.dispatchEvent(new Event('agencyos_config_updated'));
     window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    fetchInvoices();
    
    if (!currentWorkspace) return;

    const channel = supabase
      .channel('invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => {
          fetchInvoices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInvoices, currentWorkspace]);

  return {
    invoices,
    loading,
    fetchInvoices,
    getInvoiceById,
    upsertInvoice,
    deleteInvoice,
    updateStatus,
    refresh: fetchInvoices
  };
};
