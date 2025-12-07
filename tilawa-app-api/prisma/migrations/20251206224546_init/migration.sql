-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voiceProfile" JSONB NOT NULL,
    "noiseProfile" JSONB NOT NULL,
    "recommendedParams" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RecordingStatus" NOT NULL DEFAULT 'UPLOADED',
    "originalUrl" TEXT NOT NULL,
    "enhancedUrl" TEXT,
    "isQuran" BOOLEAN,
    "mainSurah" INTEGER,
    "ayahStart" INTEGER,
    "ayahEnd" INTEGER,
    "recitationAccuracy" DOUBLE PRECISION,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CalibrationProfile" ADD CONSTRAINT "CalibrationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
