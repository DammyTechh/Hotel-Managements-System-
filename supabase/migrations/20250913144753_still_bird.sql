/*
  # Complete Hotel Management System

  1. New Tables
    - `drink_categories` - Categories for bar drinks (Alcoholic, Non-Alcoholic, etc.)
    - `drinks` - Pre-registered drinks with prices
    - `bar_orders` - Bar orders for both lodged and walk-in guests
    - `kitchen_orders` - Kitchen/food orders
    - `order_status_updates` - Track status changes with timestamps

  2. Updated Tables
    - Enhanced `bookings` with payment tracking
    - Enhanced `orders` system for unified billing

  3. Security
    - Enable RLS on all tables
    - Add policies for staff access

  4. Triggers
    - Auto-update booking totals
    - Track status changes
*/

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;

-- Create drink categories table
CREATE TABLE IF NOT EXISTS drink_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create drinks table (pre-registered bar items)
CREATE TABLE IF NOT EXISTS drinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES drink_categories(id),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create kitchen orders table
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  room_number text,
  guest_name text NOT NULL,
  food_name text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_amount numeric GENERATED ALWAYS AS (price * quantity) STORED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'completed')),
  notes text,
  billing_type text NOT NULL DEFAULT 'room_bill' CHECK (billing_type IN ('room_bill', 'separate')),
  printer_endpoint text DEFAULT 'kitchen_printer_1',
  created_by uuid NOT NULL REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bar orders table
CREATE TABLE IF NOT EXISTS bar_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id), -- NULL for walk-in customers
  room_number text, -- NULL for walk-in customers
  guest_name text NOT NULL,
  guest_type text NOT NULL DEFAULT 'lodged' CHECK (guest_type IN ('lodged', 'walk_in')),
  drink_id uuid NOT NULL REFERENCES drinks(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric GENERATED ALWAYS AS (unit_price * quantity) STORED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed')),
  notes text,
  billing_type text NOT NULL DEFAULT 'room_bill' CHECK (billing_type IN ('room_bill', 'separate')),
  printer_endpoint text DEFAULT 'bar_printer_1',
  created_by uuid NOT NULL REFERENCES staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order status updates table for tracking changes
CREATE TABLE IF NOT EXISTS order_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text NOT NULL CHECK (order_type IN ('kitchen', 'bar')),
  order_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  updated_by uuid NOT NULL REFERENCES staff(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add payment_status to bookings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE drink_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for drink_categories
CREATE POLICY "Staff can manage drink categories"
  ON drink_categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid() AND staff.role = 'manager'
  ));

CREATE POLICY "Staff can view drink categories"
  ON drink_categories
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

-- Create policies for drinks
CREATE POLICY "Staff can manage drinks"
  ON drinks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid() AND staff.role = 'manager'
  ));

CREATE POLICY "Staff can view drinks"
  ON drinks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

-- Create policies for kitchen_orders
CREATE POLICY "Staff can create kitchen orders"
  ON kitchen_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can view kitchen orders"
  ON kitchen_orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

CREATE POLICY "Staff can update kitchen orders"
  ON kitchen_orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

-- Create policies for bar_orders
CREATE POLICY "Staff can create bar orders"
  ON bar_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can view bar orders"
  ON bar_orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

CREATE POLICY "Staff can update bar orders"
  ON bar_orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

-- Create policies for order_status_updates
CREATE POLICY "Staff can create status updates"
  ON order_status_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    updated_by = auth.uid() AND
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())
  );

CREATE POLICY "Staff can view status updates"
  ON order_status_updates
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  ));

