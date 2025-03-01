-- AlterTable
ALTER TABLE `User` ADD COLUMN `subscriptionExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `subscriptionType` VARCHAR(191) NULL;
