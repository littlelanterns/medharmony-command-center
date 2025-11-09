-- Migration 016b: Add requires_confirmation field to orders
--
-- Adds a boolean flag to indicate when orders need parental/guardian confirmation
-- before scheduling (e.g., surgeries, major procedures)

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false;

COMMENT ON COLUMN orders.requires_confirmation IS 'Indicates if this order requires explicit confirmation before scheduling (e.g., surgeries, major procedures)';

-- Set requires_confirmation = true for existing surgeries and major procedures
UPDATE orders
SET requires_confirmation = true
WHERE order_type = 'procedure'
  AND (
    title ILIKE '%surgery%'
    OR title ILIKE '%surgical%'
    OR estimated_revenue > 5000
  );

SELECT 'Added requires_confirmation field to orders table. Major procedures flagged for confirmation.' as message;
