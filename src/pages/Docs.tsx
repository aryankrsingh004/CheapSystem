import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Monitor,
  Clock,
  Shuffle,
  Shield,
  Server,
  Zap,
  Globe,
  Database,
  HardDrive,
  Layers,
  ExternalLink,
  ChevronRight,
  MousePointerClick,
  Plug,
  Settings2,
  Play,
  AlertTriangle,
  TrendingUp,
  BookMarked,
  Boxes
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavSection {
  label: string;
  id: string;
  children?: { label: string; id: string }[];
}

interface ComponentDoc {
  name: string;
  icon: React.ElementType;
  color: string;
  category: string;
  tagline: string;
  description: string;
  parameters: { name: string; type: string; desc: string }[];
  tips?: string[];
}

// ─── Navigation Structure ────────────────────────────────────────────────────

const NAV: NavSection[] = [
  {
    label: 'Introduction',
    id: 'intro',
    children: [
      { label: 'What is CheapSystem?', id: 'what-is' },
      { label: 'Core Concepts', id: 'core-concepts' },
    ]
  },
  {
    label: 'Using the Simulator',
    id: 'using',
    children: [
      { label: 'Building a Diagram', id: 'building' },
      { label: 'Draw vs. Simulate', id: 'modes' },
      { label: 'Connections & Traffic', id: 'connections' },
      { label: 'Capacity & Failures', id: 'capacity' },
    ]
  },
  {
    label: 'Design Patterns',
    id: 'patterns',
    children: [
      { label: 'Horizontal Scaling', id: 'p-scaling' },
      { label: 'Caching Reads', id: 'p-caching' },
      { label: 'Database Sharding', id: 'p-sharding' },
      { label: 'Async Queue Buffering', id: 'p-queues' },
      { label: 'CDN Edge Delivery', id: 'p-cdn' },
    ]
  },
  {
    label: 'Component Reference',
    id: 'components',
    children: [
      { label: 'Client', id: 'c-client' },
      { label: 'Cron Job', id: 'c-cron' },
      { label: 'Load Balancer', id: 'c-lb' },
      { label: 'API Gateway', id: 'c-gateway' },
      { label: 'App Server', id: 'c-server' },
      { label: 'Cache', id: 'c-cache' },
      { label: 'CDN', id: 'c-cdn' },
      { label: 'Database', id: 'c-database' },
      { label: 'Object Storage', id: 'c-storage' },
      { label: 'Async Node', id: 'c-async' },
    ]
  },
  {
    label: 'Saving & Importing',
    id: 'persistence',
  },
  {
    label: 'Further Reading',
    id: 'references',
  },
];

// ─── Component Reference Data ─────────────────────────────────────────────────

