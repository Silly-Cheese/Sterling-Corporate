# Sterling Corporate HQ

Phase 1 foundation for Sterling Group, designed for **Firebase Spark**, **GitHub Pages**, and **separate existing Firebase projects**.

## Scope
- Sterling Corporate Firebase project: `sterling-corporate`
- Registered subsidiaries: `sterling-motors`, `sterling-mutual-insurance`, and `sterling-payroll-5d200` (Payroll Services).
- Preserve all existing identities and records; **no migration or writes** to subsidiary projects in Phase 1.
- The dashboard distinguishes *configured* from *verified connected*. Both subsidiaries start **not verified**.

## Setup
1. In Firebase Console for `sterling-corporate`, enable **Authentication > Email/Password**.
2. Create your administrative user in Firebase Authentication.
3. In **Firestore Database**, create the database in production mode.
4. Deploy `firestore.rules` to the Corporate project with Firebase CLI or paste the rules into Firestore Rules. They default-deny all unlisted paths.
5. Under Firestore > Data, create `corporateAdmins/<YOUR_CORPORATE_AUTH_UID>` with `active: true`. **Only a trusted project owner with console access should do this.**
6. Enable **Authentication > Settings > Authorized domains** for your GitHub Pages domain.
7. GitHub Pages: Settings > Pages > Deploy from branch `main`, root `/`. The app is plain static HTML and uses Firebase CDN.
8. Log in to Sterling Corporate HQ. The registry is read-only by design for Phase 1.

## Architecture & guardrails
- Corporate authentication is separate from Motors and Mutual authentication.
- Corporate user identities will later map to existing subsidiary UIDs through a verified, explicit linking workflow. Never merge based only on matching names/emails.
- Frontend configuration values (Firebase apiKey, authDomain, projectId, appId) identify a public web app, **not** administrator credentials.
- Do **not** publish service account private keys or GitHub secrets.
- Never put the Firebase Admin SDK in the static website.
- Cross-project administrative changes require a trusted privileged environment and an explicit authorization design.
- Corporate Firestore denies all access except specifically scoped authenticated admin reads in Phase 1. No client writes are enabled.
- GitHub Actions are an optional *later* path for periodic reconciliation, not real-time access revocation.
- **Payroll is simulated**, and no payment processing is enabled.

## Phase 1 status
- Repository scaffold and Corporate Firebase web config: provided.
- Subsidiary repository/project mapping: identified.
- Runtime connection tests: **not performed** (requires the project's configured auth and Firestore).
- Actual employee reconciliation: **not started**.
- Subsidiary apps: **not modified**.

## Future phases
1. Audit authoritative Firestore schema and rules in each subsidiary.
2. Define reconciliation records, verification and permission checks.
3. Add data mapping and read-only authenticated integration tests.
4. Introduce HR, simulated payroll, and scheduled reconciliation with auditing.

## Known repos
- https://github.com/Silly-Cheese/sterling-motors
- https://github.com/Silly-Cheese/Sterling-Mutual-Insurance
- https://github.com/Silly-Cheese/Sterling-Payroll

## 2026 Sterling suite updates

Corporate HQ now displays all three subsidiaries (Motors, Mutual and Payroll) and permits **manual, read-only** Payroll identities to appear as reconciliation candidates. Matches based on shared names/emails remain **review-required**, not account merges or permission grants. The scheduled read-only reconciliation script still uses only Motors and Mutual; Payroll credentials and an explicit safe source mapping must be configured before any live Payroll connection can be claimed.

All four Sterling repositories now have or are adding source-level validation. Corporate itself has a GitHub quality workflow that runs the existing reconciliation tests and an offline dry-run of the sync process. It never reads or writes production Firebase data during that dry-run.
