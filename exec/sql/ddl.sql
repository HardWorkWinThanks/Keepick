-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema keepick
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema keepick
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `keepick` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `keepick` ;

-- -----------------------------------------------------
-- Table `keepick`.`member`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`member` (
  `created_at` DATETIME(6) NOT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `identification_url` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(255) NOT NULL,
  `profile_url` VARCHAR(500) NULL DEFAULT NULL,
  `provider` VARCHAR(255) NOT NULL,
  `provider_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UKmbmcqelty0fbrvxp1q58dn57t` (`email` ASC) VISIBLE,
  UNIQUE INDEX `nickname_UNIQUE` (`nickname` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 16
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`friendship`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`friendship` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `receiver_id` BIGINT NULL DEFAULT NULL,
  `sender_id` BIGINT NULL DEFAULT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `status` ENUM('ACCEPTED', 'PENDING', 'REJECTED') NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKhypmsg9f5tn2mycuyrogvuup9` (`receiver_id` ASC) VISIBLE,
  INDEX `FK4xor6bh6rd3e50txj56v5kg7h` (`sender_id` ASC) VISIBLE,
  CONSTRAINT `FK4xor6bh6rd3e50txj56v5kg7h`
    FOREIGN KEY (`sender_id`)
    REFERENCES `keepick`.`member` (`id`),
  CONSTRAINT `FKhypmsg9f5tn2mycuyrogvuup9`
    FOREIGN KEY (`receiver_id`)
    REFERENCES `keepick`.`member` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`group` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `creator_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `group_thumbnail_url` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `member_count` INT NULL DEFAULT '0',
  `updated_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FK1ps2ymeqii5dl42u73ic832mg` (`creator_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 49
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`group_member`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`group_member` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `group_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `member_id` BIGINT NULL DEFAULT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `status` ENUM('ACCEPTED', 'LEFT', 'PENDING', 'REJECTED') NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKq7wk4bcqhihj61ff5b2oub3r7` (`group_id` ASC) VISIBLE,
  INDEX `FKeamf7nngsg582uxwqgde8o28x` (`member_id` ASC) VISIBLE,
  CONSTRAINT `FKeamf7nngsg582uxwqgde8o28x`
    FOREIGN KEY (`member_id`)
    REFERENCES `keepick`.`member` (`id`),
  CONSTRAINT `FKq7wk4bcqhihj61ff5b2oub3r7`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 59
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`highlight_album`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`highlight_album` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `group_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `original_url` VARCHAR(255) NULL DEFAULT NULL,
  `thumbnail_url` VARCHAR(255) NULL DEFAULT NULL,
  `chat_session_id` VARCHAR(255) NULL DEFAULT NULL,
  `photo_count` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKl6r764kmw1cgsyy3xty0dcwg3` (`group_id` ASC) VISIBLE,
  CONSTRAINT `FK76cpvovmjw2jmi9tvmwtfi7dh`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`),
  CONSTRAINT `FKl6r764kmw1cgsyy3xty0dcwg3`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`highlight_album_photo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`highlight_album_photo` (
  `type` TINYINT NULL DEFAULT NULL,
  `album_id` BIGINT NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `member_id` BIGINT NULL DEFAULT NULL,
  `taken_at` DATETIME(6) NULL DEFAULT NULL,
  `chat_session_id` VARCHAR(255) NULL DEFAULT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `photo_url` VARCHAR(500) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FK76272p32ipv32w848iavbfe63` (`album_id` ASC) VISIBLE,
  INDEX `FKr0vfyywqg7cdq9uikuil4hy5k` (`member_id` ASC) VISIBLE,
  CONSTRAINT `FK76272p32ipv32w848iavbfe63`
    FOREIGN KEY (`album_id`)
    REFERENCES `keepick`.`highlight_album` (`id`),
  CONSTRAINT `FKr0vfyywqg7cdq9uikuil4hy5k`
    FOREIGN KEY (`member_id`)
    REFERENCES `keepick`.`member` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`photo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`photo` (
  `height` INT NULL DEFAULT NULL,
  `width` INT NULL DEFAULT NULL,
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `origin` VARCHAR(255) NULL DEFAULT NULL,
  `type` ENUM('ORIGINAL', 'THUMBNAIL') NULL DEFAULT NULL,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `original_url` VARCHAR(500) NULL DEFAULT NULL,
  `taken_at` DATETIME(6) NULL DEFAULT NULL,
  `thumbnail_url` VARCHAR(500) NULL DEFAULT NULL,
  `group_id` BIGINT NULL DEFAULT NULL,
  `status` ENUM('PENDING_UPLOAD', 'UPLOADED', 'THUMBNAIL_READY', 'FAILED') NOT NULL DEFAULT 'PENDING_UPLOAD',
  `cluster_id` BIGINT NULL DEFAULT NULL,
  `blurred` TINYINT(1) NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  INDEX `FK5yibg7cd8mwwj900io1gv4kaf` (`group_id` ASC) VISIBLE,
  CONSTRAINT `FK5yibg7cd8mwwj900io1gv4kaf`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 1159
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`photo_member`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`photo_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `member_id` BIGINT NULL DEFAULT NULL,
  `photo_id` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKq333ej183c2nf66590m3cfbe4` (`member_id` ASC) VISIBLE,
  INDEX `FKoq2vhs4lul3dvwdvpom3ylbfp` (`photo_id` ASC) VISIBLE,
  CONSTRAINT `FKoq2vhs4lul3dvwdvpom3ylbfp`
    FOREIGN KEY (`photo_id`)
    REFERENCES `keepick`.`photo` (`id`),
  CONSTRAINT `FKq333ej183c2nf66590m3cfbe4`
    FOREIGN KEY (`member_id`)
    REFERENCES `keepick`.`member` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 116
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`photo_tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`photo_tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `photo_id` BIGINT NULL DEFAULT NULL,
  `tag` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKb87vf7pn9a1d06sqflxtcx30b` (`photo_id` ASC) VISIBLE,
  CONSTRAINT `FKb87vf7pn9a1d06sqflxtcx30b`
    FOREIGN KEY (`photo_id`)
    REFERENCES `keepick`.`photo` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 638
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`tier_album`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`tier_album` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `group_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `original_url` VARCHAR(255) NULL DEFAULT NULL,
  `thumbnail_url` VARCHAR(255) NULL DEFAULT NULL,
  `photo_count` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKoj16xi59nypk6wqp0fvu9o1bf` (`group_id` ASC) VISIBLE,
  CONSTRAINT `FKoj16xi59nypk6wqp0fvu9o1bf`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 36
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`tier_album_photo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`tier_album_photo` (
  `album_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `photo_id` BIGINT NULL DEFAULT NULL,
  `level` ENUM('A', 'B', 'C', 'D', 'S') NULL DEFAULT NULL,
  `sequence` INT NULL DEFAULT NULL,
  `tier` ENUM('A', 'B', 'C', 'D', 'S') NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FK4htank5j1jlq8g5rat6ip5y59` (`album_id` ASC) VISIBLE,
  INDEX `FKfnqgdqhv76cnc6con93b0wire` (`photo_id` ASC) VISIBLE,
  CONSTRAINT `FK4htank5j1jlq8g5rat6ip5y59`
    FOREIGN KEY (`album_id`)
    REFERENCES `keepick`.`tier_album` (`id`),
  CONSTRAINT `FKfnqgdqhv76cnc6con93b0wire`
    FOREIGN KEY (`photo_id`)
    REFERENCES `keepick`.`photo` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 543
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`timeline_album`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`timeline_album` (
  `created_at` DATETIME(6) NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `group_id` BIGINT NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `updated_at` DATETIME(6) NULL DEFAULT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `original_url` VARCHAR(255) NULL DEFAULT NULL,
  `thumbnail_url` VARCHAR(255) NULL DEFAULT NULL,
  `end_date` DATE NULL DEFAULT NULL,
  `photo_count` INT NULL DEFAULT NULL,
  `start_date` DATE NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKgls3sfff5ijvkljjoqx1epat2` (`group_id` ASC) VISIBLE,
  CONSTRAINT `FKgls3sfff5ijvkljjoqx1epat2`
    FOREIGN KEY (`group_id`)
    REFERENCES `keepick`.`group` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 155
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`timeline_album_section`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`timeline_album_section` (
  `end_date` DATE NULL DEFAULT NULL,
  `sequence` INT NULL DEFAULT NULL,
  `start_date` DATE NULL DEFAULT NULL,
  `album_id` BIGINT NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKsxsfkvpadf75wv2fuwbho9ojk` (`album_id` ASC) VISIBLE,
  CONSTRAINT `FKsxsfkvpadf75wv2fuwbho9ojk`
    FOREIGN KEY (`album_id`)
    REFERENCES `keepick`.`timeline_album` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 318
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `keepick`.`timeline_album_photo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `keepick`.`timeline_album_photo` (
  `sequence` INT NULL DEFAULT NULL,
  `album_id` BIGINT NULL DEFAULT NULL,
  `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `photo_id` BIGINT NULL DEFAULT NULL,
  `section_id` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `FKlhqnjvv10915c5fgtol9avh1g` (`album_id` ASC) VISIBLE,
  INDEX `FKydww5qiu24u7t3i8y9x389mr` (`photo_id` ASC) VISIBLE,
  INDEX `FKdsknm16m7xg9ckq34qjd365rb` (`section_id` ASC) VISIBLE,
  CONSTRAINT `FKdsknm16m7xg9ckq34qjd365rb`
    FOREIGN KEY (`section_id`)
    REFERENCES `keepick`.`timeline_album_section` (`id`),
  CONSTRAINT `FKlhqnjvv10915c5fgtol9avh1g`
    FOREIGN KEY (`album_id`)
    REFERENCES `keepick`.`timeline_album` (`id`),
  CONSTRAINT `FKydww5qiu24u7t3i8y9x389mr`
    FOREIGN KEY (`photo_id`)
    REFERENCES `keepick`.`photo` (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 1136
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
