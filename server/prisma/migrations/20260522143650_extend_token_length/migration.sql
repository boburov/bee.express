-- AlterTable
ALTER TABLE `Session` MODIFY `token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `SuperAdminSession` MODIFY `token` VARCHAR(512) NOT NULL;
