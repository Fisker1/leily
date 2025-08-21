import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface PropertyImageProps {
  imageUrl?: string;
  address: string;
  city?: string;
  className?: string;
  alt?: string;
}

const PropertyImage = ({ imageUrl, address, city, className = "", alt }: PropertyImageProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showMap, setShowMap] = useState(!imageUrl);

  useEffect(() => {
    // Fetch Mapbox token for all real addresses (including demo addresses now)
    if (!imageUrl) {
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
  }, [imageUrl]);

  useEffect(() => {
    if (!showMap || !mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Geocode the address to get coordinates
    const fullAddress = `${address}, ${city || ''}`;
    
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&country=NO&limit=1`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [lng, lat],
            zoom: 16,
            attributionControl: false
          });

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
        onError={() => {
          // If custom image fails, try to show map
          setShowMap(true);
        }}
      />
    );
  }

  // Show satellite map for all addresses (including demo addresses)
  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
        Satellittbilde
      </div>
    </div>
  );
};

export default PropertyImage;