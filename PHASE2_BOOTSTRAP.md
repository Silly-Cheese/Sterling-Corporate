# Phase 2 — First owner bootstrap and Corporate HR

## What is implemented
- First owner can register with email/password, verify email, then click **Claim owner access**.
- Claim uses a Firestore atomic batch writing `system/bootstrap` and `corporateAdmins/<uid>` together. Firestore rules require both records and reject claims once initialized.
- Corporate admin can create and search personnel records and modify their employment status.
- Employee profiles are Corporate-only until verified links are implemented; subsidiary Firebase Authentication is untouched.
- Employee reconciliation remains local preview-only, no bulk imports or live synchronization.
- No pay rates, pay statements, payment transfers, or payroll runs are created in this release.

## Deployment instructions
1. **Before publishing the application**: create the Corporate Firestore database in production mode, enable Email/Password authentication, and **deploy the updated `firestore.rules`**. A GitHub commit does not deploy Firebase rules.
2. Enable Firebase Authentication authorized domains for GitHub Pages.
3. Publish updated Corporate app to GitHub Pages and use **Create first owner**; verify email, then **Claim owner access**.
4. Do not circulate the site URL until initial ownership is claimed and tested.
5. If a corporate administrator already exists from an earlier manual setup, do not bootstrap another owner; plan an audited owner migration instead.

## Security warning
First-claim onboarding is a **first verified claimant wins** mechanism. If you publicly deploy without claiming it promptly, an unintended person with verified email could seize owner access. The email verification proves email control but **does not prove repository/Firebase ownership**. For a high assurance deployment, a trusted out-of-band Firebase Console / CLI owner authorization is necessary. This convenience bootstrap is intended for a controlled initial roleplay setup.

## Firestore schema
`corporateEmployees/<auto-id>`
- `displayName`, `department`, `title`, `subsidiary`, `employmentType`, `status`
- `createdBy`, `createdAt`, `updatedAt`

`corporateAdmins/<auth-uid>` (bootstrap-only): `active`, `role`, `createdAt`

`system/bootstrap` (immutable): `ownerUid`, `initialized`, `createdAt`

## Still to implement
- Admin invitation and granular permission management
- Verified account linking, reconciliation and trusted job integration
- Timekeeping, simulated payroll, audit events, transfer workflow
- Firebase rule emulator regression tests, E2E UI verification
