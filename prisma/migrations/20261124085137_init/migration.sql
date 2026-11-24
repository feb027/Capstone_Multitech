-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERORANGAN', 'MITRA');

-- CreateEnum
CREATE TYPE "IntakeType" AS ENUM ('MOBIL_UTUH', 'MODUL_SAJA');

-- CreateEnum
CREATE TYPE "EntryMethod" AS ENUM ('DATANG', 'EKSPEDISI');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DITERIMA', 'DIAGNOSA', 'MENUNGGU_PERSETUJUAN', 'MENUNGGU_SPAREPART', 'PERBAIKAN', 'UJI_QC', 'SIAP_DIAMBIL', 'SELESAI', 'BATAL');

-- CreateEnum
CREATE TYPE "LogKind" AS ENUM ('STATUS', 'NOTE', 'ESTIMATE');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('FOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "ChargeKind" AS ENUM ('JASA', 'SPAREPART', 'DIAGNOSA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TUNAI', 'TRANSFER', 'QRIS');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'PERORANGAN',
    "workshop_name" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "plate_number" TEXT,
    "vin" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_warranty_months" INTEGER DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "module_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "code" CHAR(4) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "intake_type" "IntakeType" NOT NULL DEFAULT 'MOBIL_UTUH',
    "entry_method" "EntryMethod" NOT NULL DEFAULT 'DATANG',
    "unit_category" TEXT NOT NULL DEFAULT 'OTOMOTIF',
    "tracking_number" TEXT,
    "condition_notes" TEXT,
    "priority_note" TEXT,
    "custom_photo_url" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_done_at" TIMESTAMP(3),
    "handed_over_at" TIMESTAMP(3),
    "is_warranty_claim" BOOLEAN NOT NULL DEFAULT false,
    "warranty_source_item_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "module_type_id" TEXT NOT NULL,
    "module_detail" TEXT,
    "complaint" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'DITERIMA',
    "warranty_months" INTEGER,
    "warranty_until" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "override_reason" TEXT,
    "finished_at" TIMESTAMP(3),
    "before_photo_url" TEXT,
    "after_photo_url" TEXT,
    "before_caption" TEXT,
    "after_caption" TEXT,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_logs" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "kind" "LogKind" NOT NULL DEFAULT 'STATUS',
    "from_status" "ItemStatus",
    "to_status" "ItemStatus",
    "note" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "log_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'FOTO',
    "size_bytes" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "item_id" TEXT,
    "kind" "ChargeKind" NOT NULL DEFAULT 'JASA',
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'TUNAI',
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_by" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "module_types_name_key" ON "module_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_public_id_key" ON "service_orders"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_code_key" ON "service_orders"("code");

-- CreateIndex
CREATE INDEX "service_orders_code_idx" ON "service_orders"("code");

-- CreateIndex
CREATE INDEX "service_orders_public_id_idx" ON "service_orders"("public_id");

-- CreateIndex
CREATE INDEX "service_items_status_idx" ON "service_items"("status");

-- CreateIndex
CREATE INDEX "service_items_order_id_idx" ON "service_items"("order_id");

-- CreateIndex
CREATE INDEX "progress_logs_item_id_created_at_idx" ON "progress_logs"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "charge_lines_order_id_idx" ON "charge_lines"("order_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_warranty_source_item_id_fkey" FOREIGN KEY ("warranty_source_item_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_module_type_id_fkey" FOREIGN KEY ("module_type_id") REFERENCES "module_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "progress_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_lines" ADD CONSTRAINT "charge_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_lines" ADD CONSTRAINT "charge_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
