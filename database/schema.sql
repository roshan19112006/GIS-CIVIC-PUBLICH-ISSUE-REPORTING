-- GIS-Based Civic Issue Reporting Platform
-- Database Schema for MySQL / MariaDB
-- Database: gis_civic_platform

CREATE DATABASE IF NOT EXISTS `gis_civic_platform` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `gis_civic_platform`;

-- Disable foreign key checks during initialization
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departments Table
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT,
  `contact_email` VARCHAR(150),
  `contact_phone` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Wards Table (Jurisdiction Zones)
DROP TABLE IF EXISTS `wards`;
CREATE TABLE `wards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ward_number` VARCHAR(20) NOT NULL UNIQUE,
  `ward_name` VARCHAR(100) NOT NULL,
  `zone` VARCHAR(50) DEFAULT 'Central Zone',
  `councillor_name` VARCHAR(100),
  `contact_phone` VARCHAR(20),
  `center_latitude` DECIMAL(10, 8) DEFAULT 13.0827,
  `center_longitude` DECIMAL(11, 8) DEFAULT 80.2707,
  `boundary_geojson` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users Table (Citizens, Officers, Admins)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('citizen', 'officer', 'admin') NOT NULL DEFAULT 'citizen',
  `phone` VARCHAR(20),
  `department_id` INT NULL,
  `ward_id` INT NULL,
  `badge_number` VARCHAR(50) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `avatar_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Issue Categories Table
DROP TABLE IF EXISTS `issue_categories`;
CREATE TABLE `issue_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `default_department_id` INT NULL,
  `default_priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `sla_hours` INT DEFAULT 48,
  `icon` VARCHAR(50) DEFAULT 'AlertCircle',
  `color_code` VARCHAR(20) DEFAULT '#3B82F6',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`default_department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Civic Issues (Complaints) Table
DROP TABLE IF EXISTS `issues`;
CREATE TABLE `issues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` VARCHAR(30) NOT NULL UNIQUE,
  `citizen_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `department_id` INT NULL,
  `ward_id` INT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `location_type` ENUM('gps', 'map_click', 'manual') DEFAULT 'gps',
  `address` VARCHAR(350),
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `status` ENUM('pending', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened') DEFAULT 'pending',
  `deadline` DATETIME NULL,
  `estimated_cost` DECIMAL(10, 2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`citizen_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `issue_categories`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE SET NULL,
  INDEX `idx_issue_status` (`status`),
  INDEX `idx_issue_priority` (`priority`),
  INDEX `idx_issue_coords` (`latitude`, `longitude`),
  INDEX `idx_issue_ticket` (`ticket_id`),
  INDEX `idx_issue_citizen` (`citizen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Issue Images Table
DROP TABLE IF EXISTS `issue_images`;
CREATE TABLE `issue_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL,
  `image_url` VARCHAR(300) NOT NULL,
  `image_type` ENUM('complaint', 'resolution', 'referral', 'other') DEFAULT 'complaint',
  `uploaded_by` INT NOT NULL,
  `caption` VARCHAR(255) NULL,
  `file_size` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_issue_img_issue` (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Work Orders Table
DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL,
  `officer_id` INT NOT NULL,
  `assigned_by` INT NOT NULL,
  `department_id` INT NOT NULL,
  `status` ENUM('assigned', 'accepted', 'in_progress', 'completed', 'referred') DEFAULT 'assigned',
  `instructions` TEXT,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`officer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  INDEX `idx_work_order_officer` (`officer_id`),
  INDEX `idx_work_order_issue` (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Issue Status History Table
DROP TABLE IF EXISTS `issue_status_history`;
CREATE TABLE `issue_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL,
  `changed_by` INT NOT NULL,
  `previous_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_status_hist_issue` (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Resolutions Table
DROP TABLE IF EXISTS `resolutions`;
CREATE TABLE `resolutions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL UNIQUE,
  `work_order_id` INT NULL,
  `resolved_by` INT NOT NULL,
  `resolution_notes` TEXT NOT NULL,
  `completion_photo_url` VARCHAR(300) NULL,
  `resolved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Citizen Feedback Table
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `issue_id` INT NOT NULL UNIQUE,
  `citizen_id` INT NOT NULL,
  `is_satisfied` BOOLEAN NOT NULL DEFAULT TRUE,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comments` TEXT,
  `reopen_requested` BOOLEAN DEFAULT FALSE,
  `reopen_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`citizen_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Notifications Table
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `issue_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'status_update', 'assignment', 'resolution', 'warning') DEFAULT 'info',
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE SET NULL,
  INDEX `idx_notif_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Audit Logs Table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
