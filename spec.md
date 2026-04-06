# R3 Esports Staff Manager

## Current State
Senior Admin accounts (SeniorAdmin1-10) have correct backend permissions for sending announcements, issuing warnings, and flagging demotions. The frontend AuthContext correctly grants `canSendAnnouncements`, `canManageStaff`, `canDemote`, and `canIssueWarning` to the `seniorAdmin` role.

However, the backend uses the caller's ICP Principal as the session key. When a user logs in, the backend maps their Principal -> userId. If the user's Principal changes (new browser, cleared cookies, app redeployment) or if the backend was upgraded (wiping in-memory sessions despite the stable session fix), the backend has no session for that Principal. The frontend still shows them as logged in (localStorage has their userId/role), but every action fails with "Unauthorized: Not logged in" or "userId mismatch".

## Requested Changes (Diff)

### Add
- Session validation hook: on app startup, after the actor is ready, call `getCurrentUser()` on the backend. If it returns null (no active backend session for the current Principal), clear the localStorage auth state and redirect to login.
- A `SessionValidator` component that runs this check inside the AuthProvider.

### Modify
- `App.tsx`: include the `SessionValidator` component so session is checked on load.
- `AuthContext.tsx`: expose a `clearAuth` method (or reuse `logout`) for the validator to call.

### Remove
- Nothing removed.

## Implementation Plan
1. Add a `SessionValidator` component in `App.tsx` that uses the actor and auth context.
2. When the actor is ready and user appears authenticated (has userId in localStorage), call `actor.getCurrentUser()`.
3. If the result is null, call `logout()` to clear localStorage and return to login.
4. This ensures stale sessions are detected immediately on load, fixing the "can't send announcements" issue for Senior Admins.
