# ADR: Canonical **Postgres on GCP** (AlloyDB / Cloud SQL + pgvector) as Truth, Optional **Graph Sidecar** Later
**Date:** 2025-10-01 (America/Santiago)  
**Owner:** PAES Learning Platform — “golden-badge” decision

---

## Executive summary

- **Decision:** Use **PostgreSQL on GCP** (AlloyDB or Cloud SQL) as the **single source of truth** for the knowledge graph (KG), item mappings, and **per‑student mastery + spaced repetition**. Enable **pgvector** for semantic retrieval.  
- **Scale path:** If/when you need ultra‑low‑latency multi‑hop traversals or graph algorithms, **project** the KG into a **managed graph DB** (Neo4j Aura on GCP Marketplace) as a **read‑optimized sidecar**. Postgres stays the canonical store.  
- **Why now:** This maximizes editorial ergonomics, analytics, and student‑state modeling, while keeping graph navigation fast enough (CTEs + closure tables). It avoids premature complexity and gives a clean upgrade path.

---

## Context & requirements

- Atomic **Math Academy–style** nodes with typed edges: `PREREQ`, `COREQ`, `ENCOMPASSES`, `DIAGNOSTIC`.  
- **Per‑student** mastery tracking with timestamps for **spaced repetition**, review history, and attempts.  
- **Item-to-node mapping** and coverage analytics.  
- Fast curriculum traversals: “all prerequisites,” “unlocks,” “diagnostic backfill.”  
- **Semantic retrieval** (similar nodes/items, gap discovery).  
- Region: **Santiago (southamerica‑west1)** for low latency.

---

## Alternatives we considered (pros/cons)

### Postgres-only (AlloyDB/Cloud SQL) + pgvector — **Chosen now**
**Pros**
- Managed Postgres on GCP; strong transactions, constraints, migrations, and BI friendliness.  
- **pgvector** for embeddings and similarity. AlloyDB adds **ScaNN** for very fast vector search, with filtering and joins.  
- Recursive CTEs handle depth‑limited traversals well; **closure table** gives instant “all prerequisites/unlocks.”

**Cons**
- Very deep/variable traversals (10+ hops), k‑shortest paths, centrality, etc., are harder purely in SQL.

### Neo4j AuraDB (managed) — **Add later if needed**
**Pros**
- Fully managed on GCP Marketplace; **Cypher**, graph algorithms, sub‑100ms multi‑hop traversals.  
**Cons**
- You’ll still keep a relational layer for authoring/versioning/BI, so it becomes a two‑store design.

### JanusGraph + Bigtable on GKE
**Pros**
- Open‑source stack with Gremlin; scales to very large graphs.  
**Cons**
- Higher ops complexity; overkill for current PAES scope.

### TigerGraph Cloud on GCP
**Pros**
- High‑performance distributed graph with managed offering.  
**Cons**
- Different DSL and ecosystem; likely still pair with relational for authoring/BI.

### ArangoGraph (managed multi‑model)
**Pros**
- One service for documents + graph + search.  
**Cons**
- Smaller ecosystem; SQL still better for analytics/BI.

### Warehouse‑native graph (PuppyGraph over BigQuery/AlloyDB) — **Analytics sidecar**
**Pros**
- Gremlin/openCypher directly over warehouse/AlloyDB without ETL; great for dashboards/experiments.  
**Cons**
- Not your OLTP app database for student flows.

### MongoDB `$graphLookup`
**Pros**
- Can do recursive lookups.  
**Cons**
- Not a property‑graph engine; weaker for multi‑hop algorithms and BI joins.

### RedisGraph
**Cons**
- End‑of‑life; not a safe foundation.

---

## Implementation blueprint (copy‑paste)

### 1) Postgres (AlloyDB/Cloud SQL) schema — canonical source of truth

