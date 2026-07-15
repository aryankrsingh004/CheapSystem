/**
 * Blog manifest — the single source of truth for all posts.
 *
 * Publishing workflow:
 *   1. Add a .md file to /public/blog/
 *   2. Add an entry here (slug must match the filename, minus .md)
 *   3. Commit & deploy to Firebase
 */

export interface BlogPost {
  slug: string;          // URL: /blog/<slug>
  title: string;
  description: string;
  date: string;          // ISO date string, e.g. "2024-01-15"
  tags: string[];
  image?: string;        // Optional: path to banner image (served from /public)
  readingTime?: string;  // Optional: shown on list & article header
}

const posts: BlogPost[] = [
  {
    slug: 'kafka',
    title: "Understanding Kafka: A Beginner's Guide",
    description:
      'Learn how Apache Kafka works, why it\'s used for high-throughput messaging, and when to use it in your distributed system architecture.',
    date: '2024-01-15',
    tags: ['kafka', 'messaging', 'distributed-systems', 'streaming'],
    readingTime: '8 min read',
  },
  {
    slug: 'redis',
    title: 'Redis Explained: Caching, Pub/Sub, and Beyond',
    description:
      'A deep dive into Redis — what it is, how caching works, and when to use Redis vs. a traditional database in your system design.',
    date: '2024-02-01',
    tags: ['redis', 'caching', 'databases', 'performance'],
    readingTime: '7 min read',
  },
];

export default posts;
