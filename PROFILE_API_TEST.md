# Profile API Testing Guide

## How to Test Backend Profile API

### 1. Get Your Auth Token

First, login to the app and check the console logs to get your auth token, or use this command in the browser console:

```javascript
// In browser console (when logged in)
console.log(localStorage.getItem('auth_token'));
```

### 2. Test Profile API with curl

Replace `YOUR_TOKEN_HERE` with your actual token:

```bash
curl -X GET \
  'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1/users/me' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -v
```

### 3. Check the Response

Look at the JSON response and identify the actual field names for:
- Current level/score/band
- Target score/band

## Common Field Name Variations

The frontend now handles these variations automatically:

### Current Level
- `current_level` ✓
- `currentLevel` ✓
- `current_band` ✓
- `currentBand` ✓
- `current_score` ✓
- `currentScore` ✓

### Target Score
- `target_score` ✓
- `targetScore` ✓
- `target_band` ✓
- `targetBand` ✓

## Example Backend Responses

### If backend uses snake_case:
```json
{
  "user_id": "123",
  "user_name": "John Doe",
  "current_level": 6.5,
  "target_score": 8.0
}
```

### If backend uses camelCase:
```json
{
  "userId": "123",
  "userName": "John Doe",
  "currentLevel": 6.5,
  "targetScore": 8.0
}
```

### If backend uses "band" terminology:
```json
{
  "user_id": "123",
  "user_name": "John Doe",
  "current_band": 6.5,
  "target_band": 8.0
}
```

## What Was Fixed

The `UsersService.getProfile()` and `UsersService.updateProfile()` functions now:

1. **Log raw backend response** - You can see exactly what the backend returns in console
2. **Map field names** - Automatically handles all common variations
3. **Log mapped data** - Shows the final data being used by the app

## Verify the Fix

1. Open the app
2. Navigate to Profile screen
3. Check browser/app console logs for:
   - `[UsersService] RAW PROFILE DATA FROM BACKEND:` - Shows what backend sent
   - `[UsersService] MAPPED PROFILE DATA:` - Shows what frontend is using
4. If scores still show as "-", check the raw data to see what field names the backend is actually using
5. If the backend uses completely different field names not in our list, we'll need to add them to the mapping

## Next Steps

If scores still don't show after this fix:
1. Check console logs for the raw backend response
2. Identify the actual field names being used
3. Add those field names to the mapping in `users.service.ts` lines 260-261 and 359-360
