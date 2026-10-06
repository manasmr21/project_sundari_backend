-- Migration: Rename discount date columns to camelCase
ALTER TABLE "Discounts" RENAME COLUMN "start_date" TO "startDate";
ALTER TABLE "Discounts" RENAME COLUMN "end_date" TO "endDate";