```sql
-- SUBJECTS
create table subject (
  id uuid primary key,
  key text unique not null,       -- "math", "science", ...
  name text not null
);

-- NODES (atomic skills)
create table node (
  id uuid primary key,
  subject_id uuid references subject(id),
  slug text unique not null,      -- "ALG.LIN_SLOPE_TWO_POINTS"
  name text not null,
  description text,
  axis text,
  concept text,
  representation text,            -- symbolic | graphical | tabular | contextual
  task text,
  exam_level text[] not null,     -- ["M1"], ["M2"], etc.
  skills text[] not null,         -- ["Resolver","Modelar","Representar","Argumentar"]
  version integer not null default 1,
  embedding vector(1536)          -- pgvector
);

-- EDGES (typed)
create type edge_type as enum ('PREREQ','COREQ','ENCOMPASSES','DIAGNOSTIC');
create table edge (
  src uuid references node(id),
  dst uuid references node(id),
  type edge_type not null,
  primary key (src, dst, type)
);
create index on edge (src);
create index on edge (dst);
create index on edge (src, type);
create index on edge (dst, type);

-- PROVENANCE
create table node_source_ref (
  node_id uuid references node(id),
  source text,
  locator text,
  primary key (node_id, source, locator)
);

-- ITEMS & MAPPING
create table item (
  id uuid primary key,
  source text,                    -- "DEMRE 2023 M2 Q14"
  difficulty real,
  metadata jsonb
);
create table item_node_map (
  item_id uuid references item(id),
  node_id uuid references node(id),
  primary key (item_id, node_id)
);

-- REACHABILITY (closure table) -- built on publish
create table reachability (
  src uuid references node(id),
  dst uuid references node(id),
  hops smallint not null,
  primary key (src, dst)
);
```

### 2) Per‑student mastery, spaced repetition, attempts

```sql
-- STUDENTS
create table student (
  id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);

-- STATE per (student, node, graph version)
create type mastery_state as enum ('NOT_STARTED','LEARNING','MASTERED','RELEARNING','SUSPENDED');

create table student_node_state (
  student_id uuid references student(id),
  node_id    uuid references node(id),
  graph_version integer not null default 1,

  state mastery_state not null default 'NOT_STARTED',

  -- SM-2 / FSRS / BKT-friendly fields
  mastery_prob real not null default 0.0,  -- for BKT/PFA
  repetitions integer not null default 0,  -- SM-2/FSRS
  ease_factor real not null default 2.5,   -- SM-2
  stability real,                          -- FSRS
  difficulty real,                         -- FSRS
  lapses integer not null default 0,

  last_seen_at timestamptz,
  next_review_at timestamptz,
  last_interval_days real,
  total_reviews integer not null default 0,

  primary key (student_id, node_id, graph_version)
);
create index on student_node_state (student_id, next_review_at);
create index on student_node_state (student_id, state);

-- REVIEW LOG (immutable)
create type review_outcome as enum ('CORRECT','INCORRECT','HARD','EASY','SKIPPED');

create table review_log (
  id bigserial primary key,
  student_id uuid references student(id),
  node_id    uuid references node(id),
  occurred_at timestamptz not null default now(),
  outcome review_outcome not null,
  response_ms integer,
  prev_interval_days real,
  new_interval_days  real,
  prev_recall_prob real,
  new_recall_prob  real,
  metadata jsonb
);

-- ITEM ATTEMPTS
create table attempt (
  id bigserial primary key,
  student_id uuid references student(id),
  item_id uuid references item(id),
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  correct boolean,
  score real,
  response_ms integer,
  hints_used smallint default 0,
  metadata jsonb
);
create index on attempt (student_id, started_at desc);
```

### 3) Traversals in SQL

**Depth‑limited prereqs (recursive CTE; cap depth 6–8)**
```sql
WITH RECURSIVE prereqs AS (
  SELECT e.src AS node_id, e.dst AS target, 1 AS depth
  FROM edge e
  WHERE e.dst = $1 AND e.type = 'PREREQ'
  UNION ALL
  SELECT e.src, p.target, p.depth+1
  FROM edge e
  JOIN prereqs p ON e.dst = p.node_id
  WHERE e.type = 'PREREQ' AND p.depth < 8
)
SELECT node_id, depth FROM prereqs;
```

**Instant prereqs/unlocks (closure table)**
```sql
-- all prerequisites of :target
SELECT src AS prereq, hops
FROM reachability
WHERE dst = :target
ORDER BY hops ASC;
```

### 4) Spaced repetition (SM‑2/FSRS‑lite)

```sql
-- Pseudocode (run in app or SQL proc)
-- Inputs: grade g in {1..4}, EF (ease_factor), R (repetitions), I (last interval days)
if g < 3 then
  R = 0; I = 1;
else
  if R = 0 then I = 1;
  elsif R = 1 then I = 6;
  else I = round(I * EF);
  R = R + 1;
end if;
EF = greatest(1.3, EF + (0.1 - (4-g)*(0.08 + (4-g)*0.02)));
next_review_at = now() + (I || ' days')::interval;
```

