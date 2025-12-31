-- Add content fields to messages table
-- Adds image_content and voice_message_content fields for AI-analyzed content

ALTER TABLE `messages` 
ADD COLUMN `image_content` TEXT DEFAULT NULL COMMENT 'AI-analyzed image content' AFTER `voice_url`,
ADD COLUMN `voice_message_content` TEXT DEFAULT NULL COMMENT 'Transcribed voice message content' AFTER `image_content`;

