
-- Step 1: Add new role values to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'md';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hod';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
