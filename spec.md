# R3 Esports Staff Manager

## Current State
- Two roles: owner and staff
- SeniorAdmin1-10 accounts exist with staff role
- Only owners can send announcements, issue warnings, and demote users
- Frontend AuthContext has `canSendAnnouncements` and `canDemote` locked to owner only

## Requested Changes (Diff)

### Add
- Reintroduce `seniorAdmin` as a distinct role in the Motoko backend
- SeniorAdmin1-10 accounts get the `seniorAdmin` role (restored from staff)
- `seniorAdmin` users can: send announcements, issue demotion warnings, trigger inactivity warnings
- Backend `sendAnnouncement` allows seniorAdmin callers
- Backend `demoteUser` allows seniorAdmin callers to demote staff (not owner or other seniorAdmins)
- Frontend: `canSendAnnouncements` = true for seniorAdmin
- Frontend: `canDemote` returns true for seniorAdmin targeting staff
- Frontend: Admin Panel shows demotion controls for seniorAdmin on staff rows
- Navigation: SeniorAdmin users see the Admin Panel link (limited to demotion/users tab only)

### Modify
- `normalizeRole` should NOT collapse seniorAdmin to staff anymore
- `roleToText` returns "seniorAdmin" for seniorAdmin
- `canDemote` backend function: seniorAdmin can demote staff only
- `isOwnerOrSenior` helper for announcement permission checks
- `initializeAccounts`: SeniorAdmin1-10 get `#seniorAdmin` role
- `migrateRoles`: no longer collapse seniorAdmin -> staff (restore them)
- AuthContext: UserRole type includes seniorAdmin
- AdminPanelPage: seniorAdmin can access users and demotion tabs, but not passwords tab

### Remove
- Nothing removed

## Implementation Plan
1. Backend: Add #seniorAdmin variant to UserRole type
2. Backend: Remove seniorAdmin from normalizeRole collapse, update roleToText
3. Backend: Update canDemote - seniorAdmin can demote #staff only
4. Backend: Update sendAnnouncement - allow seniorAdmin
5. Backend: initializeAccounts - SeniorAdmin1-10 get #seniorAdmin
6. Backend: migrateRoles - restore seniorAdmin accounts (set seniorAdmin role for id 5-14)
7. Frontend AuthContext: add seniorAdmin to UserRole, update canSendAnnouncements, canDemote
8. Frontend AdminPanelPage: show admin panel nav for seniorAdmin, hide passwords tab
9. Frontend: update helpers getRoleLabel/getRoleColor for seniorAdmin display
10. Validate and deploy
