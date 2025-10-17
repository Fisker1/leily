import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarEvents } from './useCalendarEvents';
import { generateLeaseEvents, generateMaintenanceEvents, shouldCreateEvent } from '@/utils/calendarHelpers';
import { CreateCalendarEventData } from '@/types/calendar';

export const useAutoCalendarEvents = () => {
  const { user } = useAuth();
  const { createEvent, events: existingEvents } = useCalendarEvents();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<Date | null>(null);

  const generateEventsFromLeases = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Get all active lease agreements for the user
      const { data: leases, error: leasesError } = await supabase
        .from('lease_agreements')
        .select(`
          id,
          property_id,
          start_date,
          end_date,
          monthly_rent,
          property:properties(id, address, city)
        `)
        .eq('property_owner_id', user.id)
        .eq('status', 'active');

      if (leasesError) {
        console.error('Error fetching leases:', leasesError);
        return;
      }

      if (!leases || leases.length === 0) {
        console.log('No active leases found');
        return;
      }

      let eventsCreated = 0;

      // Generate events for each lease
      for (const lease of leases) {
        const leaseEvents = generateLeaseEvents({
          id: lease.id,
          property_id: lease.property_id,
          start_date: lease.start_date,
          end_date: lease.end_date,
          monthly_rent: lease.monthly_rent,
          property_address: lease.property?.address
        });

        // Create events that don't already exist
        for (const eventData of leaseEvents) {
          if (shouldCreateEvent(eventData, existingEvents)) {
            try {
              await createEvent(eventData);
              eventsCreated++;
            } catch (error) {
              console.error('Error creating event:', error);
            }
          }
        }
      }

      console.log(`Generated ${eventsCreated} new calendar events from leases`);
      setLastGeneration(new Date());
    } catch (error) {
      console.error('Error generating events from leases:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMaintenanceEventsForProperties = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Get all properties for the user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, address, city')
        .eq('owner_id', user.id);

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        return;
      }

      if (!properties || properties.length === 0) {
        console.log('No properties found');
        return;
      }

      let eventsCreated = 0;

      // Generate maintenance events for each property
      for (const property of properties) {
        const maintenanceEvents = generateMaintenanceEvents(
          property.id,
          `${property.address}, ${property.city}`
        );

        // Create events that don't already exist
        for (const eventData of maintenanceEvents) {
          if (shouldCreateEvent(eventData, existingEvents)) {
            try {
              await createEvent(eventData);
              eventsCreated++;
            } catch (error) {
              console.error('Error creating maintenance event:', error);
            }
          }
        }
      }

      console.log(`Generated ${eventsCreated} new maintenance events`);
    } catch (error) {
      console.error('Error generating maintenance events:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllAutoEvents = async () => {
    await Promise.all([
      generateEventsFromLeases(),
      generateMaintenanceEventsForProperties()
    ]);
  };

  // Auto-generate events when component mounts (only once per session)
  useEffect(() => {
    if (user && !lastGeneration) {
      generateAllAutoEvents();
    }
  }, [user, lastGeneration]);

  return {
    generateEventsFromLeases,
    generateMaintenanceEventsForProperties,
    generateAllAutoEvents,
    isGenerating,
    lastGeneration
  };
};





