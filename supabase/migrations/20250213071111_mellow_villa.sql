/*
  # Update Orders Schema
  
  This migration adds additional functionality to the existing orders system:
  
  1. Adds missing indexes for performance
  2. Updates existing policies for better security
  3. Adds additional constraints for data integrity
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_booking ON orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- Add additional constraints
ALTER TABLE orders 
  ADD CONSTRAINT check_table_or_booking 
  CHECK (
    (order_type = 'room_service' AND booking_id IS NOT NULL AND table_number IS NULL) OR
    ((order_type = 'restaurant' OR order_type = 'bar') AND table_number IS NOT NULL AND booking_id IS NULL)
  );

-- Add updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update policies for better security
DROP POLICY IF EXISTS "Staff can manage menu categories" ON menu_categories;
CREATE POLICY "Staff can manage menu categories"
  ON menu_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Staff can manage menu items" ON menu_items;
CREATE POLICY "Staff can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );

-- Add composite unique constraint to prevent duplicate order items
ALTER TABLE order_items
  ADD CONSTRAINT unique_order_menu_item 
  UNIQUE (order_id, menu_item_id);

-- Add cascade delete for order items when order is deleted
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
  ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE CASCADE;

-- Add cascade delete for order status history when order is deleted
ALTER TABLE order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_order_id_fkey,
  ADD CONSTRAINT order_status_history_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE CASCADE;