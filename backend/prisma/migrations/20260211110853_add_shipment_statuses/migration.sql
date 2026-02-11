-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "delivered_date" DATE,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
