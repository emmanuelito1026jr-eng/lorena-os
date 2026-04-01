-- ============================================
-- 003: Add 'cinc' and 'google' to leads source CHECK
-- Needed for CINC CSV import (source tracking)
-- ============================================

BEGIN;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('website', 'referral', 'zillow', 'cinc', 'google', 'social', 'open_house', 'cold_call', 'other', 'apollo', 'instantly', 'import'));

COMMIT;
