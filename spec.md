# R3 Esports Staff Manager

## Current State
The app has Owner and Staff roles. Users can change their own passwords via a key icon in the header. Owners can change any user's password from the Admin Panel. Usernames are fixed and cannot be changed.

## Requested Changes (Diff)

### Add
- `changeUsername(userId, currentPassword, newUsername)` backend function — allows a logged-in user to change their own username (requires password confirmation, rejects duplicates)
- `adminChangeUsername(requesterId, targetUserId, newUsername)` backend function — Owner-only, changes any user's username
- `ChangeUsernameDialog` frontend component — modal with current password + new username fields (self-service)
- Pencil/edit icon button in the Layout header next to the key icon, opens ChangeUsernameDialog
- "Change Name" button in Admin Panel All Users tab (Owner only), opens an admin username change dialog
- `useChangeUsername` and `useAdminChangeUsername` mutation hooks in useQueries.ts
- Auth context `updateUsername` method so the header reflects the new name immediately after a self-service change

### Modify
- `Layout.tsx` — add pencil icon button and `ChangeUsernameDialog`
- `AdminPanelPage.tsx` — add "Change Name" button per row, wire admin username change dialog
- `AuthContext.tsx` — expose `updateUsername(newUsername)` to update local state
- `useQueries.ts` — add two new mutation hooks

### Remove
- Nothing removed

## Implementation Plan
1. Add `changeUsername` and `adminChangeUsername` to `src/backend/main.mo`, updating `usersByUsername` map to remove old key and add new key
2. Add `updateUsername` to AuthContext
3. Add `useChangeUsername` and `useAdminChangeUsername` hooks to `useQueries.ts`
4. Create `src/frontend/src/components/ChangeUsernameDialog.tsx` (self-service — requires current password)
5. Create `src/frontend/src/components/AdminChangeUsernameDialog.tsx` (Owner only — no password needed)
6. Update `Layout.tsx` to include pencil icon and `ChangeUsernameDialog`
7. Update `AdminPanelPage.tsx` to add "Change Name" button and wire `AdminChangeUsernameDialog`
