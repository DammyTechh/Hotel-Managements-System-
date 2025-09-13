/*
  # Fix Staff RLS Policy

  1. Changes
    - Add policy to allow new staff registration
    - Maintain existing policies for data access

  2. Security
    - Enable new staff registration while maintaining security
    - Keep existing RLS policies intact
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Staff can view their own profile" ON staff;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON staff;

-- Create new policies
CREATE POLICY "Staff can view their own profile"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication users only"
  ON staff
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);