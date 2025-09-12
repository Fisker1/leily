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

  console.log('PropertyImage debug:', {
    address,
    user: !!user,
    imageUrl: !!imageUrl,
    isDemoAddress: !!isDemoAddress,
    shouldShowSatellite
  });

  useEffect(() => {
    // Only fetch Mapbox token if we need to show satellite for logged in users
    if (shouldShowSatellite) {
      const fetchMapboxToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-mapbox-token');
          
          if (error) {
            console.error('Error fetching Mapbox token:', error);
            return;
          }

          if (data?.token) {
            setMapboxToken(data.token);
          }
        } catch (error) {
          console.error('Error fetching Mapbox token:', error);
        }
      };

      fetchMapboxToken();
      setShowMap(true);
    }
  }, [shouldShowSatellite]);

  useEffect(() => {
    if (!showMap || !mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Geocode the address to get coordinates
    const fullAddress = `${address}, ${city || ''}`;
    
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&country=NO&limit=1`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Geocoding failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          try {
            map.current = new mapboxgl.Map({
              container: mapContainer.current!,
              style: 'mapbox://styles/mapbox/satellite-v9',
              center: [lng, lat],
              zoom: 16,
              attributionControl: false
            });

            map.current.on('error', (e) => {
              console.error('Mapbox GL error:', e);
            });
          } catch (error) {
            console.error('Error creating Mapbox GL map:', error);
          }

          // Add a marker at the property location
          new mapboxgl.Marker({ color: '#ff0000' })
            .setLngLat([lng, lat])
            .addTo(map.current);

           // Disable all interactions for a static look
           map.current.dragPan.disable();
           map.current.scrollZoom.disable();
           map.current.boxZoom.disable();
           map.current.dragRotate.disable();
           map.current.keyboard.disable();
           map.current.doubleClickZoom.disable();
           map.current.touchZoomRotate.disable();
        }
      })
      .catch(error => {
        console.error('Error geocoding address:', error);
      });

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
        className={`object-cover ${className}`}
      />
    );
  }

  // Handle demo addresses with actual property images
  if (isDemoAddress) {
    return (
      <img 
        src={isDemoAddress} 
        alt={alt || `Eiendom på ${address}`}
        className={`object-cover ${className}`}
      />
    );
  }

  // Show satellite map only for logged in users with real addresses
  if (shouldShowSatellite) {
    return (
      <div className={`relative ${className}`}>
        <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      </div>
    );
  }

  // Fallback for non-logged in users with real addresses
  return (
    <div className={`relative ${className} bg-muted flex items-center justify-center`}>
      <p className="text-muted-foreground text-sm">Logg inn for satellittbilde</p>
    </div>
  );
};

export default PropertyImage;