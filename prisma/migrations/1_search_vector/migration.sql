-- Add tsvector column for full-text search
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW."shortDescription", '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update on insert or update
DROP TRIGGER IF EXISTS trg_product_search_vector ON "Product";
CREATE TRIGGER trg_product_search_vector
  BEFORE INSERT OR UPDATE OF name, "shortDescription", description, sku, tags
  ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- Initialize search vector for existing products
UPDATE "Product" SET "searchVector" = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE("shortDescription", '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(sku, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
);
