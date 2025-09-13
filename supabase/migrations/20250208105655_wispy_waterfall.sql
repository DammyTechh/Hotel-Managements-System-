/*
  # Fix Guest Table RLS Policies

  1. Changes
    - Drop existing policies on guests table
    - Create new comprehensive policies for guest management
    - Enable authenticated staff to perform all operations on guests

  2. Security
    - Ensure authenticated users can manage guest data
    - Maintain data integrity with proper RLS policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view all guests" ON guests;
DROP POLICY IF EXISTS "Staff can manage guests" ON guests;

-- Create comprehensive policies for guest management
CREATE POLICY "Staff can view guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert guests"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update guests"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete guests"
  ON guests
  FOR DELETE
  TO authenticated
  USING (true);