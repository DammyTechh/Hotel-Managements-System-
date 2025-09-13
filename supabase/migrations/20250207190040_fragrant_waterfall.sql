/*
  # Initial Schema for Miyaky Hotel Management System

  1. New Tables
    - `staff` - Hotel staff members (receptionists and managers)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text)
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `room_number` (text, unique)
      - `type` (text)
      - `rate` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
    
    - `guests`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `guest_id` (uuid, foreign key)
      - `check_in` (timestamp)
      - `check_out` (timestamp)
      - `total_amount` (numeric)
      - `status` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated staff members
*/

-- Staff table for hotel employees
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('receptionist', 'manager')),
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Rooms table
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  type text NOT NULL,
  rate numeric NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at timestamptz DEFAULT now()
);

-- Guests table
CREATE TABLE guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) NOT NULL,
  guest_id uuid REFERENCES guests(id) NOT NULL,
  check_in timestamptz NOT NULL,
  check_out timestamptz NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by uuid REFERENCES staff(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Staff Policies
CREATE POLICY "Staff can view their own profile"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Room Policies
CREATE POLICY "Staff can view all rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage rooms"
  ON rooms
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid()));

-- Guest Policies
CREATE POLICY "Staff can view all guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage guests"
  ON guests
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid()));

-- Booking Policies
CREATE POLICY "Staff can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid()));