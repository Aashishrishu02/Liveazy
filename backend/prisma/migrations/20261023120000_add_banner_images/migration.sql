CREATE TABLE "BannerImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "bannerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BannerImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BannerImage_bannerId_sortOrder_idx"
ON "BannerImage"("bannerId", "sortOrder");

ALTER TABLE "BannerImage"
ADD CONSTRAINT "BannerImage_bannerId_fkey"
FOREIGN KEY ("bannerId") REFERENCES "Banner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
