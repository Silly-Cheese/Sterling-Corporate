# Sterling Corporate — Release readiness

## Current state
**Implemented in source:** Corporate sign-in/bootstrap, HR directory, employee positions, event history, simulated gross pay, pay periods, timesheets and approval state transitions, read-only reconciliation preview, and opt-in per-project Firebase staff connection tests.

**Not completed:** live cross-project identity linking, automatic employee provisioning, authorization-sensitive writeback, unattended synchronization, real employee self-service, auditable payroll ledgers, and real-money payroll. These require additional security design and in some cases trusted external execution even while Firebase stays on Spark.

## Check before announcing production readiness
1. [ ] Change any credentials previously exposed in browser URLs, screenshots, or logs.
2. [ ] Confirm the first owner is claimed by the intended administrator; lock down registration policies.
3. [ ] Compare GitHub `firestore.rules` to **published** rules in the `sterling-corporate` Firebase console.
4. [ ] Test owner login, creation of a sample corporate employee, position, pay period and draft timesheet.
5. [ ] Test approved/rejected timesheet transitions with a real authorized account.
6. [ ] Verify Firestore security rules deny unauthenticated access, employee changes from non-admin accounts and unauthorized record edits.
7. [ ] In Corporate Integration Manager, test each project's read-only staff query with an authorized staff account. A successful read proves only its own scoped access.
8. [ ] Confirm the Corporate reconcile preview **does not save** or auto-link identities.
9. [ ] Confirm GitHub Actions tests pass and GitHub Pages deploys.
10. [ ] Test on small screens and confirm favicon displays.

## Spark constraints
- No Cloud Functions deployment in a Spark-only Firebase project.
- Existing projects have independent Firebase Auth sessions and Firestore security rules.
- A cross-project ID map can be created only after explicit identity verification and uniqueness enforcement.
- Unattended privileged integration needs a separate trusted execution environment, managed credentials and an auditable security review.
- Do not share Firebase service-account keys with the browser.

## Known limitations
- First-owner email-verified claim is a convenience bootstrap: do not allow an unclaimed installation to be publicly reachable.
- HR and simulated payroll writes are administered by Corporate authorized users only.
- Payroll math and timesheet gross values are browser-calculated. They are **not authoritative or tamper-proof ledger entries**, and do not move funds.
- Most collection views fetch up to 100 records without cursor pagination.
- The integration connection tester reads a maximum of 25 subsidiary personnel records in its own Firebase-authenticated browser session and does not copy them to Corporate.

## Links
- Corporate HQ: https://silly-cheese.github.io/Sterling-Corporate/
- Repository: https://github.com/Silly-Cheese/Sterling-Corporate
- Firestore rules: https://github.com/Silly-Cheese/Sterling-Corporate/blob/main/firestore.rules