You can later switch to **FSRS** (stability/difficulty) or add **BKT/PFA** mastery probability without changing tables.

### 5) “What should this student do next?”

**Due reviews**
```sql
SELECT n.slug, sns.next_review_at
FROM student_node_state sns
JOIN node n ON n.id = sns.node_id
WHERE sns.student_id = $1
  AND sns.state IN ('LEARNING','MASTERED','RELEARNING')
  AND sns.next_review_at <= now()
ORDER BY sns.next_review_at ASC
LIMIT 50;
```

**Eligible new nodes (all PREREQs mastered)**
```sql
WITH prereqs AS (
  SELECT r.src AS prereq, r.dst AS target
  FROM reachability r
  JOIN edge e ON e.src = r.src AND e.dst = r.dst AND e.type = 'PREREQ'
),
missing AS (
  SELECT p.target
  FROM prereqs p
  LEFT JOIN student_node_state s
    ON s.student_id = $1 AND s.node_id = p.prereq AND s.state = 'MASTERED'
  WHERE s.node_id IS NULL
)
SELECT n.*
FROM node n
LEFT JOIN student_node_state sns ON sns.student_id = $1 AND sns.node_id = n.id
WHERE sns.node_id IS NULL
  AND n.id NOT IN (SELECT target FROM missing)
LIMIT 50;
```

### 6) Semantic retrieval (in the DB)

- Store embeddings on `node.embedding` and/or `item.embedding` (pgvector).  
- On AlloyDB, use **ScaNN** for k‑NN with SQL filters and joins (“nearest neighbors within M2 geometry”).

### 7) Versioning the KG safely

- Add `graph_version` to `node`, `edge`, and to `student_node_state`.  
- On publish: rebuild `reachability`; create new student state rows only where topology changed, migrating mastery when safe.  
- Queries always filter by active `graph_version`.

### 8) Observability

- Every review goes to `review_log`.  
- Ship DB metrics to Cloud Monitoring; keep read replicas/pools for traversal/SRS queries.  
- Cache hot results in Redis keyed by `(student_id, graph_version)`.

---

## When/How to add a graph sidecar (only if needed)

**Trigger conditions**
- Routine **>8–10 hop** variable‑depth traversals at interactive latency.  
- Online graph algorithms (k‑shortest paths, centrality).  
- Graph size beyond ~300k nodes / 5–10M edges with strict sub‑100ms SLAs.

**Sidecar**
- **Neo4j AuraDB** on GCP Marketplace; keep Postgres as system of record.  
- Project changes via **Pub/Sub → Cloud Run**: upsert vertices/edges (Cypher `MERGE`).

**Cypher upsert sketch**
```cypher
UNWIND $nodes AS n
MERGE (x:Node {slug:n.slug})
SET x += n.props;

UNWIND $edges AS e
MATCH (a:Node {slug:e.src_slug})
MATCH (b:Node {slug:e.dst_slug})
MERGE (a)-[:PREREQ]->(b);
```

---

## Risks & mitigations

- **Graph complexity grows** → add Neo4j Aura as read projection.  
- **Vector search scale/perf** → use AlloyDB’s ScaNN and filtered vector queries; shard embeddings if needed.  
- **Authoring errors (cycles)** → enforce acyclicity for `PREREQ` in CMS validation.  
- **Hot paths under load** → closure table + Redis caching; read replicas.

---

## Acceptance criteria

- Schema deployed; **pgvector** enabled; embeddings indexed.  
- `reachability` built on publish; recursive CTE endpoints under 50–100 ms for depth ≤ 6 at target scale.  
- `student_node_state` reliably updates `next_review_at` on each review; `review_log` persists intervals/probabilities.  
- “Due reviews” and “eligible next nodes” APIs produce stable queues under load.  
- BigQuery wired for dashboards (mastery distribution, leakage, time‑to‑mastery).  
- Canary with ~50k nodes / 1M edges meets SLOs; caching strategy documented.  
- Runbook to enable Neo4j projection if traversal SLOs are breached.

---

## Bottom line

Start with **Postgres on GCP** (AlloyDB/Cloud SQL + pgvector) as the canonical store. It fits editorial needs, per‑student mastery + SRS, and typical graph traversals. If you later hit truly “graph‑hard” workloads, turn on a managed **Neo4j** sidecar—no re‑platforming required.
