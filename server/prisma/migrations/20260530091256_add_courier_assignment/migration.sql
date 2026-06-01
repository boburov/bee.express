-- AlterTable
ALTER TABLE `Order` ADD COLUMN `courierAssignedAt` DATETIME(3) NULL,
    ADD COLUMN `courierEarning` DECIMAL(12, 2) NULL,
    ADD COLUMN `courierId` VARCHAR(191) NULL,
    ADD COLUMN `pickedUpAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COURIER_ASSIGNED', 'ON_WAY', 'DELIVERED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `OrderStatusHistory` MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COURIER_ASSIGNED', 'ON_WAY', 'DELIVERED', 'CANCELLED', 'REJECTED') NOT NULL;

-- CreateIndex
CREATE INDEX `Order_courierId_status_createdAt_idx` ON `Order`(`courierId`, `status`, `createdAt`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_courierId_fkey` FOREIGN KEY (`courierId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
