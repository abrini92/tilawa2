# Tilawa Supabase Setup

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Found in Settings → API

### 2. Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `schema.sql`
3. Run the query

### 3. Create Storage Bucket

1. Go to Storage in Dashboard
2. Click "New Bucket"
3. Name: `recordings`
4. Public: ✅ Yes
5. Run `storage.sql` in SQL Editor

### 4. Configure Mobile App

Create `.env` in `tilawa-mobile/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Enable Auth Providers (Optional)

1. Go to Authentication → Providers
2. Enable Google:
   - Add Google OAuth credentials
3. Enable Apple:
   - Add Apple Sign-In credentials

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles (extends auth.users) |
| `recordings` | Audio recordings with analysis |
| `calibration_profiles` | Voice/noise calibration data |

### Row Level Security

All tables have RLS enabled:
- Users can only access their own data
- Automatic user profile creation on signup

### Realtime

`recordings` table has Realtime enabled for status updates.

## Storage

### Buckets

| Bucket | Description | Access |
|--------|-------------|--------|
| `recordings` | Audio files | Public read, authenticated write |

### File Structure

```
recordings/
├── {user_id}/
│   ├── 1234567890_recording.m4a  (original)
│   └── 1234567890_enhanced.m4a   (processed)
```

## Edge Functions (TODO)

For AI processing, create an Edge Function:

```typescript
// supabase/functions/process-recording/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { recordingId } = await req.json()
  
  // Call tilawa-core-ai
  // Update recording status
  
  return new Response(JSON.stringify({ success: true }))
})
```

## Monitoring

- Dashboard: View data, users, logs
- Logs: Real-time API logs
- Reports: Usage statistics
