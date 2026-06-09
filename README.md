# TechServe Data Storage

Platform 3.0 sample for **Freshdesk** and **Freshservice** ticket sidebars. Demonstrates frontend key-value storage, entity store (Custom Objects), and serverless `$db` APIs for TechServe Global's agent sticky notes and advanced storage patterns.

**Platform:** 3.0 · **FDK:** 10.1.2 · **Node:** 24.11.0 · **UI:** Crayons v4

---

## Features

| Tab | APIs demonstrated |
|-----|-------------------|
| **Notes** | `client.db.set`, `client.db.get`, `client.db.delete`, composite keys (`agentId:ticketId`), `showNotify` |
| **Advanced Storage** | `client.db.update` (increment/append/set), `client.db.set` with `ttl` and `setIf`, `client.db.entity`, SMI `$db.set/get/update/delete` |

### Notes tab

Private per-agent sticky notes on the current ticket. Keys use `agentId:ticketId`. Loads on `app.activated`; handles `404` gracefully on first open.

### Advanced Storage tab

- **Update** — increment a view counter, append tags, set a status field on one KV record
- **TTL** — store an ephemeral draft with a configurable expiry
- **setIf** — conditional create (`not_exist`) and update (`exist`) patterns
- **Entity store** — `ticket_notes` schema in `config/entities.json`; create/load coaching records
- **Serverless** — same KV operations from `server/server.js` via `client.request.invoke`

---

## Architecture

```
Ticket sidebar (Freshdesk + Freshservice)
  └── views/ticket-sidebar.html
        ├── Notes tab          → client.db (sticky notes)
        └── Advanced tab       → client.db.update / ttl / setIf / entity
                                 → client.request.invoke → server/server.js ($db.*)
```

---

## Products & modules

| Module | Product | Location |
|--------|---------|----------|
| `support_ticket` | Freshdesk | `ticket_sidebar` |
| `service_ticket` | Freshservice | `ticket_sidebar` |

---

## Setup

```sh
git clone https://github.com/freshworks-developers/data-storage-samples.git
cd data-storage-samples
fdk run
```

Open a ticket in Freshdesk or Freshservice with `?dev=true` in the URL. Use the **Notes** tab for sticky notes; use **Advanced Storage** for KV update, TTL, setIf, entity, and serverless demos.

```sh
fdk validate
fdk pack
```

---

## Project structure

```
.
├── manifest.json
├── config/
│   ├── entities.json       # ticket_notes entity schema
│   └── iparams.json
├── app/
│   ├── views/ticket-sidebar.html
│   ├── scripts/ticket-sidebar.js
│   └── styles/
├── server/server.js          # $db.* handlers
├── README.md
└── USECASE.md
```

---

## Tech stack

- **Platform:** Freshworks Platform 3.0
- **Runtime:** Node.js 24.11.0 · FDK 10.1.2
- **Storage:** `client.db` key-value + entity store; serverless `$db`
- **UI:** Crayons v4

---

## Resources

- [Key-value storage](https://developers.freshworks.com/docs/app-sdk/v3.0/common/client/db/)
- [Entity store](https://developers.freshworks.com/docs/app-sdk/v3.0/common/client/db/entity-storage/)
- [Serverless data store](https://developers.freshworks.com/docs/app-sdk/v3.0/common/serverless-apps/data-store/)
- [USECASE.md](./USECASE.md)
