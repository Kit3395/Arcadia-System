# Arcadia System — User Walkthrough (per role)

> Live app: `https://arcadia-ph.ai.studio/`
> Six personnel accounts exist, one per role. Your access key is the
> per-user secret configured in `ARCADIA_ACCESS_KEYS` — nobody can log in
> as you without it.

---

## 1. Getting in (everyone)

1. Open the app. The **Access Gateway** shows six personnel cards.
2. Click your card (check the name, title, and clearance level).
3. Type your **Corporate Access Key** into the password field.
4. Click **Authenticate & Enter Arcadia**.

You land on the **Dashboard** with your role badge in the top-right header.
The header also shows the organization, a session correlation ID (useful
when reporting issues), and a sign-out button.

**First run:** the system boots with no projects. Everything project-related
is empty until a Project Lead creates the first project (see below).

---

## 2. The interface at a glance

The left sidebar has one tab per governance domain:

| Tab | What it's for |
|---|---|
| Dashboard | Project health, lifecycle stepper, state banners |
| Projects | Project directory — create/select projects |
| Decision Queue | Items waiting on a human approve/reject |
| Constitution | Project constitution: approved stack, compliance, governance rules |
| Requirements | Requirements table — propose, review, approve |
| Tasks | Task list + inspector — create, assign, execute, move states |
| Executions | Agent execution runs — start, stop, validate |
| Collaboration | Multi-agent collaboration and agent profiles |
| Validation | Validation gates, contracts, rules — run/scan/waive/approve |
| Optimization | Cost & performance recommendations — review/approve/apply |
| Learning | Organizational memory, detected patterns, evolution proposals |
| Resilience | Circuit breakers, deployments, incidents, disaster recovery |
| Verification | Go-live verification, traceability, scope registry |
| Operations | Operational controls, maintenance, emergency actions |
| Assurance | Continuous assurance, architecture principles, change impact |
| Decisions | Decision log — every ratified decision, who made it |
| Audit Log | Immutable audit ledger — who did what, when (search/filter) |
| Test Runner | Runs the 142 automated invariant checks on demand |

Tabs you lack permission for still appear, but the actions inside them are
enforced server-side: unauthorized buttons fail with a permission message.
If a control does nothing for you, it's outside your role — that's by design.

---

## 3. Project Lead — Dr. Evelyn Vance (`lead@arcadia.dev`)

**Your mission:** end-to-end ownership. You are the only role that can create
projects and the final authority on requirements, decisions, and go-live.

**Workflow A — Bootstrap the system (first run):**
1. Go to **Projects** → create a project (name, slug, description, complexity level).
2. Open **Constitution** → set the approved stack, security classification,
   compliance profiles (e.g. SOC2, PCI-DSS), prohibited dependencies, and
   governance rules → save.
3. The project now appears everywhere; all other tabs activate for it.

**Workflow B — Shepherd work through governance:**
1. **Requirements** → review proposed requirements → **Approve** (or send back).
2. **Tasks** → create tasks, **assign** owners, move them through states
   (Draft → Ready → …).
3. **Decision Queue** → items flagged for human judgment land here →
   **Approve** or **Reject** each with a recorded rationale.
4. **Validation** → **run** the gates before any state transition; **waive**
   only with justification.
5. **Test Runner** → run the full 142-check suite any time you want proof
   the system's invariants hold.

**Workflow C — Admin controls (header, top-right):**
- **Active Persona switcher:** preview the app as any other role (useful for
  checking what a Developer or Client sees). Switching issues you a fresh
  session for that persona.
- **LOCKDOWN:** emergency only — instantly revokes every active session and
  locks the system. Use it if you suspect credential compromise.

---

## 4. Architect — Marcus Chen (`architect@arcadia.dev`)

**Your mission:** technical authority. You own the constitution and the
shape of the work.

1. **Constitution** → update the approved stack, compliance profiles, and
   governance rules as architecture evolves.
2. **Requirements** → **approve** or reject proposed requirements.
3. **Tasks** → create tasks, **assign** them, advance their states.
4. **Validation** → run validation gates; **Drift** (inside Validation) →
   detect and **reconcile** architectural drift.
5. **Decisions** → record architectural decisions so the log stays complete.

**Outside your lane:** you cannot create projects, run the lockdown, manage
incidents, or accept risks — those belong to the Project Lead, Operations,
and Security.

---

## 5. Security — Agent Ward (`security@arcadia.dev`)

**Your mission:** the security gate. Nothing ships past you.

1. **Validation** → run **security scans**; review **Active Findings** →
   **resolve** each with a recorded remediation.
2. Findings a Developer claims to fix need Security (or Lead) review —
   developers cannot self-certify resolutions.
3. **Resilience** → manage **security incidents** end to end.
4. **Validation** → **waive** a gate only with explicit justification, or
   **approve** gates in your domain.
5. **Drift** → reconcile security-relevant drift; **risk acceptances** live
   with you and the Lead.
6. **LOCKDOWN** (header) is available to you for credential-compromise
   emergencies.

---

## 6. Developer — Sarah Connor (`dev@arcadia.dev`)

**Your mission:** execution. Your world is the task list.

1. **Tasks** → open your assigned tasks in the inspector → **execute** them →
   move them through states as work progresses.
2. **Validation** → **run** validations against your work before marking
   complete.
3. **Executions** → monitor your agent runs; stop and restart as needed.
4. Everything else (dashboard, requirements, decisions, audit log…) is
   read-only context for you.

**Outside your lane:** you cannot create or assign tasks, approve
requirements, resolve security findings on your own, or touch admin controls.

---

## 7. Operations — Elena Rostova (`ops@arcadia.dev`)

**Your mission:** keep it running and recover fast when it doesn't.

1. **Resilience** → watch circuit breakers; manage **deployments**;
   **rollback** a bad deployment; execute **disaster-recovery** drills.
2. **Operations** → maintenance windows, operational admin, **emergency**
   actions.
3. **Resilience** → own the **incident** lifecycle: triage → mitigate →
   resolve, with everything recorded.
4. **Optimization** → **apply** approved cost/performance policies.
5. **LOCKDOWN** (header) is available to you for infrastructure emergencies.

---

## 8. Client / Auditor — Arthur Pendelton (`auditor@arcadia.dev`)

**Your mission:** independent oversight. You are read-only almost everywhere.

1. **Dashboard** → project health and lifecycle at a glance.
2. **Requirements** → review what's proposed; you can **submit** new
   requirements for the team to consider.
3. **Decisions** and **Audit Log** → verify every action: who did what,
   when, under which authority. Filter and search the ledger freely.
4. All other tabs are read-only context.

**Outside your lane:** approvals, task management, validations, and admin
controls are not available to your role.

---

## 9. Troubleshooting

- **"Invalid corporate access key"** — the key is per-user and case-sensitive.
  Confirm you're using the key assigned to the personnel card you selected.
- **A button does nothing / permission error** — your role lacks that
  permission. Check section 3–8 for what your role can do.
- **Session expired** — sessions last 12 hours; sign in again.
- **System locked (LOCKDOWN ACTIVE)** — an admin enacted emergency lockdown.
  All sessions were revoked; ask a Project Lead, Security, or Operations
  member to re-authenticate and resume.
- **Empty tabs after first boot** — normal: create the first project as
  Project Lead (Workflow A above) and the tabs populate.
- **Something looks wrong** — copy the correlation ID from the header and
  report it; every request is traceable in the audit log.
