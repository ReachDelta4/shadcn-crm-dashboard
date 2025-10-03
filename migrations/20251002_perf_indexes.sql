-- Critical performance indexes for list views and searches
-- Safe to run multiple times; use IF NOT EXISTS where supported

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_owner_date ON invoices(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_status ON invoices(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_invoice_number ON invoices(owner_id, invoice_number);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_owner_date ON leads(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON leads(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_name ON leads(owner_id, full_name);
CREATE INDEX IF NOT EXISTS idx_leads_owner_email ON leads(owner_id, email);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_owner_date ON orders(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_orders_owner_status ON orders(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_owner_number ON orders(owner_id, order_number);

-- Enable pg_trgm if available and add trigram indexes for fuzzy search (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number_trgm ON invoices USING gin (invoice_number gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_leads_full_name_trgm ON leads USING gin (full_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_leads_company_trgm ON leads USING gin (company gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_orders_order_number_trgm ON orders USING gin (order_number gin_trgm_ops);
