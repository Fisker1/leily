-- Update the Stavanger property coordinates to match the geocoding API results
UPDATE properties 
SET coordinates = ARRAY[5.763958, 58.967553]
WHERE id = '7be2075d-55c1-4c50-8011-c27a663c7e50' AND address = 'Lervigbrygga 116';