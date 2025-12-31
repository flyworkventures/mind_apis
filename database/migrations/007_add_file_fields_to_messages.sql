-- Add file fields to messages table
-- Adds isFile and fileURL fields for file message support

ALTER TABLE `messages` 
ADD COLUMN `is_file` BOOLEAN DEFAULT FALSE COMMENT 'Whether message is a file' AFTER `message`,
ADD COLUMN `file_url` VARCHAR(500) DEFAULT NULL COMMENT 'File URL if message is a file' AFTER `is_file`;

-- Add index for file queries
CREATE INDEX `idx_is_file` ON `messages` (`is_file`);

