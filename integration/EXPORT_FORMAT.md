# Read-only reconciliation preview

The Corporate UI offers an **offline browser-only dry run** for staff-export JSON. It does not upload, persist or authorize any account links. The page is only visible to a validated Corporate administrator.

## Accepted format
An array of up to 500 records, each including `projectId`, `uid`, and optional personnel attributes.

```json
[
  {"projectId":"sterling-motors","uid":"sample-motors-user","displayName":"Example Employee","email":"example@example.invalid","isStaff":true,"status":"active","role":"sales"},
  {"projectId":"sterling-mutual-insurance","uid":"sample-mutual-user","displayName":"Example Employee","email":"example@example.invalid","status":"active","title":"Claims Adjuster"}
]
```

Do not paste production employee data into publicly shared issue reports, or commit exports to GitHub. Do not include passwords, access tokens, medical data, claims, addresses or financial information.

The UI identifies potential duplicate **candidates** from similar name or email and shows `Review required`; it cannot merge or grant privileges. Inputs are processed in memory only, and cleared on sign out or page reload.

## Still required before a real migration
- Trusted, access-controlled source exports from Motors `users` and Mutual `staff`.
- Employee identity verification using both authenticated sessions or independently reviewed proof.
- Persisted uniqueness checks, review approvals, event audit trails, revocation and rollback.
- Security rules tests on the Corporate and subsidiary projects.
