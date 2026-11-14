-- Migration: 20261114_add_is_partner_to_workspaces.sql
-- Add is_partner flag to corporate_workspaces for approved partner organizations

ALTER TABLE public.corporate_workspaces 
ADD COLUMN IF NOT EXISTS is_partner BOOLEAN NOT NULL DEFAULT false;

-- Create index for public stats query performance
CREATE INDEX IF NOT EXISTS idx_corporate_workspaces_is_partner 
ON public.corporate_workspaces(is_partner) 
WHERE is_partner = true;
