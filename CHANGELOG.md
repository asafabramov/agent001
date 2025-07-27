# Changelog

All notable changes to the Hebrew AI Chatbot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2025-01-27

### Added
- **Complete User Authentication System**
  - Email/password login and signup with Hebrew RTL interface
  - Password reset functionality with Hebrew error messages
  - Session management with automatic refresh
  - Protected routes with middleware
  - User menu with profile display and logout
  - Theme toggle (dark/light mode) in user menu

- **Security Features**
  - Row Level Security (RLS) policies for complete data isolation
  - User-specific file storage in private buckets
  - API authentication on all endpoints
  - Ownership verification for conversations and files
  - Signed URLs for secure file access (24-hour expiry)
  - Middleware protection for all routes

- **Database Schema**
  - Profiles table for user management
  - Updated conversations table with proper user relationships
  - Comprehensive RLS policies for all tables
  - Automatic profile creation on user signup
  - User-specific file storage structure

- **Authentication Components**
  - `/auth` page with login/signup/reset forms
  - Auth provider with context management
  - Protected route wrapper component
  - User menu component with Hebrew interface
  - Loading states and error handling

### Changed
- **File Upload System**
  - Moved from public `chat-files` to private `user-files` bucket
  - User-specific storage paths: `users/{user_id}/conversations/{conversation_id}/`
  - Added ownership verification before upload
  - Implemented signed URLs for secure access

- **API Routes**
  - Updated all endpoints to require authentication
  - Added user context to conversations and file operations
  - Improved error handling with Hebrew messages
  - Enhanced security with proper authorization checks

- **Chat Interface**
  - Added user menu to header
  - Updated conversation creation to use authenticated user
  - Removed anonymous user dependencies
  - Enhanced UI with user-specific data display

### Fixed
- **File Upload RLS Error**
  - Resolved "new row violates row-level security policy" error
  - Implemented proper user authentication for file operations
  - Added comprehensive RLS policies for all file-related tables

- **Database Migration Issues**
  - Fixed profiles table structure and triggers
  - Corrected column references in update functions
  - Improved migration script robustness

### Security
- All user data is now completely isolated
- Private file storage with access control
- Authentication required for all operations
- RLS policies prevent cross-user data access
- Secure session management with auto-refresh

### Technical
- Updated Supabase client configuration for authentication
- Added middleware for route protection
- Implemented proper TypeScript types for authenticated state
- Enhanced error handling throughout the application
- Added comprehensive documentation for deployment

## [0.0.4] - Previous Version
- Hebrew RTL chatbot with Claude Sonnet 4 integration
- Anonymous mode with basic file upload
- Conversation history and management
- Beautiful Hebrew UI with animations
- File processing capabilities (PDF, DOCX, images)

## Migration Guide for v0.0.5

1. Run database migration: `supabase/auth-migration-fixed.sql`
2. Create demo user via signup form
3. Update environment variables (no changes needed)
4. Test authentication flow and file uploads

**Breaking Changes:** 
- Anonymous mode no longer supported
- All users must authenticate to access the application
- Existing anonymous data can be migrated to demo user account