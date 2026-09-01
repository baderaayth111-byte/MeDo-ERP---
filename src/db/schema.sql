-- ============================================================================
-- MeDo ERP - Database Schema & Search Performance Tuning Indexes
-- ============================================================================
-- Optimization for Rapid Inventory Search, Invoicing, and Accounting Lookups
-- Date: 2026-08-28

-- 1. Items Table Definition (SAP / Enterprise Standard)
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    item_code VARCHAR(64) NOT NULL UNIQUE,
    barcode VARCHAR(64),
    item_name VARCHAR(255) NOT NULL,
    item_name_en VARCHAR(255),
    category VARCHAR(100),
    unit VARCHAR(32) DEFAULT 'حبه',
    sale_price NUMERIC(15, 4) DEFAULT 0.0000,
    cost_price NUMERIC(15, 4) DEFAULT 0.0000,
    quantity NUMERIC(15, 4) DEFAULT 0.0000,
    min_stock_level NUMERIC(15, 4) DEFAULT 0.0000,
    warehouse_id VARCHAR(64) DEFAULT 'WH-01',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. HIGH-PERFORMANCE SEARCH INDEXES (Requested Performance Tuning)
-- ============================================================================

-- A. B-Tree Index on Item Code for exact and prefix lookups O(log N) -> O(1)
CREATE INDEX IF NOT EXISTS idx_item_code ON items (item_code);

-- B. B-Tree Index on Barcode for ultra-fast barcode scanner lookups
CREATE INDEX IF NOT EXISTS idx_item_barcode ON items (barcode) WHERE barcode IS NOT NULL;

-- C. Index on Item Name for exact matching and pattern lookups
CREATE INDEX IF NOT EXISTS idx_item_name ON items (item_name);

-- D. Index on English Item Name
CREATE INDEX IF NOT EXISTS idx_item_name_en ON items (item_name_en) WHERE item_name_en IS NOT NULL;

-- E. Index on Category for filtered catalog browsing
CREATE INDEX IF NOT EXISTS idx_item_category ON items (category);

-- F. Composite Index for multi-column search covering (Code, Barcode, Name, Price, Stock)
CREATE INDEX IF NOT EXISTS idx_item_search_composite ON items (item_code, barcode, item_name, is_active);

-- G. Trigram / GIN Text Search Indexes for Substring & Full-Text Search (PostgreSQL)
-- Enables sub-millisecond LIKE '%term%' searches without Full Table Scans
-- (Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON items USING gin (item_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_items_code_trgm ON items USING gin (item_code gin_trgm_ops);

-- ============================================================================
-- 3. Invoices & AR Line Items Table with Foreign Key Indexes
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) REFERENCES items(id),
    item_code VARCHAR(64) NOT NULL,
    barcode VARCHAR(64),
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    quantity NUMERIC(15, 4) NOT NULL DEFAULT 1.0000,
    unit_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tax_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0500,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    subtotal NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    total NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    account_code VARCHAR(32) DEFAULT '4111',
    account_name VARCHAR(128) DEFAULT 'إيرادات المبيعات',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_id ON invoice_items (item_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_code ON invoice_items (item_code);
