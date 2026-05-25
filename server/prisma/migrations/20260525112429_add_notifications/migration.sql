-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `senderType` ENUM('SUPER_ADMIN', 'USER', 'SYSTEM') NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'DANGER', 'ANNOUNCE') NOT NULL DEFAULT 'INFO',
    `data` JSON NULL,
    `delivered` BOOLEAN NOT NULL DEFAULT false,
    `telegramSent` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `groupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_recipientId_readAt_idx`(`recipientId`, `readAt`),
    INDEX `Notification_recipientId_createdAt_idx`(`recipientId`, `createdAt`),
    INDEX `Notification_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
