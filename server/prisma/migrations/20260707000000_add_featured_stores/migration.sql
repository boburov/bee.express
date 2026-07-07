-- AlterTable
ALTER TABLE `Store` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `featuredRank` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Store_isFeatured_featuredRank_idx` ON `Store`(`isFeatured`, `featuredRank`);
