import { Link } from 'wouter';
import { ArrowLeft, CalendarDays, Clock, ChevronRight, Rss } from 'lucide-react';
import posts from '@/lib/blogPosts';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function BlogList() {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#08090c] text-slate-300 antialiased font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090c]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <span className="text-[11px] font-black text-sky-400">CS</span>
            </div>
            <span className="text-xs font-black tracking-widest text-white uppercase">CheapSystem</span>
            <ChevronRight size={10} className="text-slate-600" />
            <span className="text-xs text-slate-400 font-medium select-none">Blog</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/10 rounded-xl px-3.5 h-8 bg-white/[0.02] hover:bg-white/[0.05] active:scale-95 duration-200">
            <ArrowLeft size={12} className="text-sky-400" />
            <span>Simulator</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <div className="flex items-center gap-2 mb-4">
          <Rss size={14} className="text-sky-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Engineering Blog</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-3">System Design Deep Dives</h1>
        <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
          Practical articles on distributed systems, infrastructure patterns, and the tools behind modern software engineering.
        </p>
      </div>

      {/* Post list */}
      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-4">
        {sorted.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 cursor-pointer"
          >
            {/* Optional image thumbnail */}
            {post.image && (
              <div className="sm:w-36 sm:h-24 w-full h-40 rounded-xl overflow-hidden bg-white/5 shrink-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-sky-500/20 text-sky-400 bg-sky-500/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors leading-snug mb-1.5">
                {post.title}
              </h2>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                {post.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={10} />
                  {formatDate(post.date)}
                </span>
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {post.readingTime}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight
              size={16}
              className="self-center text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </Link>
        ))}
      </main>
    </div>
  );
}
