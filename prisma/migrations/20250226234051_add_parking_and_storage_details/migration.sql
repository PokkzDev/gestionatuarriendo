-- AlterTable
ALTER TABLE `Property` ADD COLUMN `parkingDetails` JSON NULL,
    ADD COLUMN `storageDetails` JSON NULL,
    ADD COLUMN `storageUnits` INTEGER NOT NULL DEFAULT 0;
