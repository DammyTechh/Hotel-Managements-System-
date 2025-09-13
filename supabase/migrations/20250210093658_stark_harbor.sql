/*
  # Fix Staff Policies

  1. Changes
    - Add policy to allow staff creation during registration
    - Ensure staff record can be created with auth.uid()
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view their own profile" ON staff;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON staff;

-- Create new policies
CREATE POLICY "Staff can view their own profile"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON staff
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can update their own profile"
  ON staff
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);