CREATE TABLE `users` (
  `id` serial PRIMARY KEY,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL COMMENT 'visitor, ehost, admin',
  `first_name` varchar(100),
  `last_name` varchar(100),
  `date_of_birth` date,
  `country` varchar(100),
  `language` varchar(100),
  `bio` text,
  `profile_image` varchar(255),
  `status` varchar(20) DEFAULT 'active' COMMENT 'active, suspended',
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `experiences` (
  `id` serial PRIMARY KEY,
  `ehost_id` integer,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100),
  `country` varchar(100),
  `location_name` varchar(255),
  `latitude` decimal(10,7),
  `longitude` decimal(10,7),
  `date_time` timestamp,
  `duration_minutes` integer,
  `max_visitors` integer,
  `price` decimal(10,2),
  `price_discounted` decimal(10,2),
  `cover_image` varchar(255),
  `sample_video_url` varchar(500),
  `status` varchar(20) DEFAULT 'pending',
  `rejection_reason` text,
  `gender_preference` varchar(20) DEFAULT 'any',
  `allows_piggyback` boolean DEFAULT false,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `bookings` (
  `id` serial PRIMARY KEY,
  `visitor_id` integer,
  `experience_id` integer,
  `booking_date` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `amount_paid` decimal(10,2),
  `booking_type` varchar(20) DEFAULT 'full',
  `qty_normal` integer DEFAULT 1,
  `qty_discounted` integer DEFAULT 0,
  `contact_name` varchar(200),
  `contact_email` varchar(255),
  `meeting_link` varchar(500),
  `reschedule_date` timestamp,
  `status` varchar(20) DEFAULT 'confirmed',
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `payments` (
  `id` serial PRIMARY KEY,
  `booking_id` integer,
  `visitor_id` integer,
  `amount` decimal(10,2),
  `method` varchar(20),
  `transaction_id` varchar(255),
  `status` varchar(20) DEFAULT 'completed',
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `refunds` (
  `id` serial PRIMARY KEY,
  `booking_id` integer,
  `payment_id` integer,
  `refund_amount` decimal(10,2),
  `refund_percentage` integer,
  `days_before_event` integer,
  `status` varchar(20) DEFAULT 'pending',
  `reason` text,
  `processed_at` timestamp
);

CREATE TABLE `user_agreements` (
  `id` serial PRIMARY KEY,
  `user_id` integer,
  `is_over_18` boolean NOT NULL,
  `accepted_terms` boolean NOT NULL,
  `accepted_behaviour` boolean NOT NULL,
  `accepted_recording` boolean NOT NULL,
  `payment_method_on_file` varchar(50),
  `accepted_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `reviews` (
  `id` serial PRIMARY KEY,
  `visitor_id` integer,
  `experience_id` integer,
  `rating` integer COMMENT '1-5',
  `comment` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `network_logs` (
  `id` serial PRIMARY KEY,
  `user_id` integer,
  `experience_id` integer,
  `connection_quality` varchar(20),
  `ip_address` varchar(45),
  `error_details` text,
  `logged_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `experience_scores` (
  `id` serial PRIMARY KEY,
  `experience_id` integer,
  `admin_id` integer,
  `wifi_score` integer,
  `safety_score` integer,
  `legal_score` integer,
  `content_score` integer,
  `accessibility_score` integer,
  `description_score` integer,
  `pricing_score` integer,
  `total_score` integer,
  `result` varchar(20),
  `comment` text,
  `scored_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

ALTER TABLE `experiences` ADD FOREIGN KEY (`ehost_id`) REFERENCES `users` (`id`);

ALTER TABLE `bookings` ADD FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`);

ALTER TABLE `bookings` ADD FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`);

ALTER TABLE `payments` ADD FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

ALTER TABLE `payments` ADD FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`);

ALTER TABLE `refunds` ADD FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

ALTER TABLE `refunds` ADD FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`);

ALTER TABLE `user_agreements` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`);

ALTER TABLE `network_logs` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `network_logs` ADD FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`);

ALTER TABLE `experience_scores` ADD FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`);

ALTER TABLE `experience_scores` ADD FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);
