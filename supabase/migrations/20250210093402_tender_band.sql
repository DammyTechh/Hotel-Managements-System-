/*
  # Fix Booking Policies

  1. Changes
    - Add more granular booking policies
    - Allow staff to create bookings with their user ID
    - Fix RLS for booking management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can manage bookings" ON bookings;

-- Create comprehensive policies for booking management
CREATE POLICY "Staff can view bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Staff can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);