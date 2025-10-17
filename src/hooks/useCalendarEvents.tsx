import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEvent, CreateCalendarEventData, UpdateCalendarEventData, CalendarEventFilters } from '@/types/calendar';

export const useCalendarEvents = (filters?: CalendarEventFilters) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_calendar_events')
        .select(`
          *,
          property:properties(id, address, city),
          lease:lease_agreements(id, monthly_rent, start_date, end_date)
        `)
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      // Apply filters
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }
      if (filters?.date_from) {
        query = query.gte('event_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('event_date', filters.date_to);
      }
      if (filters?.is_completed !== undefined) {
        query = query.eq('is_completed', filters.is_completed);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: CreateCalendarEventData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_calendar_events')
        .insert({
          ...eventData,
          user_id: user.id,
        })
        .select(`
          *,
          property:properties(id, address, city),
          lease:lease_agreements(id, monthly_rent, start_date, end_date)
        `)
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating calendar event:', err);
      throw err;
    }
  };

  const updateEvent = async (eventId: string, updates: UpdateCalendarEventData) => {
    try {
      const { data, error } = await supabase
        .from('user_calendar_events')
        .update(updates)
        .eq('id', eventId)
        .select(`
          *,
          property:properties(id, address, city),
          lease:lease_agreements(id, monthly_rent, start_date, end_date)
        `)
        .single();

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.id === eventId ? data : event
      ));
      return data;
    } catch (err) {
      console.error('Error updating calendar event:', err);
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('user_calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Error deleting calendar event:', err);
      throw err;
    }
  };

  const markAsCompleted = async (eventId: string) => {
    return updateEvent(eventId, { 
      is_completed: true, 
      completed_at: new Date().toISOString() 
    });
  };

  const markAsIncomplete = async (eventId: string) => {
    return updateEvent(eventId, { 
      is_completed: false, 
      completed_at: null 
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateString);
  };

  // Get upcoming events (next 30 days)
  const getUpcomingEvents = (days: number = 30) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today && eventDate <= futureDate && !event.is_completed;
    });
  };

  // Get overdue events
  const getOverdueEvents = () => {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate < today && !event.is_completed;
    });
  };

  useEffect(() => {
    fetchEvents();
  }, [user, filters]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    markAsCompleted,
    markAsIncomplete,
    getEventsForDate,
    getUpcomingEvents,
    getOverdueEvents,
    refetch: fetchEvents
  };
};





