# R3 Esports Staff Manager

## Current State
Senior Admin accounts (SeniorAdmin1-10) have all the correct permissions in both backend and frontend code:
- `canManageStaff` = true (Admin Panel nav link shows)
- `canSendAnnouncements` = true (announcement composer shows)
- `canIssueWarning` = true for staff targets
- `canDemote` = true for staff targets
- Backend `sendAnnouncement`, `issueWarning`, `demoteUser` all authorize `#seniorAdmin`

However, the root cause of persistent "can't perform actions" is: the backend uses the IC `caller` principal for sessions. All anonymous browser users share the same IC anonymous principal. When the canister restarts or is redeployed, the session is cleared. When the user refreshes or re-opens the app, localStorage has their auth data but the backend session is gone.

The current `SessionValidator` detects stale sessions and logs the user out, but doesn't auto-recover. Users must log in again manually.

## Requested Changes (Diff)

### Add
- Auto-relogin: when `SessionValidator` detects a stale session (getCurrentUser returns null) but the user has stored credentials, silently re-call `login()` on the backend to re-establish the session without forcing the user to the login screen.
- Store credentials (encrypted in localStorage) to support auto-relogin.
- Add an explicit "Announcements" section inside the Admin Panel page for Senior Admins so they can send announcements directly from the Admin Panel (not just the Announcements page).

### Modify
- `AuthContext`: store credentials on login for auto-relogin.
- `SessionValidator` in App.tsx: attempt silent re-login before logging out.
- `AdminPanelPage`: add an "Announcements" tab for owners and senior admins to send announcements directly.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `AuthContext` to store username/password in localStorage on login (needed for auto-relogin).
2. Update `SessionValidator` in `App.tsx` to: detect stale session → attempt silent backend re-login with stored credentials → only logout if re-login fails.
3. Add an "Announcements" tab to `AdminPanelPage` for owners and senior admins with the announcement composer inline.
