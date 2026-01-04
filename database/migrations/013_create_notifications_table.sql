-- Create notifications table
-- This table stores notification records sent to users

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` text NOT NULL COMMENT 'system_notification, announcement',
  `title` text NOT NULL,
  `subtitle` text NOT NULL,
  `metadata` varchar(9999) NOT NULL COMMENT 'json verisi',
  `sentTime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`(255)),
  KEY `idx_sent_time` (`sentTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

