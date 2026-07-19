# TeamFlow — Database ER Diagram

Shared-database multi-tenancy: every tenant-owned table carries `organizationId`.

```mermaid
erDiagram
    Organization ||--o{ Membership : has
    Organization ||--o{ Project : owns
    Organization ||--o{ Task : owns
    Organization ||--o{ ActivityLog : records

    User ||--o{ Membership : "belongs via"
    User ||--o{ RefreshToken : has
    User ||--o{ Task : "assigned"
    User ||--o{ ActivityLog : "acted"

    Project ||--o{ Task : contains

    Organization {
        string id PK
        string name
        string slug UK
        datetime createdAt
    }
    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string avatarUrl
    }
    Membership {
        string id PK
        enum   role "ADMIN|MEMBER"
        string userId FK
        string organizationId FK
    }
    RefreshToken {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        boolean revoked
    }
    Project {
        string id PK
        string name
        string description
        string organizationId FK
    }
    Task {
        string id PK
        string title
        enum   status "TODO|IN_PROGRESS|DONE"
        enum   priority "LOW|MEDIUM|HIGH"
        datetime dueDate
        string attachmentUrl
        string organizationId FK
        string projectId FK
        string assigneeId FK
    }
    ActivityLog {
        string id PK
        string action
        string entityType
        string entityId
        json   metadata
        string organizationId FK
        string userId FK
    }
```

## Key design decisions

- **`Membership` join table** — a `User` can belong to multiple `Organization`s with a distinct
  role in each. The JWT carries the *active* `organizationId`, so switching orgs = new token.
- **`organizationId` everywhere** — `Project`, `Task`, and `ActivityLog` all denormalize the org id
  so every list/detail query can filter by tenant with a single indexed column (no deep joins).
- **`RefreshToken` in DB** — enables rotation + revocation (true logout), unlike stateless-only JWT.
- **`assigneeId` is nullable** with `onDelete: SetNull` — removing a member doesn't delete their tasks.
- Indexes on `organizationId`, `projectId`, `status`, and `createdAt` back the common filters.
