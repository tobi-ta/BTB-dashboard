-- Two-way sync support: loop prevention column.
-- Dashboard writes set last_source='dashboard'. GHL webhook writes set last_source='ghl'.
-- The outbound Edge Function (lead-to-ghl) skips rows whose last_source='ghl'.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_source TEXT DEFAULT 'dashboard';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_leads_opportunity_id ON leads(opportunity_id);
