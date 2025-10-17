import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EVENT_TYPE_CONFIG, CalendarEventType } from '@/types/calendar';
import { usePropertyData } from '@/hooks/usePropertyData';

interface CalendarEventFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export const CalendarEventFilters: React.FC<CalendarEventFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const { properties } = usePropertyData();

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtrer hendelser</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Nullstill filtre
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Event Type Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Hendelsestype</Label>
          <Select
            value={filters.event_type || ''}
            onValueChange={(value) => handleFilterChange('event_type', value || undefined)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Alle typer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle typer</SelectItem>
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Eiendom</Label>
          <Select
            value={filters.property_id || ''}
            onValueChange={(value) => handleFilterChange('property_id', value || undefined)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Alle eiendommer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle eiendommer</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}, {property.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Status</Label>
          <Select
            value={filters.is_completed === undefined ? '' : filters.is_completed.toString()}
            onValueChange={(value) => {
              if (value === '') {
                handleFilterChange('is_completed', undefined);
              } else {
                handleFilterChange('is_completed', value === 'true');
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Alle status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle status</SelectItem>
              <SelectItem value="false">Ikke fullført</SelectItem>
              <SelectItem value="true">Fullført</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Fra dato</Label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
            className="w-full h-8 px-3 py-1 text-sm border border-input rounded-md bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Til dato</Label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
            className="w-full h-8 px-3 py-1 text-sm border border-input rounded-md bg-background"
          />
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.date_from === new Date().toISOString().split('T')[0] ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            handleFilterChange('date_from', today);
            handleFilterChange('date_to', undefined);
          }}
          className="text-xs"
        >
          I dag
        </Button>
        <Button
          variant={filters.date_from === new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            handleFilterChange('date_from', nextWeek);
            handleFilterChange('date_to', undefined);
          }}
          className="text-xs"
        >
          Neste uke
        </Button>
        <Button
          variant={filters.date_from === new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            handleFilterChange('date_from', nextMonth);
            handleFilterChange('date_to', undefined);
          }}
          className="text-xs"
        >
          Neste måned
        </Button>
        <Button
          variant={filters.is_completed === false ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (filters.is_completed === false) {
              handleFilterChange('is_completed', undefined);
            } else {
              handleFilterChange('is_completed', false);
            }
          }}
          className="text-xs"
        >
          Ikke fullført
        </Button>
      </div>
    </div>
  );
};





