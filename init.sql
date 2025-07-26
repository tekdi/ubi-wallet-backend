-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    token TEXT,
    did VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    blocked BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255) DEFAULT '',
    updated_by VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wallet_vcs table
CREATE TABLE IF NOT EXISTS wallet_vcs (
    id SERIAL PRIMARY KEY,
    vc_public_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    watcher_registered BOOLEAN DEFAULT FALSE,
    watcher_email VARCHAR(500),
    watcher_callback_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT '',
    updated_by VARCHAR(255) DEFAULT ''
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallet_vcs_vc_public_id ON wallet_vcs(vc_public_id);
CREATE INDEX IF NOT EXISTS idx_wallet_vcs_provider ON wallet_vcs(provider);
CREATE INDEX IF NOT EXISTS idx_wallet_vcs_watcher_registered ON wallet_vcs(watcher_registered);
