/*
  Warnings:

  - You are about to drop the column `actual_return_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `expected_return_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `scrap_quantity` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `sent_date` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `sent_quantity` on the `outsourcing_jobs` table. All the data in the column will be lost.
  - The `status` column on the `outsourcing_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[job_number]` on the table `outsourcing_jobs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expected_end_date` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_number` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `outsourcing_jobs` table without a default value. This is not possible if the table is not empty.
  - Made the column `unit_cost` on table `outsourcing_jobs` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OutsourcingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "outsourcing_jobs" DROP CONSTRAINT "outsourcing_jobs_work_order_id_fkey";

-- AlterTable
ALTER TABLE "outsourcing_jobs" DROP COLUMN "actual_return_date",
DROP COLUMN "expected_return_date",
DROP COLUMN "scrap_quantity",
DROP COLUMN "sent_date",
DROP COLUMN "sent_quantity",
ADD COLUMN     "actual_end_date" DATE,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "expected_end_date" DATE NOT NULL,
ADD COLUMN     "job_number" TEXT NOT NULL,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "quantity" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "start_date" DATE NOT NULL,
ADD COLUMN     "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "work_order_id" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OutsourcingStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "unit_cost" SET NOT NULL,
ALTER COLUMN "unit_cost" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "outsourcing_jobs_job_number_key" ON "outsourcing_jobs"("job_number");

-- AddForeignKey
ALTER TABLE "outsourcing_jobs" ADD CONSTRAINT "outsourcing_jobs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outsourcing_jobs" ADD CONSTRAINT "outsourcing_jobs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
