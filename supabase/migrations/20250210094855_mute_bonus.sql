/*
  # Fix Staff and Booking Policies

  1. Changes
    - Update staff policies to handle registration properly
    - Ensure proper RLS for staff operations
    - Fix booking policies to work with staff records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view their own profile" ON staff;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON staff;
DROP POLICY IF EXISTS "Staff can update their own profile" ON staff;

-- Create comprehensive staff policies
CREATE POLICY "Staff can view their own profile"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable staff registration"
  ON staff
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can update their own profile"
  ON staff
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (id = auth.uid());

-- Drop existing booking policies
DROP POLICY IF EXISTS "Staff can view bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can create bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can update bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can delete bookings" ON bookings;

-- Create updated booking policies
CREATE POLICY "Staff can view bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM staff WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));