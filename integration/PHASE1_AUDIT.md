# Sterling Corporate Phase 1 — audited integration boundaries

## Verified from the GitHub source
| System | Firebase project | Source architecture | Scope |
| --- | --- | --- | --- |
| Corporate | sterling-corporate | GitHub Pages static web app, Firebase Web SDK | Headquarters |
| Motors | sterling-motors | Vite, vanilla JS, Firebase Auth + Firestore | Dealer operations |
| Mutual | sterling-mutual-insurance | Vite, React, Firebase Auth + Firestore | Insurance operations |

All three projects have distinct Auth and Firestore instances. Existing subsidiaries retain their own source code and data.

## Current guardrails
- No subsidiary rules, authentication accounts or Firestore data have been changed.
- This branch adds a machine-readable list of candidate integrations; status is not-verified and sync is disabled.
- Employee UIDs must always be qualified by Firebase project ID.
- Matching names/emails are leads for review only, not identity proof.
- The candidate-link helper *does not* create, activate or authorize links.
- Later persistence needs trusted verification, uniqueness constraints, conflict audit and explicit administrative approval.
- Simulated payroll, no bank transfers, no cross-project administrator service in static frontend.
- Browser credentials cannot safely act as a privileged bridge between Firebase projects.
- The Corporate Firestore rule set remains deny-by-default until authorization and integration tests pass.

## Implementation sequence
1. Inspect existing Firestore rules, staff profile schema and authorization checks for both subsidiaries.
2. Specify read-only exported staff data shape separately for each (no customer/claims data).
3. Build verified account ownership confirmation, reconciliation UI and audit events.
4. Add scheduled privileged synchronization only with secure workflow credentials, minimal IAM, and idempotency.
5. Test a termination/permission removal path before enabling any automatic writeback.

## Deployment
This work is proposed through a pull request, and requires review and merge. Firestore security rules are not deployed by a GitHub commit.
