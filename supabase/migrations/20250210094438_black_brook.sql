/*
  # Fix Booking Policies

  1. Changes
    - Update booking policies to properly handle created_by foreign key
    - Ensure staff can only create bookings with their own ID
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can create bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can update bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can delete bookings" ON bookings;

-- Create comprehensive policies for booking management
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