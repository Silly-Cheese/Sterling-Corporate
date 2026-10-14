# Verified Staff Schema Audit — 2026-10-13

This audit is based on repository source code, **not live Firestore**. No employee account was accessed.

| Subsidiary | Staff collection | Document ID | Active staff predicate | Authorization source |
| --- | --- | --- | --- | --- |
| Sterling Motors | `users/{uid}` | Firebase Auth UID | `isStaff == true && status == 'active'` | `users/{uid}.permissions` |
| Sterling Mutual | `staff/{uid}` | Firebase Auth UID | `status == 'active'` and document exists | `staff/{uid}.permissions` |

## Findings

1. **Schema mismatch:** Motors stores customer and staff profiles in `users` with `isStaff`; Mutual uses `staff` separately from `accounts`. A generic employees collection query would miss existing personnel.
2. **Project-scoped authorization:** Each project's rules check its own `request.auth.uid`; a Sterling Corporate Firebase session cannot independently read both projects.
3. **Identity linking:** Must carry `projectId` + `uid`, local role and staff status. Global employee IDs are separate identifiers.
4. **Minimize imported fields:** Export only required personnel attributes initially (display name, title/role, active status, originating project and UID). Do not import insurance claims, customer profiles, financing data, or secrets.
5. **No auto-matching:** Email/name similarity can generate review candidates, but must not grant cross-company access.
6. **No cross-project browser administrator:** Existing Firestore rules will not authorize Corporate solely because the user is a Corporate administrator.
7. **Bootstrap protections:** Both applications contain initial administrator/bootstrap flows, which must remain untouched during migration.
8. **Role translation is non-trivial:** Mutual uses fine-grained `staff.*`, `claim.*` and `siu.*` permissions; Motors uses `staff.manage`, `admin.full`, and other dealership-specific permissions. Corporate roles cannot simply be copied across.

## Next gated implementation

- Add an explicit read-only personnel export script in a trusted environment, with tightly scoped service-account permissions and no exposed credentials.
- Audit staff field shapes from authorized sanitized samples before defining normalization.
- Review Corporate admin bootstrap and Firestore rules in an emulator.
- Verify that onboarding preserves local permissions and is idempotent.
- Only then enable reviewed identity-link persistence and reconciliation UI.

**Release gate:** Both integrations remain `not-verified`; synchronization remains disabled until authorized integration tests pass.
