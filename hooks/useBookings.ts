
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

export const useBookings = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();

  const fetchAll = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [typesRes, bookingsRes] = await Promise.all([
          supabase.from('event_types').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false })
      ]);

      if (typesRes.error) throw typesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      // Map snake_case DB to camelCase if needed, but for these objects we mostly match except intake_fields
      const formattedTypes = (typesRes.data || []).map((t: any) => ({
          ...t,
          locationType: t.location_type,
          locationProvider: t.location_provider,
          intakeFields: t.intake_fields,
          location_url: t.location_url
      }));

      const formattedBookings = (bookingsRes.data || []).map((b: any) => ({
          ...b,
          eventType: b.event_type_id,
          client: b.client_name,
          clientEmail: b.client_email,
          dueDate: b.due_date,
          dueTime: b.due_time,
          meetUrl: b.meet_url
      }));

      setEventTypes(formattedTypes);
      setBookings(formattedBookings);
    } catch (err) {
      console.error('Error fetching bookings data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  // --- Event Types ---
  const addEventType = async (eventType: any) => {
    if (!currentWorkspace) return;

    const canCreate = await checkSharedLimit('event_types', 'bookingsLimit');
    if (!canCreate) {
      alert(`Booking form limit reached. Upgrade your plan to create more booking forms.`);
      return;
    }

    setEventTypes(prev => [eventType, ...prev]);

    const dbType = {
        id: eventType.id || generateId('ET'),
        workspace_id: currentWorkspace.id,
        title: eventType.title,
        slug: eventType.slug,
        duration: eventType.duration,
        description: eventType.description,
        active: eventType.active,
        color: eventType.color,
        location_type: eventType.locationType,
        location_provider: eventType.locationProvider,
        status: eventType.status,
        availability: eventType.availability,
        limits: eventType.limits,
        notifications: eventType.notifications,
        intake_fields: eventType.intakeFields,
        host: eventType.host,
        location_url: eventType.location_url,
        country_code: eventType.country_code,
        phone_number: eventType.phone_number,
        address_street: eventType.address_street,
        address_city: eventType.address_city,
        address_state: eventType.address_state,
        address_zip: eventType.address_zip,
        address_country: eventType.address_country,
        owner_id: user?.uid
    };

    const { error } = await supabase.from('event_types').upsert([dbType]);
    if (error) {
        console.error('Error adding event type:', error);
        fetchAll();
    }
  };

  const deleteEventType = async (id: string) => {
    setEventTypes(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('event_types').delete().eq('id', id);
    if(error) fetchAll();
  };

  // --- Bookings ---
  const addBooking = async (booking: any) => {
    const workspaceId = currentWorkspace?.id || booking.workspaceId || booking.workspace_id;
    if (!workspaceId) {
        console.error('No workspace ID provided for booking');
        return;
    }
    
    setBookings(prev => [booking, ...prev]);

    const dbBooking = {
        id: booking.id || generateId('BK'),
        workspace_id: workspaceId,
        event_type_id: booking.eventType,
        title: booking.title,
        client_name: booking.client,
        client_email: booking.clientEmail,
        due_date: booking.dueDate,
        due_time: booking.dueTime,
        duration: booking.duration,
        status: booking.status,
        meet_url: booking.meetUrl,
        description: booking.description,
        owner_id: user?.uid || booking.owner_id || null
    };

    const { error } = await supabase.from('bookings').upsert([dbBooking]);
    if (error) {
        console.error('Error adding booking:', error);
        fetchAll();
    }
  };

  const deleteBooking = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if(error) fetchAll();
  };

  useEffect(() => {
    fetchAll();
    const sub1 = supabase.channel('et-all').on('postgres_changes', { event: '*', schema: 'public', table: 'event_types', filter: `workspace_id=eq.${currentWorkspace?.id}` }, () => fetchAll()).subscribe();
    const sub2 = supabase.channel('bk-all').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `workspace_id=eq.${currentWorkspace?.id}` }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
  }, [fetchAll, currentWorkspace?.id]);

  return { eventTypes, bookings, loading, addEventType, deleteEventType, addBooking, deleteBooking, refresh: fetchAll };
};