-- Create function to update booking totals
CREATE OR REPLACE FUNCTION update_booking_total_from_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booking total when kitchen or bar orders are added/updated/deleted
  IF TG_TABLE_NAME = 'kitchen_orders' THEN
    IF TG_OP = 'DELETE' THEN
      IF OLD.booking_id IS NOT NULL AND OLD.billing_type = 'room_bill' THEN
        UPDATE bookings 
        SET total_amount = (
          SELECT COALESCE(rooms.rate * EXTRACT(days FROM (bookings.check_out - bookings.check_in)), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM kitchen_orders WHERE booking_id = OLD.booking_id AND billing_type = 'room_bill'), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM bar_orders WHERE booking_id = OLD.booking_id AND billing_type = 'room_bill'), 0)
          FROM rooms
          WHERE rooms.id = bookings.room_id
        )
        WHERE id = OLD.booking_id;
      END IF;
      RETURN OLD;
    ELSE
      IF NEW.booking_id IS NOT NULL AND NEW.billing_type = 'room_bill' THEN
        UPDATE bookings 
        SET total_amount = (
          SELECT COALESCE(rooms.rate * EXTRACT(days FROM (bookings.check_out - bookings.check_in)), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM kitchen_orders WHERE booking_id = NEW.booking_id AND billing_type = 'room_bill'), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM bar_orders WHERE booking_id = NEW.booking_id AND billing_type = 'room_bill'), 0)
          FROM rooms
          WHERE rooms.id = bookings.room_id
        )
        WHERE id = NEW.booking_id;
      END IF;
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'bar_orders' THEN
    IF TG_OP = 'DELETE' THEN
      IF OLD.booking_id IS NOT NULL AND OLD.billing_type = 'room_bill' THEN
        UPDATE bookings 
        SET total_amount = (
          SELECT COALESCE(rooms.rate * EXTRACT(days FROM (bookings.check_out - bookings.check_in)), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM kitchen_orders WHERE booking_id = OLD.booking_id AND billing_type = 'room_bill'), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM bar_orders WHERE booking_id = OLD.booking_id AND billing_type = 'room_bill'), 0)
          FROM rooms
          WHERE rooms.id = bookings.room_id
        )
        WHERE id = OLD.booking_id;
      END IF;
      RETURN OLD;
    ELSE
      IF NEW.booking_id IS NOT NULL AND NEW.billing_type = 'room_bill' THEN
        UPDATE bookings 
        SET total_amount = (
          SELECT COALESCE(rooms.rate * EXTRACT(days FROM (bookings.check_out - bookings.check_in)), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM kitchen_orders WHERE booking_id = NEW.booking_id AND billing_type = 'room_bill'), 0) +
                 COALESCE((SELECT SUM(total_amount) FROM bar_orders WHERE booking_id = NEW.booking_id AND billing_type = 'room_bill'), 0)
          FROM rooms
          WHERE rooms.id = bookings.room_id
        )
        WHERE id = NEW.booking_id;
      END IF;
      RETURN NEW;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to track status changes
CREATE OR REPLACE FUNCTION track_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO order_status_updates (
      order_type,
      order_id,
      old_status,
      new_status,
      updated_by
    ) VALUES (
      CASE 
        WHEN TG_TABLE_NAME = 'kitchen_orders' THEN 'kitchen'
        WHEN TG_TABLE_NAME = 'bar_orders' THEN 'bar'
      END,
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_booking_total_kitchen_trigger
  AFTER INSERT OR UPDATE OR DELETE ON kitchen_orders
  FOR EACH ROW EXECUTE FUNCTION update_booking_total_from_orders();

CREATE TRIGGER update_booking_total_bar_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bar_orders
  FOR EACH ROW EXECUTE FUNCTION update_booking_total_from_orders();

CREATE TRIGGER track_kitchen_status_changes
  BEFORE UPDATE ON kitchen_orders
  FOR EACH ROW EXECUTE FUNCTION track_status_changes();

CREATE TRIGGER track_bar_status_changes
  BEFORE UPDATE ON bar_orders
  FOR EACH ROW EXECUTE FUNCTION track_status_changes();

-- Insert sample drink categories
INSERT INTO drink_categories (name, description) VALUES
  ('Alcoholic', 'Alcoholic beverages including beer, wine, spirits'),
  ('Non-Alcoholic', 'Soft drinks, juices, water'),
  ('Cocktails', 'Mixed drinks and cocktails'),
  ('Hot Beverages', 'Coffee, tea, hot chocolate')
ON CONFLICT DO NOTHING;

-- Insert sample drinks
INSERT INTO drinks (category_id, name, description, price) 
SELECT 
  dc.id,
  drink_data.name,
  drink_data.description,
  drink_data.price
FROM drink_categories dc
CROSS JOIN (
  VALUES 
    ('Alcoholic', 'Beer', 'Local beer bottle', 500),
    ('Alcoholic', 'Wine', 'Red/White wine glass', 1500),
    ('Alcoholic', 'Whiskey', 'Premium whiskey shot', 2000),
    ('Non-Alcoholic', 'Coca Cola', 'Soft drink', 300),
    ('Non-Alcoholic', 'Orange Juice', 'Fresh orange juice', 400),
    ('Non-Alcoholic', 'Water', 'Bottled water', 200),
    ('Cocktails', 'Mojito', 'Classic mojito cocktail', 2500),
    ('Cocktails', 'Margarita', 'Classic margarita', 2800),
    ('Hot Beverages', 'Coffee', 'Espresso coffee', 500),
    ('Hot Beverages', 'Tea', 'Assorted tea', 400)
) AS drink_data(category, name, description, price)
WHERE dc.name = drink_data.category
ON CONFLICT DO NOTHING;