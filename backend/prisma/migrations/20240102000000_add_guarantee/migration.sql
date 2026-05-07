-- Add guarantee field to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "guarantee" TEXT;

-- Add guarantee field to InvoiceItem
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "guarantee" TEXT;
