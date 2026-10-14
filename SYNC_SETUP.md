# Five-minute Spark read-only synchronization

## Implementation
The workflow `.github/workflows/sterling-readonly-sync.yml` runs on `*/5 * * * *` when explicitly enabled. GitHub may delay or skip scheduled runs during high load. The workflow reads existing Motors `users` and Mutual `staff` collections with a capped query; it never writes to Firebase, provisions users, links identities, or changes employee accounts.

It produces a **sanitized JSON run summary** as a short-lived GitHub Actions artifact: project sampled-document counts, observed staff count, conflict count and status. No names, UIDs, emails or Firestore documents are saved to artifacts. No credentials are logged. Run logs may show Firebase error classes.

## Activate safely
1. Create separate, narrowly scoped credentials with Firestore read-only access to each existing Firebase project. Configure IAM and Firestore access policies carefully. Service-account Admin SDK access bypasses Firestore Security Rules; prefer the least privilege available at the IAM layer.
2. Store the JSON secrets in Corporate repository **Settings → Secrets and variables → Actions → Repository secrets**:
   - `STERLING_MOTORS_SERVICE_ACCOUNT_JSON`
   - `STERLING_MUTUAL_SERVICE_ACCOUNT_JSON`
3. Test once manually using **Actions → Sterling read-only integration sync → Run workflow** after setting the variable below. Check the sanitized artifact and confirm read-only results.
4. Create repository variable `STERLING_READONLY_SYNC_ENABLED` with value `true`. Until this exists, the scheduled job will **skip**, not access Firebase.
5. This first release only samples the first 50 ordered documents; it cannot guarantee coverage of all employees. A stateful incremental cursor is needed for full coverage. Review Actions logs and read counts on both projects, ensuring Spark quotas are not exceeded. Disable the variable promptly if abnormal reads occur.

**Never** copy service account JSON into source code, chat messages, GitHub issues or a public web application. Avoid broad roles such as Editor or Owner for sync credentials.

## Safeguards
- Zero Firebase writes in the job; no cross-project permissions are introduced.
- Strict expected project ID checks before any reads.
- At most 50 source documents sampled per project per run (~14,400 document reads/project/day if every 5-minute run executes), leaving room for other Spark operations. This is NOT complete enumeration or a rotating full scan.
- Motors records must be staff (isStaff true); no insurance customer, policy, claim or sales collections are read.
- Project-qualified identity references and deterministic hash comparisons; no name/email auto-merging.
- Missing records do **not** imply terminations.
- Duplicate identity conflicts cause nonzero exit and artifact reporting.
- Runs have a concurrency group; no parallel scheduled sync runs from this workflow.

## Not yet implemented
- Persistent synchronization state, changed-record deltas across runs, cross-project data copying, Corporate database audit records, identity approval/revocation, or two-way synchronization.
- Privileged writeback is explicitly out of scope. It requires separate code review, credential scopes and tests.
- A service-account read-only role protects write access, but the code should still undergo static and behavioral review before activation.

## Development 1 — Corporate read-only employee import

The sync can now copy **limited, read-only staff snapshots** into the separate Corporate collection `subsidiaryStaffSnapshots`. It does NOT modify the original staff collections and does NOT create records in `corporateEmployees`. This is an explicitly enabled import feature, not comprehensive two-way synchronization.

To enable importing, create a separate service-account credential for Firebase project `sterling-corporate` with the minimum Firestore write permissions needed for `subsidiaryStaffSnapshots`, stored as repository secret `STERLING_CORPORATE_SERVICE_ACCOUNT_JSON`. **Do not reuse the Motors or Mutual admin credentials for this purpose.** Admin SDK bypasses Firestore Security Rules; the project ID check and constrained code help but do not replace IAM restriction.

Deploy the latest `firestore.rules` to `sterling-corporate` so your authorized Corporate admin session can read `subsidiaryStaffSnapshots`. Once the Corporate credential is configured, set repository variable `STERLING_CORPORATE_IMPORT_ENABLED=true`. Run the workflow manually, then visit Corporate → People & HR → Subsidiary Employee Directory and click Refresh imported records.

The initial five-minute scan covers **at most 50 source documents per subsidiary**, sorted by document ID, so records outside this window will not import. No deletion or termination is inferred for missing people. Full coverage requires a stateful, cursor-based incremental scanner. The directory is limited to 100 snapshot documents per browser read, and does not yet paginate.
