-- Add voice message fields to messages table
-- Adds isVoiceMessage and voiceURL fields for voice message support

ALTER TABLE `messages` 
ADD COLUMN `is_voice_message` BOOLEAN DEFAULT FALSE COMMENT 'Whether message is a voice message' AFTER `file_url`,
ADD COLUMN `voice_url` VARCHAR(500) DEFAULT NULL COMMENT 'Voice message URL if message is a voice message' AFTER `is_voice_message`;

-- Add index for voice message queries
CREATE INDEX `idx_is_voice_message` ON `messages` (`is_voice_message`);
