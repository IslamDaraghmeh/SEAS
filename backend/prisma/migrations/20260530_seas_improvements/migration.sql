-- SEAS System Improvements Migration
-- This migration adds new features for the SEAS system

-- ==================== AUDIT LOGGING ====================

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- ==================== CHAT SYSTEM ====================

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_attempt_id_idx" ON "chat_messages"("attempt_id");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_attempt_id_fkey"
    FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================== QUESTION BANK ====================

CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "description" TEXT,
    "course_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_banks_course_id_idx" ON "question_banks"("course_id");
CREATE INDEX "question_banks_created_by_idx" ON "question_banks"("created_by");

ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "question_bank_items" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_bank_items_bank_id_idx" ON "question_bank_items"("bank_id");
CREATE INDEX "question_bank_items_question_id_idx" ON "question_bank_items"("question_id");
CREATE UNIQUE INDEX "question_bank_items_bank_id_question_id_key" ON "question_bank_items"("bank_id", "question_id");

ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_bank_id_fkey"
    FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================== QUESTION TAGS ====================

CREATE TABLE "question_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "question_tags_name_key" ON "question_tags"("name");

CREATE TABLE "question_tag_maps" (
    "question_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "question_tag_maps_pkey" PRIMARY KEY ("question_id","tag_id")
);

CREATE INDEX "question_tag_maps_question_id_idx" ON "question_tag_maps"("question_id");
CREATE INDEX "question_tag_maps_tag_id_idx" ON "question_tag_maps"("tag_id");

ALTER TABLE "question_tag_maps" ADD CONSTRAINT "question_tag_maps_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_tag_maps" ADD CONSTRAINT "question_tag_maps_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "question_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================== EXAM UPDATES ====================

-- Add lockdown mode and question pool fields to exams
ALTER TABLE "exams" ADD COLUMN "lockdown_mode" TEXT NOT NULL DEFAULT 'warning';
ALTER TABLE "exams" ADD COLUMN "use_question_pool" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "exams" ADD COLUMN "pool_size" INTEGER;
ALTER TABLE "exams" ADD COLUMN "question_bank_id" TEXT;

-- ==================== EXAM ATTEMPT UPDATES ====================

-- Add tab switch tracking and metadata to attempts
ALTER TABLE "exam_attempts" ADD COLUMN "tab_switch_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "exam_attempts" ADD COLUMN "metadata" JSONB;

-- ==================== QUESTION UPDATES ====================

-- Make exam_id nullable to allow bank-only questions
ALTER TABLE "questions" ALTER COLUMN "exam_id" DROP NOT NULL;
