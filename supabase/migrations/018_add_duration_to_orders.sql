-- Migration 018: Add Duration to Orders
--
-- Adds duration_minutes field to orders table for AI-estimated appointment lengths

-- Add duration_minutes column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

COMMENT ON COLUMN orders.duration_minutes IS 'Estimated appointment duration in minutes (AI-suggested, provider-editable)';

-- Update existing orders with realistic durations based on order type
UPDATE orders
SET duration_minutes = CASE
  WHEN order_type = 'lab' THEN 30
  WHEN order_type = 'imaging' THEN 45
  WHEN order_type = 'procedure' AND title ILIKE '%surgery%' THEN 240 -- 4 hours for surgeries
  WHEN order_type = 'procedure' AND title ILIKE '%ear tube%' THEN 60 -- 1 hour for minor procedures
  WHEN order_type = 'procedure' THEN 90 -- 1.5 hours for general procedures
  WHEN order_type = 'follow-up' THEN 30
  WHEN order_type = 'consultation' THEN 30
  WHEN order_type = 'therapy' THEN 60 -- Speech/physical therapy typically 1 hour
  ELSE 30
END;

SELECT 'Added duration_minutes field to orders. Existing orders updated with realistic durations.' as message;
