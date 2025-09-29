import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import demoProperty1 from '@/assets/demo-property-1.jpg';
import demoProperty3 from '@/assets/demo-property-3.jpg';
import lofoteApartment from '@/assets/lofoten-apartment.jpg';

interface PropertyImageProps {
  imageUrl?: string;
  address: string;
  city?: string;
  className?: string;
  alt?: string;
}

// Demo addresses that should show static images instead of satellite
const DEMO_ADDRESSES = {
  'Storgata 15': demoProperty1,
  'Havnegata 7': lofoteApartment,
  'Grünerløkka 8': demoProperty3,
};

const PropertyImage = ({ imageUrl, address, city, className = "", alt }: PropertyImageProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if this is a demo address
  const isDemoAddress = DEMO_ADDRESSES[address as keyof typeof DEMO_ADDRESSES];
  const shouldShowSatellite = user && !imageUrl && !isDemoAddress;

  useEffect(() => {
    if (shouldShowSatellite) {
      const fetchMapboxToken = async () => {
        try {
          console.log('🔑 Fetching Mapbox token for satellite image...');
          const { data, error } = await supabase.functions.invoke('get-mapbox-token');
          
          if (error || !data?.success || !data?.token) {
            console.error('❌ Token fetch failed:', error);
            setError('Kunne ikke hente Mapbox token');
            return;
          }

          console.log('✅ Token received for satellite image');
          setMapboxToken(data.token);
        } catch (error) {
          console.error('❌ Error fetching token:', error);
          setError('Kunne ikke hente Mapbox token');
        }
      };

      fetchMapboxToken();
    }
  }, [shouldShowSatellite, address]);

  useEffect(() => {
    if (!shouldShowSatellite || !mapContainer.current || !mapboxToken || map.current) return;

    const initializeMap = async () => {
      setLoading(true);
      setError(null);

      try {
        mapboxgl.accessToken = mapboxToken;
        
        // Get coordinates from database or geocode
        let lng: number, lat: number;
        
        console.log(`🔍 Looking for coordinates for ${address}, ${city || ''}`);
        
        // Try database first
        const { data: properties } = await supabase
          .from('properties')
          .select('coordinates')
          .ilike('address', `%${address}%`)
          .eq('city', city || '')
          .not('coordinates', 'is', null)
          .limit(1);
        
        if (properties?.[0]?.coordinates?.length === 2) {
          [lng, lat] = properties[0].coordinates;
          console.log(`✅ Using cached coordinates [${lng}, ${lat}]`);
        } else {
          // Geocode with Nominatim as fallback
          const fullAddress = `${address}${city ? ', ' + city : ''}, Norge`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=no`
          );
          const data = await response.json();
          
          if (data?.[0]) {
            lng = parseFloat(data[0].lon);
            lat = parseFloat(data[0].lat);
            console.log(`✅ Geocoded to [${lng}, ${lat}]`);
          } else {
            throw new Error('Adresse ikke funnet');
          }
        }
        
        // Create simple satellite map using OpenStreetMap style with satellite overlay
        if (!mapContainer.current) return;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [lng, lat],
          zoom: 17,
          interactive: false,
          attributionControl: false
        });

        // Add marker when map loads
        map.current.on('load', () => {
          if (map.current) {
            new mapboxgl.Marker({ 
              color: '#ef4444',
              scale: 0.8
            })
              .setLngLat([lng, lat])
              .addTo(map.current);
            
            console.log(`✅ Satellite image loaded for ${address}`);
            setLoading(false);
          }
        });

        map.current.on('error', (e) => {
          console.error('❌ Satellite map error:', e);
          setError('Satellittbilde ikke tilgjengelig');
          setLoading(false);
        });

      } catch (error: any) {
        console.error('❌ Satellite map init failed:', error);
        setError(error.message || 'Kunne ikke laste satellittbilde');
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [shouldShowSatellite, mapboxToken, address, city]);

  // Handle custom uploaded images
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={alt || `Eiendom på ${address}`}
        className={`object-cover aspect-square ${className}`}
      />
    );
  }

  // Handle demo addresses with actual property images
  if (isDemoAddress) {
    return (
      <img 
        src={isDemoAddress} 
        alt={alt || `Eiendom på ${address}`}
        className={`object-cover aspect-square ${className}`}
      />
    );
  }

  // Show satellite map only for logged in users with real addresses
  if (shouldShowSatellite) {
    return (
      <div className={`relative ${className} bg-muted aspect-square overflow-hidden rounded-lg`}>
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full" 
        />
        {loading && (
          <div className="absolute inset-0 bg-muted/80 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Laster satellittbilde...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-muted-foreground text-sm">📍 {error}</p>
              <p className="text-xs mt-1 opacity-75">{address}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for non-logged in users with real addresses
  return (
    <div className={`relative ${className} bg-muted flex items-center justify-center aspect-square rounded-lg`}>
      <p className="text-muted-foreground text-sm">Logg inn for satellittbilde</p>
    </div>
  );
};

export default PropertyImage;