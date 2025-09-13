/*
  # Add Food & Beverage Management

  1. New Tables
    - `menu_categories` - Categories for menu items (e.g., Breakfast, Lunch, Dinner, Drinks)
    - `menu_items` - Food and beverage items available for order
    - `orders` - Customer orders for F&B
    - `order_items` - Individual items in an order
    - `order_status_history` - Track order status changes

  2. Security
    - Enable RLS on all new tables
    - Add policies for staff access
*/

-- Menu Categories
CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Menu Items
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  preparation_time interval,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  table_number text,
  order_type text NOT NULL CHECK (order_type IN ('room_service', 'restaurant', 'bar')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes text,
  total_amount numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES staff(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Order Status History
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  status text NOT NULL,
  notes text,
  changed_by uuid REFERENCES staff(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Menu Categories Policies
CREATE POLICY "Staff can view menu categories"
  ON menu_categories
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can manage menu categories"
  ON menu_categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Menu Items Policies
CREATE POLICY "Staff can view menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Orders Policies
CREATE POLICY "Staff can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM staff WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Order Items Policies
CREATE POLICY "Staff can view order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Order Status History Policies
CREATE POLICY "Staff can view order status history"
  ON order_status_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can create order status history"
  ON order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM staff WHERE id = auth.uid()
    )
  );

-- Function to update order total amount
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_amount = (
    SELECT SUM(quantity * unit_price)
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order total when items change
CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track order status changes
CREATE TRIGGER track_order_status_change_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION track_order_status_change();