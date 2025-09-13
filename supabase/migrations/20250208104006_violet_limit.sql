/*
  # Fix Rooms RLS Policy

  1. Changes
    - Update policies for room management
    - Enable proper CRUD operations for authenticated staff

  2. Security
    - Allow authenticated staff to manage rooms
    - Maintain data integrity and access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can manage rooms" ON rooms;

-- Create comprehensive policies for room management
CREATE POLICY "Staff can view rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete rooms"
  ON rooms
  FOR DELETE
  TO authenticated
  USING (true);