-- ============================================================
-- SALES TABLE SETUP
-- Run this SQL script to create the sales table if it doesn't exist
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(200) NOT NULL,
  service     VARCHAR(200) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  sale_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  type        VARCHAR(100),
  status      VARCHAR(100) DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON sales(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Verify table was created
SELECT 'Sales table created successfully' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales');