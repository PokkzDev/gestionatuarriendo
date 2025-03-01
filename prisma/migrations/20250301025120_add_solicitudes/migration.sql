-- CreateTable
CREATE TABLE `Solicitud` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `type` ENUM('REPARACION', 'MANTENIMIENTO', 'CONSULTA', 'QUEJA', 'OTRO') NOT NULL,
    `priority` ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `propertyTenantId` VARCHAR(36) NOT NULL,

    INDEX `Solicitud_propertyTenantId_idx`(`propertyTenantId`),
    INDEX `Solicitud_status_idx`(`status`),
    INDEX `Solicitud_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SolicitudResponse` (
    `id` VARCHAR(36) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `solicitudId` VARCHAR(36) NOT NULL,
    `isFromOwner` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SolicitudResponse_solicitudId_idx`(`solicitudId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Solicitud` ADD CONSTRAINT `Solicitud_propertyTenantId_fkey` FOREIGN KEY (`propertyTenantId`) REFERENCES `PropertyTenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitudResponse` ADD CONSTRAINT `SolicitudResponse_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `Solicitud`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
