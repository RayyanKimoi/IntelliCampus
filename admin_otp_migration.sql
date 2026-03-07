-- CreateTable
CREATE TABLE "admin_otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_otp_email_idx" ON "admin_otp"("email");

-- CreateIndex
CREATE INDEX "admin_otp_expires_at_idx" ON "admin_otp"("expires_at");
