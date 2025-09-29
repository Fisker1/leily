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
  const [showMap, setShowMap] = useState(false);
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
            return;
          }

          console.log('✅ Token received for satellite image');
          setMapboxToken(data.token);
        } catch (error) {
          console.error('❌ Error fetching token:', error);
        }
      };

      fetchMapboxToken();
      setShowMap(true);
    }
  }, [shouldShowSatellite, address]);

  useEffect(() => {
    if (!showMap || !mapContainer.current || !mapboxToken || map.current) return;

    const initializeMap = async () => {
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
          // Geocode with Nominatim
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
            throw new Error('Geocoding failed');
          }
        }
        
        // Create satellite map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'satellite': {
                type: 'raster',
                tiles: [`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`],
                tileSize: 512
              }
            },
            layers: [
              {
                id: 'satellite',
                type: 'raster',
                source: 'satellite'
              }
            ]
          },
          center: [lng, lat],
          zoom: 17,
          interactive: false,
          attributionControl: false
        });

        // Add marker
        map.current.on('load', () => {
          if (map.current) {
            new mapboxgl.Marker({ 
              color: '#ef4444',
              scale: 0.8
            })
              .setLngLat([lng, lat])
              .addTo(map.current);
            
            console.log(`✅ Satellite image loaded for ${address}`);
          }
        });

        map.current.on('error', (e) => {
          console.error('❌ Satellite map error:', e);
          if (mapContainer.current) {
            mapContainer.current.innerHTML = `
              <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
                <div class="text-center p-4">
                  <p>🗺️ Satellittbilde ikke tilgjengelig</p>
                  <p class="text-xs mt-1 opacity-75">${address}</p>
                </div>
              </div>
            `;
          }
        });

      } catch (error) {
        console.error('❌ Satellite map init failed:', error);
        if (mapContainer.current) {
          mapContainer.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
              <div class="text-center p-4">
                <p>📍 Adresse ikke funnet</p>
                <p class="text-xs mt-1 opacity-75">${address}</p>
              </div>
            </div>
          `;
        }
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap, mapboxToken, address, city]);

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
      </div>
    );
  }

  // Fallback for non-logged in users with real addresses
  return (
    <div className={`relative ${className} bg-muted flex items-center justify-center aspect-square`}>
      <p className="text-muted-foreground text-sm">Logg inn for satellittbilde</p>
    </div>
  );
};

export default PropertyImage;