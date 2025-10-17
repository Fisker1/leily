import { addYears, addMonths, format, parseISO } from 'date-fns';
import { CalendarEventType, CreateCalendarEventData } from '@/types/calendar';

/**
 * Calculate index regulation date based on lease start date
 * In Norway, rent can be increased annually based on consumer price index
 */
export const calculateIndexRegulationDate = (leaseStartDate: string): string => {
  const startDate = parseISO(leaseStartDate);
  // Index regulation is typically done annually on the lease anniversary
  return format(addYears(startDate, 1), 'yyyy-MM-dd');
};

/**
 * Calculate next index regulation date from a previous regulation date
 */
export const calculateNextIndexRegulationDate = (lastRegulationDate: string): string => {
  const lastDate = parseISO(lastRegulationDate);
  return format(addYears(lastDate, 1), 'yyyy-MM-dd');
};

/**
 * Generate automatic calendar events from lease agreement data
 */
export const generateLeaseEvents = (leaseData: {
  id: string;
  property_id: string;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  property_address?: string;
}): CreateCalendarEventData[] => {
  const events: CreateCalendarEventData[] = [];

  // Lease start event
  events.push({
    event_type: 'lease_start',
    title: `Leieavtale starter - ${leaseData.property_address || 'Eiendom'}`,
    description: `Leieavtale starter med månedlig husleie på ${leaseData.monthly_rent.toLocaleString('no-NO')} kr`,
    event_date: leaseData.start_date,
    property_id: leaseData.property_id,
    lease_id: leaseData.id,
    reminder_days: [7, 3, 1]
  });

  // Move-in event (same as lease start)
  events.push({
    event_type: 'move_in',
    title: `Innflytting - ${leaseData.property_address || 'Eiendom'}`,
    description: 'Leietaker flytter inn',
    event_date: leaseData.start_date,
    property_id: leaseData.property_id,
    lease_id: leaseData.id,
    reminder_days: [7, 3, 1]
  });

  // Index regulation event (1 year after lease start)
  const indexRegulationDate = calculateIndexRegulationDate(leaseData.start_date);
  events.push({
    event_type: 'index_regulation',
    title: `Indeksregulering - ${leaseData.property_address || 'Eiendom'}`,
    description: 'Årlig indeksregulering av husleie',
    event_date: indexRegulationDate,
    property_id: leaseData.property_id,
    lease_id: leaseData.id,
    is_recurring: true,
    recurring_pattern: 'yearly',
    reminder_days: [30, 14, 7, 3]
  });

  // Lease end event (if end date exists)
  if (leaseData.end_date) {
    events.push({
      event_type: 'lease_end',
      title: `Leieavtale slutter - ${leaseData.property_address || 'Eiendom'}`,
      description: 'Leieavtale utløper',
      event_date: leaseData.end_date,
      property_id: leaseData.property_id,
      lease_id: leaseData.id,
      reminder_days: [30, 14, 7, 3, 1]
    });

    // Move-out event (same as lease end)
    events.push({
      event_type: 'move_out',
      title: `Utflytting - ${leaseData.property_address || 'Eiendom'}`,
      description: 'Leietaker flytter ut',
      event_date: leaseData.end_date,
      property_id: leaseData.property_id,
      lease_id: leaseData.id,
      reminder_days: [30, 14, 7, 3, 1]
    });

    // Deposit release event (typically 1 month after move-out)
    const depositReleaseDate = format(addMonths(parseISO(leaseData.end_date), 1), 'yyyy-MM-dd');
    events.push({
      event_type: 'deposit_release',
      title: `Depositum utbetaling - ${leaseData.property_address || 'Eiendom'}`,
      description: 'Depositum kan utbetales til leietaker',
      event_date: depositReleaseDate,
      property_id: leaseData.property_id,
      lease_id: leaseData.id,
      reminder_days: [14, 7, 3]
    });
  }

  return events;
};

/**
 * Generate recurring index regulation events for multiple years
 */
export const generateRecurringIndexRegulationEvents = (
  leaseStartDate: string,
  years: number = 5
): CreateCalendarEventData[] => {
  const events: CreateCalendarEventData[] = [];
  
  for (let i = 1; i <= years; i++) {
    const regulationDate = format(addYears(parseISO(leaseStartDate), i), 'yyyy-MM-dd');
    events.push({
      event_type: 'index_regulation',
      title: `Indeksregulering ${new Date(regulationDate).getFullYear()}`,
      description: 'Årlig indeksregulering av husleie',
      event_date: regulationDate,
      is_recurring: true,
      recurring_pattern: 'yearly',
      reminder_days: [30, 14, 7, 3]
    });
  }
  
  return events;
};

/**
 * Generate maintenance events for a property
 */
export const generateMaintenanceEvents = (
  propertyId: string,
  propertyAddress: string,
  startDate: string = new Date().toISOString().split('T')[0]
): CreateCalendarEventData[] => {
  const events: CreateCalendarEventData[] = [];
  const start = parseISO(startDate);

  // Annual property inspection
  events.push({
    event_type: 'maintenance',
    title: `Årlig inspeksjon - ${propertyAddress}`,
    description: 'Årlig inspeksjon av eiendom',
    event_date: format(addYears(start, 1), 'yyyy-MM-dd'),
    property_id: propertyId,
    is_recurring: true,
    recurring_pattern: 'yearly',
    reminder_days: [30, 14, 7, 3]
  });

  // Smoke detector check (annually)
  events.push({
    event_type: 'maintenance',
    title: `Røykvarsler sjekk - ${propertyAddress}`,
    description: 'Årlig sjekk av røykvarslere',
    event_date: format(addYears(start, 1), 'yyyy-MM-dd'),
    property_id: propertyId,
    is_recurring: true,
    recurring_pattern: 'yearly',
    reminder_days: [30, 14, 7]
  });

  return events;
};

/**
 * Generate insurance renewal events
 */
export const generateInsuranceEvents = (
  propertyId: string,
  propertyAddress: string,
  renewalDate: string
): CreateCalendarEventData[] => {
  return [{
    event_type: 'insurance_renewal',
    title: `Forsikring fornyelse - ${propertyAddress}`,
    description: 'Årlig fornyelse av eiendomsforsikring',
    event_date: renewalDate,
    property_id: propertyId,
    is_recurring: true,
    recurring_pattern: 'yearly',
    reminder_days: [60, 30, 14, 7]
  }];
};

/**
 * Check if an event should be created based on existing events
 */
export const shouldCreateEvent = (
  newEvent: CreateCalendarEventData,
  existingEvents: any[]
): boolean => {
  return !existingEvents.some(existing => 
    existing.event_type === newEvent.event_type &&
    existing.event_date === newEvent.event_date &&
    existing.property_id === newEvent.property_id &&
    existing.lease_id === newEvent.lease_id
  );
};

/**
 * Get event type priority for sorting
 */
export const getEventTypePriority = (eventType: CalendarEventType): number => {
  const priorities = {
    'lease_start': 1,
    'lease_end': 1,
    'move_in': 2,
    'move_out': 2,
    'index_regulation': 3,
    'rent_increase': 3,
    'deposit_release': 4,
    'inspection': 5,
    'maintenance': 6,
    'insurance_renewal': 7,
    'tax_deadline': 8,
    'custom': 9
  };
  
  return priorities[eventType] || 10;
};





