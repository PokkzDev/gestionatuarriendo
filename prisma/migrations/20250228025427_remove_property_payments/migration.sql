/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_propertyId_fkey`;

-- DropTable
DROP TABLE `Payment`;

-- CreateTable
CREATE TABLE `SubscriptionPayment` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CLP',
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `paymentType` ENUM('SUBSCRIPTION', 'ONE_TIME') NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `merchantTransactionId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `billingName` VARCHAR(191) NULL,
    `billingEmail` VARCHAR(191) NULL,
    `billingAddress` VARCHAR(191) NULL,
    `billingDocument` VARCHAR(191) NULL,
    `subscriptionPeriodStart` DATETIME(3) NULL,
    `subscriptionPeriodEnd` DATETIME(3) NULL,
    `taxAmount` DECIMAL(10, 2) NULL,
    `taxPercentage` DECIMAL(5, 2) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPayment_merchantTransactionId_key`(`merchantTransactionId`),
    INDEX `SubscriptionPayment_userId_idx`(`userId`),
    INDEX `SubscriptionPayment_status_idx`(`status`),
    INDEX `SubscriptionPayment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubscriptionPayment` ADD CONSTRAINT `SubscriptionPayment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
