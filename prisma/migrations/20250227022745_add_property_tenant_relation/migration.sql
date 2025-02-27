-- CreateTable
CREATE TABLE `PropertyTenant` (
    `id` VARCHAR(36) NOT NULL,
    `propertyId` VARCHAR(36) NOT NULL,
    `tenantEmail` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PropertyTenant_propertyId_tenantEmail_key`(`propertyId`, `tenantEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PropertyTenant` ADD CONSTRAINT `PropertyTenant_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
