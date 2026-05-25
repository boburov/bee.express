-- AlterTable
ALTER TABLE `Category` ADD COLUMN `deliveryBaseFee` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryEtaMaxMinutes` INTEGER NULL,
    ADD COLUMN `deliveryEtaMinMinutes` INTEGER NULL,
    ADD COLUMN `deliveryPerKmFee` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryRadiusKm` INTEGER NULL,
    ADD COLUMN `minOrderAmount` DECIMAL(12, 2) NULL,
    ADD COLUMN `type` ENUM('FOOD', 'MARKETPLACE') NOT NULL DEFAULT 'MARKETPLACE';

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `ratingAvg` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `ratingCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Store` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `deliveryBaseFee` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryEtaMinutes` INTEGER NULL,
    ADD COLUMN `deliveryPerKmFee` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryRadiusKm` INTEGER NULL,
    ADD COLUMN `isOpen` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `minOrderAmount` DECIMAL(12, 2) NULL,
    ADD COLUMN `openingHours` JSON NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UploadedFile` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `purpose` ENUM('PRODUCT_IMAGE', 'STORE_LOGO', 'STORE_BANNER', 'USER_AVATAR', 'REVIEW_IMAGE', 'OTHER') NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readyAt` DATETIME(3) NULL,

    UNIQUE INDEX `UploadedFile_key_key`(`key`),
    INDEX `UploadedFile_uploaderId_idx`(`uploaderId`),
    INDEX `UploadedFile_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `UploadedFile_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `text` TEXT NULL,
    `imageUrls` JSON NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Review_productId_isVisible_createdAt_idx`(`productId`, `isVisible`, `createdAt`),
    INDEX `Review_storeId_isVisible_idx`(`storeId`, `isVisible`),
    INDEX `Review_userId_idx`(`userId`),
    UNIQUE INDEX `Review_productId_userId_orderId_key`(`productId`, `userId`, `orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductRequest` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('NEW', 'NOTIFIED', 'FULFILLED', 'DISMISSED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notifiedAt` DATETIME(3) NULL,
    `fulfilledAt` DATETIME(3) NULL,

    INDEX `ProductRequest_productId_status_idx`(`productId`, `status`),
    INDEX `ProductRequest_storeId_status_idx`(`storeId`, `status`),
    INDEX `ProductRequest_userId_idx`(`userId`),
    UNIQUE INDEX `ProductRequest_productId_userId_storeId_key`(`productId`, `userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Category_type_isActive_idx` ON `Category`(`type`, `isActive`);

-- CreateIndex
CREATE INDEX `Store_latitude_longitude_idx` ON `Store`(`latitude`, `longitude`);

-- CreateIndex
CREATE INDEX `Store_status_isOpen_idx` ON `Store`(`status`, `isOpen`);

-- AddForeignKey
ALTER TABLE `UploadedFile` ADD CONSTRAINT `UploadedFile_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRequest` ADD CONSTRAINT `ProductRequest_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRequest` ADD CONSTRAINT `ProductRequest_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRequest` ADD CONSTRAINT `ProductRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
