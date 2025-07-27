# Authentication Setup Guide

## Overview
The Hebrew chatbot application has been successfully upgraded from anonymous mode to full user authentication with email/password login.

## Database Migration Required

**IMPORTANT**: Run these steps in order:

### Step 1: Database Migration
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the content from `supabase/auth-migration-fixed.sql`
4. Execute the migration

### Step 2: Create Demo User
1. Start your application: `npm run dev`
2. Go to `http://localhost:3000/auth` 
3. Sign up manually with:
   - **Email**: demo@agent001.com  
   - **Password**: demo123
   - **Display Name**: משתמש דמו

### Step 3: Update Existing Data (Optional)
If you have existing conversations, you can assign them to the demo user:
```sql
-- Run this in Supabase SQL Editor after demo user signup
UPDATE public.conversations 
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@agent001.com' LIMIT 1
)
WHERE user_id IS NULL;
```

This migration will:
- Create profiles table with proper structure
- Add proper user authentication
- Update RLS policies 
- Set up user-specific file storage
- Enable secure user data isolation

## New Features Added

### 1. Authentication System
- ✅ Email/password login and signup
- ✅ Password reset functionality  
- ✅ Hebrew RTL forms and validation
- ✅ Session management and auto-refresh

### 2. User Interface
- ✅ User menu with profile display
- ✅ Theme toggle (dark/light mode)
- ✅ Logout functionality
- ✅ Protected routes with redirects

### 3. Security Features
- ✅ Row Level Security (RLS) policies
- ✅ User-specific data isolation
- ✅ Private file storage per user
- ✅ API route authentication
- ✅ Middleware protection

### 4. File Upload Security
- ✅ User-specific storage paths: `users/{user_id}/conversations/{conversation_id}/`
- ✅ Private bucket with signed URLs
- ✅ File ownership verification
- ✅ RLS policies for file access

## Technical Implementation

### File Structure
```
app/
├── auth/page.tsx              # Login/signup page
├── api/
│   ├── conversations/route.ts # User-specific conversations
│   └── upload/route.ts        # Authenticated file uploads
components/
├── providers/auth-provider.tsx # Auth context and session management
└── ui/user-menu.tsx           # User menu component
lib/
├── auth.ts                    # Auth utilities and helpers
└── types-db.ts               # Updated database types
middleware.ts                  # Route protection
```

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## How It Works

### Authentication Flow
1. User visits app → Redirected to `/auth` if not logged in
2. User logs in/signs up → Session created and stored
3. Redirected to main chat interface with user context
4. All API calls include user authentication
5. Data filtered by user ID through RLS policies

### Data Isolation
- Each user sees only their own conversations
- Files are stored in user-specific folders
- All database queries filtered by `auth.uid()`
- RLS policies prevent cross-user data access

### File Security
- Files uploaded to private `user-files` bucket
- Storage path: `users/{user_id}/conversations/{conversation_id}/filename`
- Access via signed URLs (24-hour expiry)
- Ownership verification before upload

## Deployment Steps

1. **Run Database Migration**
   ```sql
   -- Execute supabase/auth-migration.sql in Supabase SQL Editor
   ```

2. **Update Environment Variables**
   - Ensure all required env vars are set
   - No additional configuration needed

3. **Test Authentication**
   - Try signup/login flow
   - Test file uploads
   - Verify user data isolation

4. **Production Considerations**
   - Consider email confirmation for signups
   - Set up proper SMTP for password resets
   - Configure rate limiting
   - Add monitoring for auth failures

## Security Notes

- All conversations are user-specific
- Files are private by default
- RLS policies prevent data leaks
- Sessions are automatically refreshed
- Middleware protects all routes
- API routes verify user ownership

## Migration Impact

- Existing anonymous data moved to demo user
- No data loss during migration  
- Backward compatibility maintained
- Gradual rollout possible

The application now provides enterprise-grade security while maintaining the beautiful Hebrew RTL interface and all existing functionality.