# Sterling Corporate — Phase 2 extended people operations

## Implemented
- Multiple Corporate job positions per employee (positions stored separately from HR profiles)
- Optional reporting manager and distinct subsidiary per position
- Hourly and per-period salary pay-rate records in integer cents
- Active/inactive position states and append-only activity entries
- Simulated gross payroll records (regular hours, illustrative 1.5x overtime for hourly pay, bonus)
- Standalone Corporate module linked from the main dashboard
- No Motors/Mutual account changes or real disbursements

## Required setup
Deploy updated `firestore.rules` to Firebase project `sterling-corporate`, then verify your owner bootstrap. GitHub pushing does not deploy Firestore security rules. Corporate employee profiles must exist before positions are created.

## Boundaries and limitations
- All records are limited to authorized Corporate admin accounts; no employee self-service yet.
- The simulation is not a wage-law-compliant payroll engine. Overtime/earnings are examples, not formal payroll.
- Gross amounts are calculated client-side, so do not treat entries as trusted financial ledger evidence; a trusted server or rules-level verification is necessary for authoritative payroll.
- No bulk staff import, cross-project identity provisioning, bank transfers, taxes or time approvals.
- Job histories record new positions and status changes, not all edits.
- Only first 100 records of each collection are loaded in this release; pagination follows.
- Live backend testing is pending owner bootstrap and rule publication.
