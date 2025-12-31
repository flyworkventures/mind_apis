-- Add 3d_url field to consultants table
-- Adds 3D model URL for consultants

ALTER TABLE `consultants` 
ADD COLUMN `3d_url` VARCHAR(500) DEFAULT NULL COMMENT '3D model URL for the consultant' AFTER `photo_url`;

