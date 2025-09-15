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
      const fetchMapboxToken = async (retryCount = 0) => {
        try {
          console.log(`🔑 Fetching Mapbox token for satellite image... (attempt ${retryCount + 1})`);
          const { data, error } = await supabase.functions.invoke('get-mapbox-token');
          
          if (error) {
            console.error('❌ Token fetch error:', error);
            
            // Retry up to 3 times with exponential backoff for cold start
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
              console.log(`⏳ Retrying in ${delay}ms... (cold start recovery)`);
              setTimeout(() => fetchMapboxToken(retryCount + 1), delay);
              return;
            }
            return;
          }

          if (data?.token) {
            console.log('✅ Mapbox token received for satellite image');
            setMapboxToken(data.token);
          } else {
            console.error('❌ No token received from server');
            // Retry for no token response too
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000;
              setTimeout(() => fetchMapboxToken(retryCount + 1), delay);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching Mapbox token:', error);
          
          // Retry on network/other errors
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⏳ Retrying in ${delay}ms... (error recovery)`);
            setTimeout(() => fetchMapboxToken(retryCount + 1), delay);
          }
        }
      };

      fetchMapboxToken();
      setShowMap(true);
    }
  }, [shouldShowSatellite, address]);

  useEffect(() => {
    if (!showMap || !mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Use coordinates from database if available, otherwise geocode
    const initializeMap = async () => {
      let lng: number, lat: number;
      
      try {
        // First try to get coordinates from properties table if this address exists there
        console.log(`🔍 Looking for cached coordinates for ${address}, ${city || ''}`);
        
        const { data: properties } = await supabase
          .from('properties')
          .select('coordinates')
          .ilike('address', `%${address}%`)
          .eq('city', city || '')
          .not('coordinates', 'is', null)
          .limit(1);
        
        if (properties && properties[0]?.coordinates && Array.isArray(properties[0].coordinates) && properties[0].coordinates.length === 2) {
          [lng, lat] = properties[0].coordinates;
          console.log(`✅ Using cached coordinates [${lng}, ${lat}] for ${address}`);
        } else {
          // Fallback to geocoding
          console.log(`🌍 No cached coordinates, geocoding: ${address}, ${city || ''}`);
          
          const { data, error } = await supabase.functions.invoke('geocode-address', {
            body: {
              address: address,
              city: city,
              country: 'NO'
            }
          });

          if (error || !data?.coordinates || !data.success) {
            console.error('❌ Geocoding failed:', error);
            // Show informative fallback
            if (mapContainer.current) {
              mapContainer.current.innerHTML = `
                <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
                  <div class="text-center p-4">
                    <p>📍 Satellittbilde ikke tilgjengelig</p>
                    <p class="text-xs mt-1 opacity-75">${address}</p>
                  </div>
                </div>
              `;
            }
            return;
          }

          [lng, lat] = data.coordinates;
          console.log(`✅ Successfully geocoded to [${lng}, ${lat}]`);
          
          // Cache the coordinates for future use by updating any matching property
          try {
            await supabase
              .from('properties')
              .update({ coordinates: [lng, lat] })
              .ilike('address', `%${address}%`)
              .eq('city', city || '')
              .is('coordinates', null);
            console.log(`💾 Cached coordinates for ${address}`);
          } catch (cacheError) {
            console.warn('⚠️ Could not cache coordinates:', cacheError);
          }
        }
        
        // Create the map with coordinates
        if (!mapContainer.current) return;
        
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [lng, lat],
            zoom: 17,
            bearing: 0,
            pitch: 0,
            attributionControl: false,
            logoPosition: 'bottom-right',
            interactive: false // Disable all interactions from the start
          });

          // Add marker and disable interactions when map loads
          map.current.on('load', () => {
            if (map.current) {
              // Add a red marker at the property location
              new mapboxgl.Marker({ 
                color: '#ef4444',
                scale: 0.8
              })
                .setLngLat([lng, lat])
                .addTo(map.current);
              
              console.log(`✅ Satellite map loaded for ${address}`);
            }
          });

          map.current.on('error', (e) => {
            console.error('❌ Mapbox GL error:', e);
            // Show error message if map fails to load
            if (mapContainer.current) {
              mapContainer.current.innerHTML = `
                <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
                  <div class="text-center p-4">
                    <p>🗺️ Kart kunne ikke lastes</p>
                    <p class="text-xs mt-1 opacity-75">${address}</p>
                  </div>
                </div>
              `;
            }
          });

        } catch (mapError) {
          console.error('❌ Error creating Mapbox GL map:', mapError);
          if (mapContainer.current) {
            mapContainer.current.innerHTML = `
              <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
                <div class="text-center p-4">
                  <p>⚠️ Kunne ikke initialisere kart</p>
                  <p class="text-xs mt-1 opacity-75">${address}</p>
                </div>
              </div>
            `;
          }
        }
      } catch (generalError) {
        console.error('❌ General error in map initialization:', generalError);
        if (mapContainer.current) {
          mapContainer.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
              <div class="text-center p-4">
                <p>🔄 Laster kart...</p>
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