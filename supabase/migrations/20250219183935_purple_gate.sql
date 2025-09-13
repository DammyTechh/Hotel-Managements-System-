/*
  # Add billing features for orders and bookings

  1. Changes
    - Add payment_status to bookings table
    - Add billing_type to orders table
    - Add printer_endpoint to orders table
    - Add relationship between orders and bookings
    
  2. Notes
    - payment_status tracks if booking is prepaid
    - billing_type determines if order should be added to room bill
*/

-- Add payment_status to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
CHECK (payment_status IN ('paid', 'unpaid'));

-- Add billing_type and printer_endpoint to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'direct'
CHECK (billing_type IN ('room_bill', 'direct')),
ADD COLUMN IF NOT EXISTS printer_endpoint text;

-- Add function to update booking total when order is added to room bill
CREATE OR REPLACE FUNCTION update_booking_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.billing_type = 'room_bill' AND NEW.booking_id IS NOT NULL THEN
    UPDATE bookings
    SET total_amount = total_amount + NEW.total_amount
    WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating booking total
CREATE TRIGGER update_booking_total_on_order
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_booking_total();