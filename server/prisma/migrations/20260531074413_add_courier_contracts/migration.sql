-- CreateTable
CREATE TABLE `CourierApplication` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `transportType` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `documentUrls` JSON NOT NULL,
    `rejectionReason` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourierApplication_userId_key`(`userId`),
    INDEX `CourierApplication_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourierContract` (
    `id` VARCHAR(191) NOT NULL,
    `courierId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `isTemporary` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NULL,
    `message` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourierContract_storeId_status_idx`(`storeId`, `status`),
    INDEX `CourierContract_courierId_status_idx`(`courierId`, `status`),
    UNIQUE INDEX `CourierContract_courierId_storeId_key`(`courierId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CourierApplication` ADD CONSTRAINT `CourierApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourierContract` ADD CONSTRAINT `CourierContract_courierId_fkey` FOREIGN KEY (`courierId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourierContract` ADD CONSTRAINT `CourierContract_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
