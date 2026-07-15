---
title: "Redis Explained: Caching, Pub/Sub, and Beyond"
description: "A deep dive into Redis — what it is, how caching works, and when to use Redis vs. a traditional database in your system design."
date: "2024-02-01"
tags: ["redis", "caching", "databases", "performance"]
image: "/blog/images/redis-banner.png"
---

# Redis Explained: Caching, Pub/Sub, and Beyond

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store. It is one of the most widely used tools in backend engineering — appearing in the stacks of Twitter, GitHub, Snapchat, and countless others.

## Why In-Memory?

Traditional databases persist data to disk. Redis keeps everything **in RAM** — making reads and writes orders of magnitude faster.

| Store | Typical Read Latency |
|---|---|
| PostgreSQL (disk) | ~1–10 ms |
| Redis (in-memory) | ~0.1–1 ms |
| L1 CPU Cache | ~1 ns |

The trade-off: RAM is expensive and volatile. Redis offers **optional persistence** to recover data after restarts.

## Redis as a Cache

The most common use of Redis is as a **read-through cache** in front of a slower database.

### How Cache-Aside Works

```
1. App checks Redis for key
2. Cache HIT → return value immediately
3. Cache MISS → query PostgreSQL, store result in Redis, return value
```

The **hit ratio** is critical. A 90% hit ratio means only 10% of requests reach the database — reducing load by 10×.

### Cache Eviction Policies

When Redis runs out of memory, it must evict keys. Common policies:

- `allkeys-lru` — Evict the least recently used key (most common for caching)
- `volatile-ttl` — Evict keys with the shortest TTL
- `noeviction` — Reject new writes (useful for message queues)

### TTL (Time-to-Live)

Always set a TTL on cached values to prevent stale data from living forever:

```
SET user:123 "{name: Alice}" EX 3600  # Expire in 1 hour
```

## Redis Data Structures

Redis isn't just a simple key-value store. It supports rich data types:

| Type | Use Case | Example |
|---|---|---|
| String | Session tokens, counters | `SET session:abc "user:42"` |
| Hash | User profiles | `HSET user:42 name "Alice" age 30` |
| List | Activity feeds, queues | `LPUSH notifications "message"` |
| Set | Unique visitors, tags | `SADD page:views userId` |
| Sorted Set | Leaderboards, rate limiting | `ZADD scores 100 "alice"` |
| Stream | Event log (like Kafka) | `XADD events * type click` |

## Redis Pub/Sub

Redis also supports a basic **publish/subscribe** messaging pattern:

```
Publisher → [Redis Channel: notifications] → Subscriber A
                                           → Subscriber B
```

Unlike Kafka, Redis Pub/Sub has **no message persistence** — if a subscriber is offline, it misses the message. Use it for ephemeral notifications (e.g., live chat, real-time dashboard updates).

## Redis vs. Kafka

| Feature | Redis | Kafka |
|---|---|---|
| Persistence | Optional (RDB/AOF) | Always (replicated log) |
| Message Replay | ❌ (Pub/Sub) / ✅ (Streams) | ✅ |
| Throughput | High | Very High |
| Latency | Sub-millisecond | Low ms |
| Best for | Caching, sessions, leaderboards | Event streaming, audit logs |

## Redis in System Design

**Session Store:** Instead of storing sessions in your database, store them in Redis with a TTL. Every app server can access the session without a DB hit.

**Rate Limiter:** Use a Redis sorted set or counter with TTL to track request counts per user:

```
1. INCR rate:user:42
2. If count > 100, reject request
3. Key expires after 1 minute
```

**Distributed Lock:** Use `SET key value NX PX 30000` (set only if not exists, expire in 30s) to implement distributed locks across multiple servers.

## Try It in CheapSystem

Model a Redis caching layer with the **Cache** node in CheapSystem:

1. Place an `App Server` → `Cache` → `Database` chain
2. Set the Cache **Hit Ratio** to `0.85` (85% of reads served from cache)
3. Run the simulation — the Database node receives only 15% of the original QPS

Notice how dramatically this reduces database load. A single Cache node with a good hit ratio can allow a modest database instance to serve massive traffic.

---

*Further reading: [Redis documentation](https://redis.io/docs/), [Redis University (free)](https://university.redis.com/)*
