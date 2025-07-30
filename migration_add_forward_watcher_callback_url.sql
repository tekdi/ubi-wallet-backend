-- =====================================================
-- Migration: Add forward_watcher_callback_url column
-- =====================================================

-- Add forward_watcher_callback_url column to wallet_vc_watchers table
ALTER TABLE wallet_vc_watchers 
ADD COLUMN forward_watcher_callback_url VARCHAR(500) DEFAULT NULL;

-- Add comment for the new column
COMMENT ON COLUMN wallet_vc_watchers.forward_watcher_callback_url IS 'Optional forward callback URL for external service notifications';

-- =====================================================
-- Migration Summary
-- =====================================================
/*
This migration adds a new optional column 'forward_watcher_callback_url' to the wallet_vc_watchers table.

Purpose:
- Allows setting a separate callback URL specifically for forwarding watch notifications
- If not set, falls back to the regular watcher_callback_url
- Provides flexibility for different callback endpoints for different use cases

Column Details:
- Name: forward_watcher_callback_url
- Type: VARCHAR(500)
- Nullable: YES
- Default: NULL
- Purpose: Optional forward callback URL for external service notifications

Usage:
- When processWatchCallback is called, it will first check if forwardWatcherCallbackUrl is set
- If set and it's an external URL, it will forward the callback to that URL
- If not set, it falls back to the regular watcherCallbackUrl
- This allows for more granular control over callback forwarding
*/ 