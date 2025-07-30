-- =====================================================
-- Fresh Database Schema for UBI Wallet Backend
-- This script creates all tables with the latest schemas
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    account_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(255),
    did VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    blocked BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_token ON users(token);

-- Comments for users table
COMMENT ON TABLE users IS 'Stores user account information and authentication data';
COMMENT ON COLUMN users.id IS 'Unique UUID identifier for the user';
COMMENT ON COLUMN users.account_id IS 'Unique account identifier';
COMMENT ON COLUMN users.username IS 'Unique username for login';
COMMENT ON COLUMN users.password IS 'Hashed password';
COMMENT ON COLUMN users.token IS 'Authentication token';
COMMENT ON COLUMN users.did IS 'Decentralized identifier';
COMMENT ON COLUMN users.status IS 'User status: active, inactive, or blocked';
COMMENT ON COLUMN users.blocked IS 'Whether the user account is blocked';

-- =====================================================
-- WALLET_VCS TABLE
-- =====================================================
CREATE TABLE wallet_vcs (
    id SERIAL PRIMARY KEY,
    vc_public_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes for wallet_vcs table
CREATE INDEX idx_wallet_vcs_vc_public_id ON wallet_vcs(vc_public_id);
CREATE INDEX idx_wallet_vcs_user_id ON wallet_vcs(user_id);

-- Unique constraint to prevent duplicate VCs for the same user and provider
CREATE UNIQUE INDEX idx_wallet_vcs_unique_user_provider
ON wallet_vcs(vc_public_id, provider, user_id);

-- Comments for wallet_vcs table
COMMENT ON TABLE wallet_vcs IS 'Stores wallet VC records without watcher information (watchers are now in wallet_vc_watchers table)';
COMMENT ON COLUMN wallet_vcs.vc_public_id IS 'Public ID of the wallet VC';
COMMENT ON COLUMN wallet_vcs.provider IS 'Wallet provider name (e.g., dhiway)';
COMMENT ON COLUMN wallet_vcs.user_id IS 'UUID of the user who owns this wallet VC';
COMMENT ON COLUMN wallet_vcs.created_by IS 'UUID of the user who created this wallet VC record';
COMMENT ON COLUMN wallet_vcs.updated_by IS 'UUID of the user who last updated this wallet VC record';

-- =====================================================
-- WALLET_VC_WATCHERS TABLE
-- =====================================================
CREATE TABLE wallet_vc_watchers (
    id SERIAL PRIMARY KEY,
    vc_public_id VARCHAR(255) NOT NULL,
    user_id UUID,
    provider VARCHAR(100),
    watcher_registered BOOLEAN DEFAULT FALSE,
    watcher_email VARCHAR(500),
    watcher_callback_url VARCHAR(1500),
    forward_watcher_callback_url VARCHAR(1500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes for wallet_vc_watchers table
CREATE INDEX idx_wallet_vc_watchers_vc_public_id ON wallet_vc_watchers(vc_public_id);
CREATE INDEX idx_wallet_vc_watchers_user_id ON wallet_vc_watchers(user_id);

-- Unique constraint to prevent duplicate watchers for the same VC, user, and email
CREATE UNIQUE INDEX idx_wallet_vc_watchers_unique
ON wallet_vc_watchers(vc_public_id, user_id, watcher_email);

-- Comments for wallet_vc_watchers table
COMMENT ON TABLE wallet_vc_watchers IS 'Stores watcher information for wallet VCs';
COMMENT ON COLUMN wallet_vc_watchers.vc_public_id IS 'Public ID of the wallet VC';
COMMENT ON COLUMN wallet_vc_watchers.user_id IS 'UUID of the user who owns this watcher';
COMMENT ON COLUMN wallet_vc_watchers.provider IS 'Wallet provider name (e.g., dhiway)';
COMMENT ON COLUMN wallet_vc_watchers.watcher_registered IS 'Whether the watcher is registered with the external service';
COMMENT ON COLUMN wallet_vc_watchers.watcher_email IS 'Email address for the watcher';
COMMENT ON COLUMN wallet_vc_watchers.watcher_callback_url IS 'Callback URL for the watcher';
COMMENT ON COLUMN wallet_vc_watchers.forward_watcher_callback_url IS 'Optional forward callback URL for external service notifications';
COMMENT ON COLUMN wallet_vc_watchers.created_by IS 'UUID of the user who created this watcher record';
COMMENT ON COLUMN wallet_vc_watchers.updated_by IS 'UUID of the user who last updated this watcher record';

-- =====================================================
-- FOREIGN KEY CONSTRAINTS (Optional - for referential integrity)
-- =====================================================

-- Foreign key from wallet_vcs to users
-- ALTER TABLE wallet_vcs 
-- ADD CONSTRAINT fk_wallet_vcs_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key from wallet_vcs created_by to users
-- ALTER TABLE wallet_vcs 
-- ADD CONSTRAINT fk_wallet_vcs_created_by 
-- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key from wallet_vcs updated_by to users
-- ALTER TABLE wallet_vcs 
-- ADD CONSTRAINT fk_wallet_vcs_updated_by 
-- FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key from wallet_vc_watchers to users
-- ALTER TABLE wallet_vc_watchers 
-- ADD CONSTRAINT fk_wallet_vc_watchers_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key from wallet_vc_watchers created_by to users
-- ALTER TABLE wallet_vc_watchers 
-- ADD CONSTRAINT fk_wallet_vc_watchers_created_by 
-- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Foreign key from wallet_vc_watchers updated_by to users
-- ALTER TABLE wallet_vc_watchers 
-- ADD CONSTRAINT fk_wallet_vc_watchers_updated_by 
-- FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a sample user (password should be hashed in production)
-- INSERT INTO users (first_name, last_name, account_id, username, password, email, status) 
-- VALUES ('John', 'Doe', 'ACC001', 'johndoe', 'hashed_password_here', 'john.doe@example.com', 'active');

-- =====================================================
-- SCHEMA SUMMARY
-- =====================================================

/*
Database Schema Summary:

1. users table:
   - Primary key: id (UUID)
   - Unique constraints: account_id, username, email
   - Status enum: active, inactive, blocked
   - Authentication: password, token, did
   - Audit fields: created_by, updated_by, created_at, updated_at

2. wallet_vcs table:
   - Primary key: id (SERIAL)
   - Foreign key: user_id -> users.id
   - Unique constraint: (vc_public_id, provider, user_id)
   - Audit fields: created_by, updated_by (both UUID)

3. wallet_vc_watchers table:
   - Primary key: id (SERIAL)
   - Foreign key: user_id -> users.id
   - Unique constraint: (vc_public_id, user_id, watcher_email)
   - Watcher tracking: registered status, email, callback URL
   - Audit fields: created_by, updated_by (both UUID)

Key Features:
- All user references use UUIDs for consistency
- Proper indexing for performance
- Audit trails with created_by/updated_by
- Unique constraints to prevent duplicates
- Nullable fields where appropriate
- Comprehensive comments for documentation
*/ 