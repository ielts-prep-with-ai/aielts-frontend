# Backend Issues in Mock Test Submission Flow

This document outlines critical issues found in the backend submission flow that need to be fixed.

## 1. ❌ CRITICAL: Final Part Detection Bug

**Location:** `confirmSimulationPartSubmission` function

**Issue:**
The backend assumes `part3` is always the final part and only triggers async processing when part3 is submitted:

```go
if len(req.Answers["part3"]) > 0 {
    params.Part3Done = done
    part = "part3"
    isFinalPart = true  // ❌ Only set for part3
} else if len(req.Answers["part2"]) > 0 {
    params.Part2Done = done
    part = "part2"
    // ❌ isFinalPart not set for part2
} else if len(req.Answers["part1"]) > 0 {
    params.Part1Done = done
    part = "part1"
    // ❌ isFinalPart not set for part1
}
```

**Problem:**
- If a test only has Part 1 and Part 2 (no Part 3), the async processing will never be triggered
- If a test only has Part 1, the async processing will never be triggered
- This breaks the evaluation pipeline for practice mode tests

**Solution:**
The backend needs to check which parts are actually in the test session to determine which is the final part:

```go
// Get test session to check which parts exist
testSession, err := server.Pgdbc.GetTestSessionByID(ctx, req.TestSessionID)
// ... error handling ...

// Parse selected parts from test session
var selectedParts []string
json.Unmarshal(testSession.SelectedParts, &selectedParts)

// Determine current part and check if it's the final one
var part string
isFinalPart := false

if len(req.Answers["part3"]) > 0 {
    params.Part3Done = done
    part = "part3"
    isFinalPart = true // Always final if part3 exists
} else if len(req.Answers["part2"]) > 0 {
    params.Part2Done = done
    part = "part2"
    // Check if part3 exists in selected parts
    haspart3 := false
    for _, p := range selectedParts {
        if p == "part3" {
            haspart3 = true
            break
        }
    }
    isFinalPart = !haspart3 // Final if no part3
} else if len(req.Answers["part1"]) > 0 {
    params.Part1Done = done
    part = "part1"
    // Check if part2 or part3 exist in selected parts
    hasLaterParts := false
    for _, p := range selectedParts {
        if p == "part2" || p == "part3" {
            hasLaterParts = true
            break
        }
    }
    isFinalPart = !hasLaterParts // Final if no later parts
}
```

## 2. ⚠️ API Response Structure Mismatch (WORKAROUND APPLIED IN FRONTEND)

**Location:** `getSimulationUploadURLs` function

**Issue:**
Backend returns:
```json
{
  "message": "upload URLs generated",
  "answers": {
    "part1": { "1": "url1", "2": "url2" }
  }
}
```

But the TypeScript interface expects:
```typescript
{
  upload_urls: {
    part1?: Record<string, string>;
    part2?: Record<string, string>;
    part3?: Record<string, string>;
  }
}
```

**Current Status:**
✅ Frontend has been updated to handle both response formats:
```typescript
const uploadUrls = (uploadResponse as any).answers?.[partKey] || uploadResponse.upload_urls?.[partKey];
```

**Recommendation:**
Update backend to match the TypeScript interface for consistency:
```go
ctx.JSON(http.StatusOK, gin.H{
    "message": "upload URLs generated",
    "upload_urls": req.Answers,  // Changed from "answers" to "upload_urls"
})
```

## 3. ✅ Per-Part Submission (FIXED IN FRONTEND)

**Issue:**
Frontend was trying to submit all parts at once, but backend expects one part at a time.

**Status:**
✅ Fixed - Frontend now submits each part separately in sequence.

## Summary of Frontend Fixes Applied

1. ✅ Fixed per-part submission - now submits parts one at a time
2. ✅ Added upload progress tracking with visual feedback
3. ✅ Added proper error handling for individual upload failures
4. ✅ Handles both `answers` and `upload_urls` response formats
5. ✅ Stops active recording before auto-submit on time expiry
6. ✅ Better error messages for failed uploads

## Next Steps

- [ ] Fix backend final part detection bug (Critical)
- [ ] Update backend API response to use `upload_urls` instead of `answers` (Recommended)
- [ ] Add retry logic in backend for failed async processing tasks (Recommended)
- [ ] Consider adding idempotency keys to prevent duplicate submissions (Nice to have)
