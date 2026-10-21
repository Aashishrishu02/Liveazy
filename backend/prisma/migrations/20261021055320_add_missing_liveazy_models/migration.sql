-- CreateEnum
CREATE TYPE "ContactEnquiryStatus" AS ENUM ('PENDING', 'CONTACTED', 'RESOLVED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "rent12M" DOUBLE PRECISION,
    "deposit12M" DOUBLE PRECISION,
    "rent6M" DOUBLE PRECISION,
    "deposit6M" DOUBLE PRECISION,
    "rent3M" DOUBLE PRECISION,
    "deposit3M" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "topLabel" TEXT NOT NULL DEFAULT 'NO INVESTMENT, JUST COMFORT',
    "heading" TEXT NOT NULL DEFAULT 'Furnish Your Home in Just 2 Days.',
    "subtitle" TEXT NOT NULL DEFAULT 'Delivery, Setup & Support — All Included. Starting at minimal rents across Pune & PCMC.',
    "button1Text" TEXT NOT NULL DEFAULT 'VIEW CATEGORIES',
    "button1Link" TEXT NOT NULL DEFAULT '#categories',
    "button2Text" TEXT NOT NULL DEFAULT 'CALL HOTLINE',
    "button2Link" TEXT NOT NULL DEFAULT 'tel:+919423838109',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "placement" TEXT NOT NULL DEFAULT 'HOMEPAGE_HERO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" SERIAL NOT NULL,
    "whatsappNumber" TEXT NOT NULL DEFAULT '919423838109',
    "whatsappMessage" TEXT NOT NULL DEFAULT 'Hi LIVEAZY! ',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoBanner" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "buttonLink" TEXT NOT NULL DEFAULT '#products',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placement" TEXT NOT NULL DEFAULT 'HOMEPAGE_PROMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPageSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pageTitle" TEXT NOT NULL DEFAULT 'We''re Here to Help',
    "pageDescription" TEXT NOT NULL DEFAULT 'Contact LIVEAZY for help with rental plans, product availability, delivery, and support.',
    "supportEmail" TEXT NOT NULL DEFAULT 'help@liveazy.in',
    "supportPhone" TEXT NOT NULL DEFAULT '919423838109',
    "serviceLocations" TEXT NOT NULL DEFAULT 'Pune & PCMC',
    "supportHours" TEXT NOT NULL DEFAULT 'Contact us for current support hours',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'GENERAL',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "foot" TEXT,
    "iconName" TEXT NOT NULL DEFAULT 'help-circle',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactEnquiryStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Faq_isActive_sortOrder_idx" ON "Faq"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_createdAt_idx" ON "ContactEnquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_email_idx" ON "ContactEnquiry"("email");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