const COMPONENTS: ComponentDoc[] = [
  {
    name: 'Client',
    icon: Monitor,
    color: '#38bdf8',
    category: 'Traffic Source',
    tagline: 'Simulates end-user request traffic.',
    description:
      'Represents a pool of users or services sending outbound HTTP requests into your system. Total generated QPS scales linearly with the number of replicas.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Requests generated per second from a single client instance.' },
      { name: 'Replicas', type: 'number', desc: 'Number of simultaneous client instances. Total load = QPS × Replicas.' },
    ],
    tips: ['Use multiple clients to simulate different user cohorts or geographic regions.'],
  },
  {
    name: 'Cron Job',
    icon: Clock,
    color: '#a78bfa',
    category: 'Traffic Source',
    tagline: 'Periodic background job with burst traffic.',
    description:
      'Emulates a scheduled background task that fires in short bursts. Alternates between 1 s active (sending at full QPS) and 1 s idle — ideal for stress-testing queue and buffer components.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Peak request rate during the active phase.' },
    ],
    tips: ['Pair with an Async Node to absorb burst spikes without overloading downstream services.'],
  },
  {
    name: 'Load Balancer',
    icon: Shuffle,
    color: '#fb923c',
    category: 'Router',
    tagline: 'Evenly distributes traffic across replicas.',
    description:
      'Implements a round-robin forwarding strategy, splitting incoming QPS equally across all outbound edges. Used to horizontally scale stateless application tiers.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Maximum throughput capacity before traffic is throttled and dropped.' },
    ],
    tips: [
      'Connect multiple App Servers downstream to achieve horizontal scaling.',
      'Chain multiple LBs to represent geographic or service-level routing layers.',
    ],
  },
  {
    name: 'API Gateway',
    icon: Shield,
    color: '#818cf8',
    category: 'Router',
    tagline: 'Single front-door for all API traffic.',
    description:
      'Acts as the entry point for all external requests, providing authentication, rate limiting, and routing logic before dispatching to internal microservices.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Per-replica throughput limit.' },
      { name: 'Replicas', type: 'number', desc: 'Horizontal scale factor. Total capacity = QPS × Replicas.' },
    ],
    tips: ['Place before Load Balancers in web-facing architectures to represent an edge routing layer (e.g. Kong, AWS API Gateway).'],
  },
  {
    name: 'App Server',
    icon: Server,
    color: '#34d399',
    category: 'Compute',
    tagline: 'Stateless application processing unit.',
    description:
      'Handles business logic (authentication, validation, computation) and interfaces with caching/database layers. Can be scaled horizontally with replicas.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Maximum requests a single server handles per second.' },
      { name: 'Replicas', type: 'number', desc: 'Total servers in the pool. Capacity = QPS × Replicas.' },
    ],
    tips: ['Keep App Servers stateless — session data should live in Cache/DB, not the server itself.'],
  },
  {
    name: 'Cache',
    icon: Zap,
    color: '#e879f9',
    category: 'Storage',
    tagline: 'In-memory read acceleration.',
    description:
      'Intercepts read requests and returns results from fast in-memory storage. Only cache misses are forwarded to the downstream database, dramatically reducing DB load on read-heavy workloads.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Maximum read operations the cache can serve per second.' },
      { name: 'Cache Hit Ratio', type: 'percentage', desc: 'Fraction of reads served from cache. Misses = 1 - Hit Ratio.' },
    ],
    tips: [
      'A hit ratio of 80%+ is typical for most production caches.',
      'High-traffic read paths benefit enormously — a 90% hit rate reduces DB load by 10×.',
    ],
  },
  {
    name: 'CDN',
    icon: Globe,
    color: '#22d3ee',
    category: 'Edge Layer',
    tagline: 'Serves static content from edge locations.',
    description:
      'Caches and delivers static assets (HTML, JS, images, video) from PoPs (Points of Presence) close to end users. The traffic reduction factor determines how much load never reaches the origin.',
    parameters: [
      { name: 'Traffic Reduction', type: 'percentage', desc: 'Percentage of requests fully absorbed at the edge. The remainder passes to origin.' },
    ],
    tips: [
      '90% is a realistic reduction rate for media-heavy sites.',
      'Place CDN at the very front of the diagram, between Clients and API Gateway.',
    ],
  },
  {
    name: 'Database',
    icon: Database,
    color: '#fbbf24',
    category: 'Storage',
    tagline: 'Persistent relational or document store.',
    description:
      'Terminal data store that handles read and write queries. Can be scaled via horizontal sharding — each shard doubles capacity. Represents systems like PostgreSQL, MySQL, MongoDB, or DynamoDB.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Maximum queries per second for a single shard.' },
      { name: 'Shards', type: 'number (2ⁿ)', desc: 'Number of database partitions. Scales exponentially: 1, 2, 4, 8, …' },
    ],
    tips: [
      'Always place a Cache upstream to reduce read QPS reaching the DB.',
      'Sharding works best for write-heavy workloads where read replicas don\'t help enough.',
    ],
  },
  {
    name: 'Object Storage',
    icon: HardDrive,
    color: '#f59e0b',
    category: 'Storage',
    tagline: 'Scalable blob storage for unstructured data.',
    description:
      'Infinitely scalable flat storage for binary objects — images, videos, backups, ML datasets. Represents services like AWS S3, Google Cloud Storage, or Azure Blob Storage.',
    parameters: [
      { name: 'QPS Limit', type: 'number', desc: 'Maximum concurrent API read/write operations.' },
    ],
    tips: ['Pair with a CDN node upstream to offload read-heavy media delivery.'],
  },
  {
    name: 'Async Node',
    icon: Layers,
    color: '#06b6d4',
    category: 'Buffer',
    tagline: 'Decoupled message queue for load leveling.',
    description:
      'Buffers incoming requests in a queue, then drains them at a controlled rate downstream. Prevents cascading failures during traffic spikes and decouples producers from consumers. Represents Kafka, RabbitMQ, SQS, etc.',
    parameters: [
      { name: 'Max Outflow Rate', type: 'number (QPS)', desc: 'Maximum rate at which messages are consumed and forwarded downstream.' },
    ],
    tips: [
      'Queue depth grows when inflow > outflow. Monitor for unbounded queue growth.',
      'Ideal behind Cron Jobs or spike-heavy clients to protect backend servers.',
    ],
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color + '40', background: color + '12' }}
    >
      {children}
    </span>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const map = {
    tip:     { border: 'border-emerald-500/20', bg: 'bg-emerald-950/10', text: 'text-emerald-400', label: 'Tip' },
    warning: { border: 'border-amber-500/20',   bg: 'bg-amber-950/10',   text: 'text-amber-400',   label: 'Note' },
    info:    { border: 'border-sky-500/20',      bg: 'bg-sky-950/10',     text: 'text-sky-400',     label: 'Info' },
  };
  const s = map[type];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 text-xs leading-relaxed`}>
      <span className={`font-bold uppercase tracking-wider text-[10px] ${s.text} block mb-1.5`}>{s.label}</span>
      <span className="text-slate-300">{children}</span>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="block bg-[#07080a] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-sky-400 leading-relaxed whitespace-pre-wrap">
      {children}
    </code>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 text-2xl font-black text-white tracking-tight border-b border-white/5 pb-2.5 mb-4">{children}</h2>
  );
}

function SubTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-20 text-sm font-bold text-slate-200 mt-6 mb-3 flex items-center gap-2">{children}</h3>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Docs() {
  const [activeId, setActiveId] = useState('what-is');

  const scrollTo = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#08090c] text-slate-300 antialiased font-sans scroll-smooth scrollbar-thin scrollbar-thumb-white/10">

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090c]/80 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <span className="text-[11px] font-black text-sky-400">CS</span>
            </div>
            <span className="text-xs font-black tracking-widest text-white uppercase">CheapSystem</span>
            <ChevronRight size={10} className="text-slate-600" />
            <span className="text-xs text-slate-400 font-medium select-none">Docs</span>
          </div>

          <Link href="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/10 rounded-xl px-3.5 h-8 bg-white/[0.02] hover:bg-white/[0.05] active:scale-95 duration-200">
            <ArrowLeft size={12} className="text-sky-400" />
            <span>Back to Simulator</span>
          </Link>
        </div>
      </header>

      {/* ── Layout Wrapper ─────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto flex min-h-[calc(100vh-3.5rem)]">

        {/* Left Sidebar (Sticky Navigation) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/5 py-8 pr-4 pl-6 gap-5 scrollbar-none">
          {NAV.map((section) => (
            <div key={section.id} className="space-y-1.5">
              <button
                onClick={() => scrollTo(section.id)}
                className={`w-full text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeId === section.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {section.label}
              </button>
              {section.children && (
                <div className="flex flex-col gap-1 border-l border-white/5 ml-1">
                  {section.children.map((child) => {
                    const isChildActive = activeId === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => scrollTo(child.id)}
                        className={`w-full text-left text-xs py-1.5 pl-3 border-l -ml-[1px] transition-all duration-200 relative ${
                          isChildActive
                            ? 'border-sky-500 text-sky-400 font-semibold bg-sky-500/[0.02]'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20 hover:translate-x-0.5'
                        }`}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Center Column: Scrollable Content */}
        <main className="flex-1 min-w-0 px-8 xl:px-16 py-10 pb-32 max-w-3xl space-y-20">

          {/* ── Section: Introduction ─────────────────────────────────── */}
          <section className="space-y-4">
            <div id="intro" className="scroll-mt-20">
              <div className="flex items-center gap-2 mb-3">
                <BookMarked size={14} className="text-sky-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Introduction</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-3">CheapSystem Documentation</h1>
              <p className="text-slate-400 leading-relaxed text-sm">
                CheapSystem is a browser-based system design simulator for engineers to visually construct, annotate, and stress-test distributed architectures. No backend required — everything runs locally in your browser.
              </p>
            </div>

            <SubTitle id="what-is">What is CheapSystem?</SubTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              Think of it as an interactive whiteboard that is <em>aware of capacity math</em>. You drag infrastructure components onto a canvas, wire them together with directed edges, and optionally fire a real-time simulation loop that calculates how many queries per second (QPS) are absorbed, passed, queued, or dropped by each node — giving you instant feedback on whether your architecture can handle the expected load.
            </p>

            <SubTitle id="core-concepts">Core Concepts</SubTitle>
            <div className="grid sm:grid-cols-2 gap-3.5 text-xs">
              {[
                { icon: Boxes, label: 'Nodes', desc: 'Infrastructure components placed on the canvas (servers, databases, caches, etc.).' },
                { icon: Plug, label: 'Edges', desc: 'Directed connections representing the flow of requests from one component to another.' },
                { icon: TrendingUp, label: 'QPS', desc: 'Queries Per Second — the primary traffic unit used to measure system load.' },
                { icon: AlertTriangle, label: 'Overload', desc: 'When incoming QPS exceeds a node\'s capacity, it enters failure mode and drops excess requests.' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all duration-300 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-sky-400" />
                    <span className="font-semibold text-white">{label}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section: Using the Simulator ─────────────────────────── */}
          <section className="space-y-4 border-t border-white/5 pt-10">
            <div className="flex items-center gap-2 mb-1">
              <Play size={14} className="text-sky-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Using the Simulator</span>
            </div>

            <SectionTitle id="using">Getting Started</SectionTitle>

            <SubTitle id="building">Building a Diagram</SubTitle>
            <div className="space-y-3 text-xs text-slate-400">
              <p>Follow these three steps to build your first architecture:</p>
              <ol className="space-y-4 list-none">
                {[
                  {
                    step: '01',
                    icon: MousePointerClick,
                    heading: 'Add components',
                    body: 'Open the component palette on the left edge of the canvas. Drag a node (e.g. Client, App Server) and drop it anywhere on the canvas grid.',
                  },
                  {
                    step: '02',
                    icon: Plug,
                    heading: 'Wire connections',
                    body: 'Hover over any component to reveal its connection handles. Drag from the right-side output handle of a source node to the left-side input handle of a destination node to create a directed edge.',
                  },
                  {
                    step: '03',
                    icon: Settings2,
                    heading: 'Configure parameters',
                    body: 'Click on any placed node to open the configuration panel on the right side of the screen. Adjust QPS limits, replicas, hit ratios, and other node-specific settings.',
                  },
                ].map(({ step, icon: Icon, heading, body }) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-sky-500/50 font-mono">{step}</span>
                      <div className="w-px h-full bg-white/5" />
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={13} className="text-sky-400" />
                        <span className="font-semibold text-white text-xs">{heading}</span>
                      </div>
                      <p className="leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <SubTitle id="modes">Draw vs. Simulate Mode</SubTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toggle between the two modes using the toolbar at the top-center of the canvas:
            </p>
            <div className="grid sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  <span className="font-semibold text-white">Draw Mode</span>
                </div>
                <p className="text-slate-400 leading-relaxed">For layout and annotation. Move nodes, add labels, draw grouping frames, write text annotations. All computations are paused — no QPS is flowing.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                  <span className="font-semibold text-white">Simulate Mode</span>
                </div>
                <p className="text-slate-400 leading-relaxed">Activates the real-time traffic engine. QPS values are computed each tick, animated as flowing particles, and displayed as live metrics on each node and edge.</p>
              </div>
            </div>

            <SubTitle id="connections">How Traffic Flows</SubTitle>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p>Traffic flows left-to-right along edges, following these rules:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Each edge carries a fraction of the source node's outgoing QPS.</li>
                <li>When a node has <strong className="text-white">multiple outbound edges</strong>, traffic is split equally by default (e.g. a load balancer with 3 downstream servers each receives ⅓ of the load).</li>
                <li>Nodes like <strong className="text-white">Cache</strong> and <strong className="text-white">CDN</strong> consume a portion of traffic and forward only the remainder.</li>
                <li>The <strong className="text-white">Async Node</strong> buffers incoming traffic and drains at a fixed outflow rate.</li>
              </ul>
            </div>

            <SubTitle id="capacity">Capacity Limits & Overload Behavior</SubTitle>
            <div className="space-y-3 text-xs text-slate-400">
              <p>Every computational node has a maximum throughput defined as:</p>
              <CodeBlock>Total Capacity = QPS Limit × Replicas</CodeBlock>
              <Callout type="warning">
                When incoming QPS exceeds a node's total capacity, it enters <strong>overload</strong> state. The node glows red in the simulation view and the excess requests are counted as <strong>dropped traffic</strong>. This models a real service under denial-of-service conditions or under-provisioning.
              </Callout>
              <p>Common mitigation strategies:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Increase <strong className="text-white">Replicas</strong> to scale the node horizontally.</li>
                <li>Add an <strong className="text-white">Async Node</strong> upstream to buffer and rate-limit inflow.</li>
                <li>Insert a <strong className="text-white">Cache</strong> to absorb read load before it reaches the database.</li>
                <li>Deploy a <strong className="text-white">CDN</strong> to absorb edge-cacheable traffic before origin.</li>
              </ul>
            </div>
          </section>

          {/* ── Section: Design Patterns ──────────────────────────────── */}
          <section className="space-y-6 border-t border-white/5 pt-10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-sky-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Design Patterns</span>
            </div>
            <SectionTitle id="patterns">Common Architecture Patterns</SectionTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              The following patterns represent industry-standard approaches to scaling, reliability, and performance. Each can be modeled directly in CheapSystem.
            </p>

            {/* Pattern: Horizontal Scaling */}
            <div id="p-scaling" className="scroll-mt-20 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 p-5 space-y-2.5 text-xs transition-all duration-300">
              <div className="flex items-center gap-2">
                <Shuffle size={14} className="text-orange-400" />
                <span className="font-bold text-white text-sm">Horizontal Scaling</span>
                <Tag color="#fb923c">Reliability</Tag>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Add more server replicas to handle increased load instead of making a single machine larger (vertical scaling). In CheapSystem, increase the <strong>Replicas</strong> slider on any App Server or API Gateway node.
              </p>
              <div className="text-slate-500 border-t border-white/5 pt-2.5 font-medium">
                <strong className="text-slate-400">Canvas recipe:</strong>{' '}
                Client → Load Balancer → [App Server ×N]
              </div>
            </div>

            {/* Pattern: Caching */}
            <div id="p-caching" className="scroll-mt-20 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 p-5 space-y-2.5 text-xs transition-all duration-300">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-pink-400" />
                <span className="font-bold text-white text-sm">Caching Reads</span>
                <Tag color="#e879f9">Performance</Tag>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Place an in-memory cache (Redis, Memcached) between application servers and the database. A hit-ratio of 80% means 80% of reads are served by memory — only 20% hit the slower persistent store.
              </p>
              <CodeBlock>
                {`DB load = Incoming QPS × (1 - Hit Ratio)\nExample: 10,000 QPS × (1 - 0.80) = 2,000 QPS reaches DB`}
              </CodeBlock>
              <div className="text-slate-500 border-t border-white/5 pt-2.5 font-medium">
                <strong className="text-slate-400">Canvas recipe:</strong>{' '}
                App Server → Cache (80% hit) → Database
              </div>
            </div>

            {/* Pattern: Sharding */}
            <div id="p-sharding" className="scroll-mt-20 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 p-5 space-y-2.5 text-xs transition-all duration-300">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-amber-400" />
                <span className="font-bold text-white text-sm">Database Sharding</span>
                <Tag color="#fbbf24">Scalability</Tag>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Partition data across multiple independent database nodes to multiply total write throughput. Each shard handles a segment of the keyspace. CheapSystem models this with exponential (2ⁿ) shard scaling on the Database node.
              </p>
              <CodeBlock>
                {`Total DB Capacity = QPS Limit × 2^n\n1 shard → 2,000 QPS\n2 shards → 4,000 QPS\n4 shards → 8,000 QPS`}
              </CodeBlock>
            </div>

            {/* Pattern: Queues */}
            <div id="p-queues" className="scroll-mt-20 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 p-5 space-y-2.5 text-xs transition-all duration-300">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" />
                <span className="font-bold text-white text-sm">Async Queue Buffering</span>
                <Tag color="#06b6d4">Resilience</Tag>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Insert a message queue (Kafka, SQS, RabbitMQ) between producer and consumer to decouple their lifecycles. During a spike, the queue absorbs excess messages and releases them to workers at a controlled rate, preventing cascading failures.
              </p>
              <Callout type="tip">
                When inflow consistently exceeds outflow, the queue grows unboundedly. Set an outflow rate slightly above your average expected throughput, and monitor queue depth.
              </Callout>
              <div className="text-slate-500 border-t border-white/5 pt-2.5 font-medium">
                <strong className="text-slate-400">Canvas recipe:</strong>{' '}
                Cron Job → Async Node (5k/s outflow) → App Server
              </div>
            </div>

            {/* Pattern: CDN */}
            <div id="p-cdn" className="scroll-mt-20 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 p-5 space-y-2.5 text-xs transition-all duration-300">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-sky-400" />
                <span className="font-bold text-white text-sm">CDN Edge Delivery</span>
                <Tag color="#22d3ee">Performance</Tag>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Serve static content from Points of Presence (PoPs) geographically close to users. This shields origin servers from media delivery load, cuts latency, and dramatically reduces bandwidth costs.
              </p>
              <CodeBlock>
                {`Origin load = Total QPS × (1 - Reduction %)\nExample: 100,000 QPS × 0.10 = 10,000 QPS hits origin`}
              </CodeBlock>
              <div className="text-slate-500 border-t border-white/5 pt-2.5 font-medium">
                <strong className="text-slate-400">Canvas recipe:</strong>{' '}
                Clients → CDN (90%) → Load Balancer → App Servers
              </div>
            </div>
          </section>

          {/* ── Section: Component Reference ─────────────────────────── */}
          <section className="space-y-6 border-t border-white/5 pt-10">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 size={14} className="text-sky-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Reference</span>
            </div>
            <SectionTitle id="components">Component Reference</SectionTitle>
            <p className="text-xs text-slate-400">Detailed specification for every node available in the simulator.</p>

            {COMPONENTS.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.name}
                  id={`c-${comp.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className="scroll-mt-20 rounded-xl border border-white/5 overflow-hidden bg-white/[0.005] hover:border-white/10 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: comp.color + '18', border: `1px solid ${comp.color}30` }}
                    >
                      <Icon size={16} style={{ color: comp.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{comp.name}</span>
                        <Tag color={comp.color}>{comp.category}</Tag>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{comp.tagline}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-5 py-4 border-b border-white/5 text-xs text-slate-400 leading-relaxed">
                    {comp.description}
                  </div>

                  {/* Parameters table */}
                  <div className="px-5 py-4 border-b border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Parameters</div>
                    <div className="space-y-3">
                      {comp.parameters.map((p) => (
                        <div key={p.name} className="grid grid-cols-[140px_1fr] gap-x-4 text-xs">
                          <div>
                            <code className="text-sky-300 font-mono font-medium">{p.name}</code>
                            <span className="text-[9px] text-slate-600 block font-mono mt-0.5 uppercase tracking-wider">{p.type}</span>
                          </div>
                          <span className="text-slate-400 leading-relaxed">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  {comp.tips && comp.tips.length > 0 && (
                    <div className="px-5 py-4 bg-white/[0.01] text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Tips</div>
                      <ul className="space-y-1 list-disc pl-4 text-slate-400">
                        {comp.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* ── Section: Persistence ─────────────────────────────────── */}
          <section id="persistence" className="scroll-mt-20 space-y-4 border-t border-white/5 pt-10">
            <SectionTitle id="persistence">Saving & Importing Diagrams</SectionTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your work is preserved in two ways — local filesystem and cloud storage.
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all duration-300 space-y-1.5">
                <span className="font-semibold text-white">💾 Local JSON Export/Import</span>
                <p className="text-slate-400 leading-relaxed">
                  Use the <strong>Actions → Save Architecture</strong> button to export your current canvas as a <code className="text-sky-300">.json</code> file. Re-import it at any time via <strong>Actions → Import JSON</strong>. The file encodes all node positions, configurations, and edge connections.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all duration-300 space-y-1.5">
                <span className="font-semibold text-white">☁️ Cloud Storage (Google Login)</span>
                <p className="text-slate-400 leading-relaxed">
                  Sign in with Google via the <strong>Actions → Sign In</strong> prompt to enable Firebase-backed cloud saves. Your designs are stored per account, load on any device, and up to <strong>5 designs</strong> can be saved simultaneously on the free plan.
                </p>
              </div>
              <Callout type="tip">
                Auto-save to localStorage runs automatically — your last session is always restored when you open the simulator, even without logging in.
              </Callout>
            </div>
          </section>

          {/* ── Section: References ───────────────────────────────────── */}
          <section id="references" className="scroll-mt-20 space-y-5 border-t border-white/5 pt-10">
            <SectionTitle id="references">Further Reading & References</SectionTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deepen your system design knowledge with these curated resources. They are the same materials referenced when building the simulation models in CheapSystem.
            </p>

            <div className="space-y-3.5">
              {[
                {
                  title: 'System Design Primer',
                  author: 'Donne Martin · GitHub',
                  desc: 'The most comprehensive open-source system design guide. Covers everything from DNS to consistent hashing, with diagrams and Anki flashcards.',
                  url: 'https://github.com/donnemartin/system-design-primer',
                  tag: 'Free · GitHub',
                },
                {
                  title: 'Designing Data-Intensive Applications',
                  author: 'Martin Kleppmann · O\'Reilly',
                  desc: 'Deep-dive into the theory behind replication, partitioning, transactions, and distributed systems consistency. The definitive engineering textbook.',
                  url: 'https://dataintensive.net/',
                  tag: 'Book',
                },
                {
                  title: 'System Design Interview – An Insider’s Guide',
                  author: 'Alex Xu',
                  desc: 'An excellent step-by-step guidebook containing clear templates, diagrams, and walkthroughs for solving common system design interview questions.',
                  url: 'https://drive.google.com/file/d/1d__wWd_K8OO-Obs3PHI5UKvfhKRQiKt_/view?usp=sharing',
                  tag: 'Book',
                },
                {
                  title: 'AWS Architecture Center',
                  author: 'Amazon Web Services',
                  desc: 'Official reference architectures, Well-Architected Framework guides, and whitepapers for production-grade cloud systems.',
                  url: 'https://aws.amazon.com/architecture/',
                  tag: 'Free',
                },
                {
                  title: 'Google Cloud Architecture Framework',
                  author: 'Google Cloud',
                  desc: 'Best practices across reliability, security, cost optimisation, and operational excellence for building on Google Cloud.',
                  url: 'https://cloud.google.com/architecture/framework',
                  tag: 'Free',
                },
                {
                  title: 'ByteByteGo System Design Newsletter',
                  author: 'Alex Xu',
                  desc: 'Weekly illustrated breakdowns of how real-world systems like YouTube, Twitter, and Airbnb are designed at scale.',
                  url: 'https://blog.bytebytego.com/',
                  tag: 'Newsletter',
                },
                {
                  title: 'High Scalability Blog',
                  author: 'Todd Hoff',
                  desc: 'Long-running blog with real-world architecture postmortems, case studies, and database technology comparisons.',
                  url: 'http://highscalability.com/',
                  tag: 'Blog',
                },
              ].map((ref) => (
                <a
                  key={ref.title}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 bg-[#0c0d12] hover:bg-white/[0.02] transition-all duration-300 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white text-sm group-hover:text-sky-400 transition-colors">{ref.title}</span>
                      <span className="text-[9px] bg-slate-900 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{ref.tag}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-1.5 font-medium">{ref.author}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{ref.desc}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-sky-400 transition-colors shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </section>

        </main>

        {/* Right Column: Sticky "On This Page" outline navigation */}
        <aside className="hidden xl:block w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pl-6 border-l border-white/5 scrollbar-none">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 select-none">On This Page</div>
          <div className="relative border-l border-white/5 pl-4 py-1 flex flex-col gap-2">
            {NAV.flatMap((s) =>
              s.children
                ? s.children.map((c) => {
                    const isActive = activeId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => scrollTo(c.id)}
                        className={`text-left text-xs transition-all duration-200 hover:text-slate-200 relative ${
                          isActive ? 'text-sky-400 font-medium translate-x-0.5' : 'text-slate-500'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })
                : [
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`text-left text-xs transition-all duration-200 hover:text-slate-200 relative ${
                        activeId === s.id ? 'text-sky-400 font-medium translate-x-0.5' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ]
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
