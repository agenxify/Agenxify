
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StoreConfig, StoreUser, Service, Order } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { DEFAULT_STORE_CONFIG } from '../pages/PublicStore.tsx';

export const useStore = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [loading, setLoading] = useState(true);

  // --- Configuration ---
  const fetchConfig = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('config')
        .eq('workspace_id', currentWorkspace.id)
        .limit(1)
        .single();

      if (data && data.config) {
        setConfig({ ...DEFAULT_STORE_CONFIG, ...data.config });
      }
    } catch (err) {
      console.log('Using default store config');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = async (newConfig: StoreConfig) => {
    if (!user || !currentWorkspace) return;
    
    // Check if a config row exists
    const { data: existing } = await supabase.from('store_settings')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .limit(1)
        .single();

    if (existing) {
        await supabase.from('store_settings').update({ config: newConfig }).eq('id', existing.id);
    } else {
        await supabase.from('store_settings').insert([{ 
            workspace_id: currentWorkspace.id,
            owner_id: user.uid, 
            config: newConfig 
        }]);
    }
    
    setConfig(newConfig);
  };

  // --- Public Catalog ---
  const fetchPublicServices = async () => {
    if (!currentWorkspace) return [];
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('created_at', { ascending: false });
    
    return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: s.type,
        pricingType: s.pricing_type,
        price: s.price,
        image: s.image,
        creditsIncluded: s.credits_included,
        hoursIncluded: s.hours_included,
        ...(s.metadata || {})
    })) as Service[];
  };

  // --- Store Users (Auth) ---
  const loginStoreUser = async (email: string): Promise<StoreUser | null> => {
      if (!currentWorkspace) return null;
      const { data } = await supabase.from('store_users')
        .select('*')
        .eq('email', email)
        .eq('workspace_id', currentWorkspace.id)
        .single();
      if (!data) return null;
      
      // Update last login
      await supabase.from('store_users').update({ last_login: new Date().toISOString() }).eq('id', data.id);
      
      return {
          id: data.id,
          name: data.name,
          email: data.email,
          ...data.details
      };
  };

  const registerStoreUser = async (user: Partial<StoreUser>): Promise<StoreUser | null> => {
      if (!currentWorkspace) return null;
      // Check if exists
      const { data: existing } = await supabase.from('store_users')
        .select('*')
        .eq('email', user.email)
        .eq('workspace_id', currentWorkspace.id)
        .single();
      if (existing) return loginStoreUser(user.email!);

      const newUser = {
          workspace_id: currentWorkspace.id,
          name: user.name,
          email: user.email,
          details: {
              phone: user.phone,
              company: user.company,
              address: user.address,
              city: user.city,
              country: user.country,
              zip: user.zip,
              registeredAt: new Date().toISOString(),
              ordersCount: 0,
              totalSpent: 0
          }
      };

      const { data, error } = await supabase.from('store_users').insert([newUser]).select().single();
      
      if (error || !data) return null;

      return {
          id: data.id,
          name: data.name,
          email: data.email,
          ...data.details
      };
  };

  const fetchStoreUsers = async () => {
      if (!user || !currentWorkspace) return [];
      const { data } = await supabase.from('store_users')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });
      return (data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          ...u.details
      }));
  };

  // --- Orders ---
  const createOrder = async (order: any, cartItems: any[], customId?: string) => {
      if (!currentWorkspace) return null;
      // 1. Check if user exists, if not, create them as a guest customer
      if (order.email) {
          const { data: existingUser } = await supabase.from('store_users')
            .select('id, details')
            .eq('email', order.email)
            .eq('workspace_id', currentWorkspace.id)
            .single();
          
          if (!existingUser) {
              // Register new guest user automatically
              await supabase.from('store_users').insert([{
                  workspace_id: currentWorkspace.id,
                  name: order.name,
                  email: order.email,
                  details: {
                      phone: order.phone,
                      address: order.address,
                      city: order.city,
                      country: order.country,
                      zip: order.zip,
                      registeredAt: new Date().toISOString(),
                      ordersCount: 1,
                      totalSpent: order.amount
                  },
                  last_login: new Date().toISOString()
              }]);
          } else {
              // Update existing user stats
              const currentDetails = existingUser.details || {};
              await supabase.from('store_users').update({
                  details: {
                      ...currentDetails,
                      ordersCount: (currentDetails.ordersCount || 0) + 1,
                      totalSpent: (currentDetails.totalSpent || 0) + order.amount,
                      // Update address info if provided in this order
                      address: order.address || currentDetails.address,
                      city: order.city || currentDetails.city,
                      country: order.country || currentDetails.country,
                      zip: order.zip || currentDetails.zip,
                      phone: order.phone || currentDetails.phone
                  },
                  last_login: new Date().toISOString()
              }).eq('id', existingUser.id).eq('workspace_id', currentWorkspace.id);
          }
      }

      // 2. Insert Order with Explicit ID if provided
      const orderPayload: any = {
          workspace_id: currentWorkspace.id,
          customer_email: order.email,
          customer_name: order.name,
          total_amount: order.amount,
          status: 'Pending',
          details: { ...order, items: cartItems }
      };

      // Force ID if provided (requires DB column to allow text input for ID, e.g. "ORD-123456")
      if (customId) {
          orderPayload.id = customId;
      }

      const { data: orderData, error } = await supabase.from('orders').insert([orderPayload]).select().single();

      if (error) {
          console.error("Order creation failed", error);
          return null;
      }

      // 3. Insert Corresponding Invoice (Billing Page Integration)
      // This ensures the order appears in the Invoices page for processing/tracking
      if (user && orderData && currentWorkspace) {
          const invoiceId = `INV-${orderData.id.replace(/[^0-9]/g, '')}`; // Generate invoice ID based on Order ID numbers
          const invoicePayload = {
              id: invoiceId,
              workspace_id: currentWorkspace.id,
              owner_id: user.uid,
              number: Math.floor(100000 + Math.random() * 900000).toString(),
              client: order.name,
              client_email: order.email,
              amount: order.amount,
              status: 'Pending', // Allows admin to mark as Paid later
              date: new Date().toISOString(),
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              from_name: config.storeName || 'Agency Store',
              from_address: 'Online Order',
              items: cartItems.map(item => ({
                  description: item.name,
                  quantity: 1,
                  rate: item.price
              })),
              // CRITICAL: Link the invoice to the order ID for status syncing
              settings: { source: 'Store', orderId: orderData.id }
          };

          const { error: invError } = await supabase.from('invoices').insert([invoicePayload]);
          if (invError) {
              console.error("Failed to generate invoice for order", invError);
          }
      }

      return orderData;
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user || !currentWorkspace) return;
    
    // 1. Update Order in DB
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('workspace_id', currentWorkspace.id);

    if (orderError) {
      console.error("Error updating order status:", orderError);
      return;
    }

    // 2. Find Linked Invoice and Update its status
    // We assume invoice settings->orderId contains this orderId
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, settings')
      .eq('workspace_id', currentWorkspace.id);

    if (invoices) {
       const linkedInvoice = invoices.find((inv: any) => {
           const s = inv.settings || {};
           return String(s.orderId) === String(orderId);
       });

       if (linkedInvoice) {
           console.log(`Syncing linked invoice ${linkedInvoice.id} to ${newStatus}`);
           await supabase
             .from('invoices')
             .update({ status: newStatus })
             .eq('id', linkedInvoice.id);
       }
    }

    // 3. Trigger Global Refresh
    // This allows the UI to update immediately
    window.dispatchEvent(new Event('agencyos_config_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  const fetchOrders = async () => {
      if (!user || !currentWorkspace) return [];
      const { data } = await supabase.from('orders')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });
      
      // We need to fetch invoices to cross-reference IDs and STATUS
      const { data: invoices } = await supabase.from('invoices')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      return (data || []).map((o: any) => {
          // Robust finding of linked invoice
          const linkedInv = invoices?.find((inv: any) => {
             const s = inv.settings || {};
             // Ensure strict comparison, usually strings in JSONB
             return String(s.orderId) === String(o.id);
          });
          
          const invoiceIdDisplay = linkedInv ? linkedInv.id : 'Pending Sync...';
          
          // SOURCE OF TRUTH: If invoice exists, use its status. Otherwise fallback to order status.
          const syncedStatus = linkedInv ? linkedInv.status : o.status;

          return {
              id: o.id,
              customerName: o.customer_name,
              customerEmail: o.customer_email,
              amount: o.total_amount,
              status: syncedStatus, // Force UI to respect Invoice Status
              date: o.created_at,
              serviceName: o.details.items?.[0]?.name || 'Multiple Items',
              serviceId: o.details.items?.[0]?.id,
              invoiceId: invoiceIdDisplay
          };
      });
  };

  // --- Messages ---
  const sendMessage = async (msg: any) => {
      if (!currentWorkspace) return;
      await supabase.from('store_messages').insert([{
          workspace_id: currentWorkspace.id,
          name: msg.name,
          email: msg.email,
          message: msg.message,
          read: false
      }]);
  };

  const fetchMessages = async () => {
      if (!user || !currentWorkspace) return [];
      const { data } = await supabase.from('store_messages')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });
      return (data || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          message: m.message,
          date: m.created_at,
          read: m.read
      }));
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    refreshConfig: fetchConfig,
    saveConfig,
    fetchPublicServices,
    loginStoreUser,
    registerStoreUser,
    fetchStoreUsers,
    createOrder,
    updateOrderStatus, // Exported for use in Orders page
    fetchOrders,
    sendMessage,
    fetchMessages
  };
};
