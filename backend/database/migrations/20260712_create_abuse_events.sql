CREATE TABLE IF NOT EXISTS abuse_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(40) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    identifier_hash CHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_abuse_action_ip_time (action, ip_address, created_at),
    INDEX idx_abuse_action_identifier_time (action, identifier_hash, created_at),
    INDEX idx_abuse_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
