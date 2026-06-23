/*
  Warnings:

  - Added the required column `category` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `category` ENUM('MOVIE', 'CONCERT', 'SPORT', 'WORKSHOP', 'COMEDY', 'FESTIVAL') NOT NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `mediaRef` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
