-- Add show_in_rental column to properties table
ALTER TABLE public.properties 
ADD COLUMN show_in_rental boolean DEFAULT true;