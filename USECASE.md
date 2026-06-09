# Use Cases - TechServe Global (Data Storage Sample)

**Sample repo:** [freshworks-developers/data-storage-samples](https://github.com/freshworks-developers/data-storage-samples)  
**Features demonstrated:** `client.db.set/get/delete/update`, TTL, `setIf`, `client.db.entity`, `$db.*` serverless, composite keys, `showNotify`

## Company Overview

**TechServe Global** is an IT outsourcing firm using **Freshdesk** and **Freshservice** for client support. Agents collaborate on complex tickets but must not paste internal runbook text into public replies. They need **private, per-agent notes** tied to a ticket that survive refresh and reopen—stored in the platform key-value store, not in ticket threads.

## Use Case Scenarios

### 1. Private Agent Notes on High-Volume Tickets

**Scenario**: A single outage ticket stays open for three weeks with 40 agents rotating. Each agent needs personal reminders (escalation contacts, customer mood) without cluttering the public conversation.

**Use Case**: On init, the app reads `loggedInUser.id` and `ticket.id` via `client.data.get`, then builds `noteKey = \`${agentId}:${ticketId}\``. Save uses `client.db.set(noteKey, { notes })`; load on `app.activated` uses `client.db.get(noteKey)`. Only that agent sees their memo when reopening the ticket.

**Platform tie-in:** [Key-value storage](https://developers.freshworks.com/docs/app-sdk/v3.0/common/client/db/) — frontend `client.db` API.

---

### 2. Clearing Notes After Incident Closure

**Scenario**: GDPR and client contracts require deleting internal scratch notes when a ticket is closed and archived.

**Use Case**: **Delete notes** calls `client.db.delete(noteKey)`, clears the textarea, and shows success via `client.interface.trigger('showNotify', ...)`. Agents get explicit feedback; 404 on get is handled as "no notes yet" rather than a hard error.

**Platform tie-in:** Error handling for `err.status === 404` vs development `status === 0` in `loadNotes()`.

---

### 3. Cross-Product Sticky Notes (Freshdesk + Freshservice)

**Scenario**: TechServe uses the same internal playbook app on Freshdesk client tickets and Freshservice internal incidents.

**Use Case**: One unified app at the repo root serves both `support_ticket` and `service_ticket` modules with identical UX and key pattern. One training document covers both products.

**Platform tie-in:** Per-account KV limits apply; keys should stay short and namespaced (`agentId:ticketId`).

---

### 4. Coaching Workflow With Advanced KV Patterns

**Scenario**: Team leads want junior agents to track view counts, tag coaching sessions, and store structured notes without external Redis.

**Use Case**: The **Advanced Storage** tab demonstrates `client.db.update` (increment views, append tags, set status), TTL drafts for ephemeral reminders, and `setIf` for one-time lock creation. Entity store (`ticket_notes` in `config/entities.json`) holds filterable coaching records per ticket and agent.

**Platform tie-in:** [Entity store](https://developers.freshworks.com/docs/app-sdk/v3.0/common/client/db/entity-storage/) for queryable records; KV for lightweight counters.

---

### 5. Serverless KV for Background Jobs

**Scenario**: A nightly job must aggregate visit counts without loading the ticket sidebar.

**Use Case**: `server/server.js` exposes `$db.set`, `$db.get`, `$db.update`, and `$db.delete` via SMI (`serverDbSet`, `serverDbGet`, `serverDbUpdate`, `serverDbDelete`). The Advanced tab invokes them with `client.request.invoke` so developers can compare frontend `client.db` and serverless `$db` side by side.

**Platform tie-in:** [Serverless data store](https://developers.freshworks.com/docs/app-sdk/v3.0/common/serverless-apps/data-store/).

---

### 6. Graceful First-Open Experience

**Scenario**: Thousands of agents install the app; most tickets have no note on first view. The UI must not show scary errors.

**Use Case**: `loadNotes()` treats `404` from `client.db.get` as informational ("You did not save any notes") via `showNotify` type `info`. Unexpected errors surface a single "contact developer" message.

**Platform tie-in:** Production-ready error handling pattern from the original sticky-notes sample.

---

## Mapping to Sample Code

| Action | API | Sample function |
|--------|-----|-----------------|
| Save note | `client.db.set(noteKey, { notes })` | `saveNotes()` |
| Load note | `client.db.get(noteKey)` | `loadNotes()` |
| Remove note | `client.db.delete(noteKey)` | `deleteNotes()` |
| Increment counter | `client.db.update(key, 'increment', { views: 1 })` | `incrementViews()` |
| Append tag | `client.db.update(key, 'append', { tags: [...] })` | `appendTag()` |
| TTL draft | `client.db.set(key, value, { ttl })` | `setWithTtl()` |
| Conditional set | `client.db.set(key, value, { setIf })` | `setIfNotExist()` / `setIfExist()` |
| Entity record | `client.db.entity().get('ticket_notes')` | `saveEntity()` / `loadEntity()` |
| Serverless KV | `$db.*` via SMI | `serverDbSet()` etc. in `server/server.js` |
| Key | `` `${agentId}:${ticketId}` `` | `init()` |
