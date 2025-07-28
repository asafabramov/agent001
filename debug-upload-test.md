# File Upload Debug Test Plan

## Steps to Fix and Test the File Upload Issue

### 1. Apply Database Fixes
Run the SQL script to fix storage and authentication:
```bash
# Run this in Supabase SQL Editor
psql -f fix-storage-auth.sql
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Test the Authentication Flow
1. Open browser to http://localhost:3000
2. Login with your test user credentials
3. Check browser developer console for any auth errors
4. Verify user session is properly established

### 4. Test File Upload
1. Start a new conversation or select existing one
2. Try uploading the "Golden_Logo 15-11 (1).png" file
3. Monitor browser developer console for errors
4. Check network tab for API request details

### 5. Check Server Logs
Look for these log messages in the terminal:
- "Upload request - User authenticated: [email]"
- "Starting file upload to storage: [path]"
- "File upload successful, saving metadata..."
- "File upload complete: [file-id]"

### 6. Common Issues and Solutions

#### Issue: "Unauthorized" Error
**Cause**: User not properly authenticated
**Solution**: 
- Check if middleware is enabled (fixed)
- Verify Supabase session cookies are present
- Ensure user is logged in

#### Issue: "Bucket not found" Error
**Cause**: Storage bucket doesn't exist or wrong name
**Solution**: 
- Run the fix-storage-auth.sql script
- Check Supabase dashboard Storage section
- Verify bucket name is 'chat-files'

#### Issue: RLS Policy Error
**Cause**: User doesn't have permission to upload
**Solution**: 
- Run the fix-storage-auth.sql script
- Check RLS policies in Supabase dashboard
- Verify user is authenticated (not anonymous)

#### Issue: Conversation not found
**Cause**: Conversation ID is invalid or user doesn't own it
**Solution**: 
- Check conversation exists in database
- Verify user_id matches authenticated user
- Start a new conversation

### 7. Debug Commands

Check if bucket exists:
```sql
SELECT * FROM storage.buckets WHERE name = 'chat-files';
```

Check user's conversations:
```sql
SELECT * FROM conversations WHERE user_id = '[user-id]';
```

Check storage policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 8. Expected Behavior After Fix
- User can login successfully
- Middleware allows access to chat interface
- File upload button works without errors
- Files upload to 'chat-files' bucket
- Metadata saved to conversation_files table
- Files display in chat with proper permissions