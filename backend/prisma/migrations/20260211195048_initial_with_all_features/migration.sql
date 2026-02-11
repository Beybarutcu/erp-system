/*
  Warnings:

  - The values [IN_PROGRESS,COMPLETED] on the enum `OutsourcingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `child_product_id` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `cycle_time_seconds` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `machine_type` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `operation_type` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `parent_product_id` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `sequence_order` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `setup_time_minutes` on the `bom_items` table. All the data in the column will be lost.
  - You are about to drop the column `current_quantity` on the `inventory_lots` table. All the data in the column will be lost.
  - You are about to drop the column `initial_quantity` on the `inventory_lots` table. All the data in the column will be lost.
  - You are about to drop the column `location_code` on the `inventory_lots` table. All the data in the column will be lost.
  - The `status` column on the `inventory_lots` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_by` on the `inventory_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_id` on the `inventory_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_type` on the `inventory_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_type` on the `inventory_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `actual_end_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `expected_end_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `total_cost` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `unit_cost` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `work_order_operations` table. All the data in the column will be lost.
  - You are about to drop the column `operation_sequence` on the `work_order_operations` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_completed` on the `work_order_operations` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `work_order_operations` table. All the data in the column will be lost.
  - You are about to drop the column `assigned_user_id` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `bom_item_id` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_outsourced` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `outsource_supplier_id` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the `bom_operation_translations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[parent_id,child_id,effective_date]` on the table `bom_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `child_id` to the `bom_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_id` to the `bom_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `inventory_lots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `after_quantity` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `before_quantity` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `process_type` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sent_quantity` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operation_type` to the `work_order_operations` table without a default value. This is not possible if the table is not empty.
  - Made the column `operator_id` on table `work_order_operations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InventoryLotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_PRODUCTION', 'QUARANTINE', 'USED', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "MoldStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'BROKEN', 'SCRAPPED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('PENDING', 'IN_PRODUCTION', 'SENT', 'APPROVED', 'REJECTED', 'REVISION', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "OutsourcingStatus_new" AS ENUM ('PENDING', 'SENT', 'IN_PROCESS', 'PARTIAL_RETURN', 'RETURNED', 'CANCELLED');
ALTER TABLE "outsourcing_jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "outsourcing_jobs" ALTER COLUMN "status" TYPE "OutsourcingStatus_new" USING ("status"::text::"OutsourcingStatus_new");
ALTER TYPE "OutsourcingStatus" RENAME TO "OutsourcingStatus_old";
ALTER TYPE "OutsourcingStatus_new" RENAME TO "OutsourcingStatus";
DROP TYPE "OutsourcingStatus_old";
ALTER TABLE "outsourcing_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'PACKAGING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'QUALITY_CONTROL';
ALTER TYPE "UserRole" ADD VALUE 'WAREHOUSE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkOrderStatus" ADD VALUE 'RELEASED';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'PARTIALLY_COMPLETED';

-- DropForeignKey
ALTER TABLE "bom_items" DROP CONSTRAINT "bom_items_child_product_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_items" DROP CONSTRAINT "bom_items_parent_product_id_fkey";

-- DropForeignKey
ALTER TABLE "bom_operation_translations" DROP CONSTRAINT "bom_operation_translations_bom_item_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_transactions" DROP CONSTRAINT "inventory_transactions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "outsourcing_jobs" DROP CONSTRAINT "outsourcing_jobs_work_order_id_fkey";

-- DropForeignKey
ALTER TABLE "work_order_operations" DROP CONSTRAINT "work_order_operations_operator_id_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_bom_item_id_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_outsource_supplier_id_fkey";

-- DropIndex
DROP INDEX "bom_items_child_product_id_idx";

-- DropIndex
DROP INDEX "bom_items_parent_product_id_level_idx";

-- DropIndex
DROP INDEX "bom_items_parent_product_id_sequence_order_key";

-- DropIndex
DROP INDEX "inventory_lots_product_id_received_date_status_idx";

-- DropIndex
DROP INDEX "work_orders_machine_id_status_idx";

-- AlterTable
ALTER TABLE "bom_items" DROP COLUMN "child_product_id",
DROP COLUMN "cycle_time_seconds",
DROP COLUMN "level",
DROP COLUMN "machine_type",
DROP COLUMN "operation_type",
DROP COLUMN "parent_product_id",
DROP COLUMN "sequence_order",
DROP COLUMN "setup_time_minutes",
ADD COLUMN     "child_id" TEXT NOT NULL,
ADD COLUMN     "effective_date" DATE,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'PCS',
ALTER COLUMN "scrap_rate" DROP NOT NULL,
ALTER COLUMN "scrap_rate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inventory_lots" DROP COLUMN "current_quantity",
DROP COLUMN "initial_quantity",
DROP COLUMN "location_code",
ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'TRY',
ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "mold_id" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchase_order_id" TEXT,
ADD COLUMN     "quality_status" TEXT,
ADD COLUMN     "quantity" DECIMAL(10,3) NOT NULL,
ALTER COLUMN "received_date" DROP DEFAULT,
ALTER COLUMN "received_date" SET DATA TYPE DATE,
DROP COLUMN "status",
ADD COLUMN     "status" "InventoryLotStatus" NOT NULL DEFAULT 'AVAILABLE',
ALTER COLUMN "expiry_date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "inventory_transactions" DROP COLUMN "created_by",
DROP COLUMN "reference_id",
DROP COLUMN "reference_type",
DROP COLUMN "transaction_type",
ADD COLUMN     "after_quantity" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "before_quantity" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "work_order_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "confirmation_status" TEXT;

-- AlterTable
ALTER TABLE "outsourcing_jobs" DROP COLUMN "actual_end_date",
DROP COLUMN "created_by",
DROP COLUMN "expected_end_date",
DROP COLUMN "quantity",
DROP COLUMN "start_date",
DROP COLUMN "total_cost",
DROP COLUMN "unit_cost",
ADD COLUMN     "actual_return_date" DATE,
ADD COLUMN     "cost" DECIMAL(10,2),
ADD COLUMN     "expected_return_date" DATE,
ADD COLUMN     "process_type" TEXT NOT NULL,
ADD COLUMN     "sent_date" DATE,
ADD COLUMN     "sent_quantity" DECIMAL(10,3) NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_stock_level" DECIMAL(10,3),
ADD COLUMN     "min_stock_level" DECIMAL(10,3),
ADD COLUMN     "mold_id" TEXT,
ADD COLUMN     "negative_stock_limit" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "workshop_id" TEXT;

-- AlterTable
ALTER TABLE "work_order_operations" DROP COLUMN "end_time",
DROP COLUMN "operation_sequence",
DROP COLUMN "quantity_completed",
DROP COLUMN "start_time",
ADD COLUMN     "operation_type" TEXT NOT NULL,
ADD COLUMN     "quantity" DECIMAL(10,3),
ALTER COLUMN "operator_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "work_orders" DROP COLUMN "assigned_user_id",
DROP COLUMN "bom_item_id",
DROP COLUMN "is_outsourced",
DROP COLUMN "outsource_supplier_id",
DROP COLUMN "updated_at",
ADD COLUMN     "allow_bom_changes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estimated_duration" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "partial_close_date" TIMESTAMP(3),
ADD COLUMN     "partial_close_reason" TEXT,
ADD COLUMN     "supplier_id" TEXT,
ADD COLUMN     "workshop_id" TEXT,
ALTER COLUMN "planned_start_date" SET DATA TYPE DATE,
ALTER COLUMN "planned_end_date" SET DATA TYPE DATE,
ALTER COLUMN "priority" SET DEFAULT 'NORMAL',
ALTER COLUMN "priority" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "bom_operation_translations";

-- DropEnum
DROP TYPE "LotStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_zones" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "warehouse_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "code" TEXT NOT NULL,
    "full_code" TEXT NOT NULL,
    "location_type" TEXT NOT NULL,
    "capacity" DECIMAL(10,3),
    "current_occupancy" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_transfers" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "from_location_id" TEXT,
    "to_location_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "location_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_allocations" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "allocated_qty" DECIMAL(10,3) NOT NULL,
    "consumed_qty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "allocation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_revisions" (
    "id" TEXT NOT NULL,
    "revision_number" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "revision_date" DATE NOT NULL,
    "system_quantity" DECIMAL(10,3) NOT NULL,
    "counted_quantity" DECIMAL(10,3) NOT NULL,
    "difference" DECIMAL(10,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "revised_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approval_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "molds" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cavity_count" INTEGER NOT NULL,
    "cycle_time_seconds" INTEGER,
    "ownership" TEXT NOT NULL,
    "status" "MoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "location_id" TEXT,
    "total_shots" INTEGER NOT NULL DEFAULT 0,
    "last_maintenance_date" DATE,
    "last_maintenance_shots" INTEGER,
    "next_maintenance_shots" INTEGER,
    "maintenance_interval_shots" INTEGER,
    "acquisition_date" DATE,
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "molds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mold_maintenance" (
    "id" TEXT NOT NULL,
    "mold_id" TEXT NOT NULL,
    "maintenance_date" DATE NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "shot_count_at_maintenance" INTEGER NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "performed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mold_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mold_usage" (
    "id" TEXT NOT NULL,
    "mold_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "shots_produced" INTEGER NOT NULL,
    "defect_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "mold_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_materials" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "planned_quantity" DECIMAL(10,3) NOT NULL,
    "issued_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "consumed_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'PCS',

    CONSTRAINT "work_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_measurements" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "measurement_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measured_by" TEXT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "parameters_json" JSONB NOT NULL,
    "overallResult" TEXT NOT NULL,
    "defect_count" INTEGER NOT NULL DEFAULT 0,
    "defect_types" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_inspections" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspected_by" TEXT NOT NULL,
    "total_quantity" DECIMAL(10,3) NOT NULL,
    "accepted_quantity" DECIMAL(10,3) NOT NULL,
    "rejected_quantity" DECIMAL(10,3) NOT NULL,
    "measurements_json" JSONB,
    "visual_inspection_pass" BOOLEAN NOT NULL,
    "functional_test_pass" BOOLEAN NOT NULL,
    "overallResult" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "final_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_defects" (
    "id" TEXT NOT NULL,
    "measurement_id" TEXT,
    "inspection_id" TEXT,
    "defect_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "photo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "weekly_hours" INTEGER NOT NULL,
    "skills" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_capacity" (
    "id" TEXT NOT NULL,
    "personnel_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "planned_hours" DECIMAL(5,2) NOT NULL,
    "actual_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "personnel_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_delivery_date" DATE,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "payment_terms" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,4),
    "received_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "received_date" DATE,
    "notes" TEXT,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_confirmations" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "confirmation_date" DATE NOT NULL,
    "confirmed_by" TEXT,
    "is_revised" BOOLEAN NOT NULL DEFAULT false,
    "revision_notes" TEXT,
    "status" TEXT NOT NULL,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_confirmations" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "quotation_sent_date" DATE,
    "quotation_number" TEXT,
    "customer_confirmation_date" DATE,
    "confirmed_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUOTATION',
    "document_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "previous_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,
    "reason" TEXT,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT,
    "request_date" DATE NOT NULL,
    "requested_quantity" DECIMAL(10,3) NOT NULL,
    "deadline" DATE,
    "technical_drawing" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_productions" (
    "id" TEXT NOT NULL,
    "sample_request_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "production_date" DATE NOT NULL,
    "produced_quantity" DECIMAL(10,3) NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "sample_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_approvals" (
    "id" TEXT NOT NULL,
    "sample_request_id" TEXT NOT NULL,
    "approval_date" DATE NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "customer_feedback" TEXT,
    "revision_notes" TEXT,
    "document_url" TEXT,

    CONSTRAINT "sample_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "recipients" TEXT[],
    "parameters" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "report_type" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'XLSX',
    "file_url" TEXT NOT NULL,
    "parameters" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshops_code_key" ON "workshops"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_zones_warehouse_id_code_key" ON "warehouse_zones"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_warehouse_id_full_code_key" ON "warehouse_locations"("warehouse_id", "full_code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_revisions_revision_number_key" ON "stock_revisions"("revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "molds_code_key" ON "molds"("code");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_code_key" ON "personnel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_capacity_personnel_id_year_week_number_key" ON "personnel_capacity"("personnel_id", "year", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_key" ON "purchase_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "sample_requests_request_number_key" ON "sample_requests"("request_number");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "bom_items_parent_id_child_id_effective_date_key" ON "bom_items"("parent_id", "child_id", "effective_date");

-- CreateIndex
CREATE INDEX "inventory_lots_product_id_received_date_idx" ON "inventory_lots"("product_id", "received_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_zones" ADD CONSTRAINT "warehouse_zones_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "warehouse_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_transfers" ADD CONSTRAINT "location_transfers_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_transfers" ADD CONSTRAINT "location_transfers_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_transfers" ADD CONSTRAINT "location_transfers_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_allocations" ADD CONSTRAINT "lot_allocations_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_allocations" ADD CONSTRAINT "lot_allocations_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_revisions" ADD CONSTRAINT "stock_revisions_revised_by_fkey" FOREIGN KEY ("revised_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_revisions" ADD CONSTRAINT "stock_revisions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "molds" ADD CONSTRAINT "molds_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mold_maintenance" ADD CONSTRAINT "mold_maintenance_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mold_usage" ADD CONSTRAINT "mold_usage_mold_id_fkey" FOREIGN KEY ("mold_id") REFERENCES "molds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mold_usage" ADD CONSTRAINT "mold_usage_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_measured_by_fkey" FOREIGN KEY ("measured_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_inspections" ADD CONSTRAINT "final_inspections_inspected_by_fkey" FOREIGN KEY ("inspected_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_defects" ADD CONSTRAINT "quality_defects_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "quality_measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_defects" ADD CONSTRAINT "quality_defects_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "final_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_capacity" ADD CONSTRAINT "personnel_capacity_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_confirmations" ADD CONSTRAINT "purchase_order_confirmations_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_confirmations" ADD CONSTRAINT "order_confirmations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_productions" ADD CONSTRAINT "sample_productions_sample_request_id_fkey" FOREIGN KEY ("sample_request_id") REFERENCES "sample_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_approvals" ADD CONSTRAINT "sample_approvals_sample_request_id_fkey" FOREIGN KEY ("sample_request_id") REFERENCES "sample_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "report_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
