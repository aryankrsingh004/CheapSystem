import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { marked } from 'marked';
import { ArrowLeft, CalendarDays, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import posts, { type BlogPost } from '@/lib/blogPosts';

// Configure marked for clean output
marked.setOptions({ async: false });

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Strip frontmatter (---...---) from raw markdown before parsing
function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\s*/m, '');
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; html: string; post: BlogPost }
  | { status: 'error' };

export function BlogPost() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug ?? '';

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      setState({ status: 'error' });
      return;
    }

    setState({ status: 'loading' });

    fetch(`/blog/${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((raw) => {
        const body = stripFrontmatter(raw);
        const html = marked.parse(body) as string;
        setState({ status: 'ready', html, post });
      })
      .catch(() => setState({ status: 'error' }));
  }, [slug]);

  return (
    <div className="h-screen overflow-y-auto bg-[#08090c] text-slate-300 antialiased font-sans">


      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090c]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <span className="text-[11px] font-black text-sky-400">CS</span>
            </div>
            <span className="text-xs font-black tracking-widest text-white uppercase">CheapSystem</span>
            <ChevronRight size={10} className="text-slate-600" />
            <Link href="/blog" className="text-xs text-slate-400 hover:text-white transition-colors">
              Blog
            </Link>
          </div>
          <Link href="/blog" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/10 rounded-xl px-3.5 h-8 bg-white/[0.02] hover:bg-white/[0.05] active:scale-95 duration-200">
            <ArrowLeft size={12} className="text-sky-400" />
            <span>All Posts</span>
          </Link>
        </div>
      </header>

      {/* Loading */}
      {state.status === 'loading' && (
        <div className="max-w-3xl mx-auto px-6 pt-24 flex flex-col items-center gap-3 text-slate-500">
          <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          <span className="text-xs">Loading article…</span>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="max-w-3xl mx-auto px-6 pt-24 flex flex-col items-center gap-4 text-slate-500">
          <AlertCircle size={32} className="text-red-500/50" />
          <p className="text-sm font-medium text-slate-400">Post not found</p>
          <p className="text-xs text-center max-w-xs">
            The article <code className="text-sky-400">/{slug}</code> doesn't exist yet. Create{' '}
            <code className="text-sky-400">public/blog/{slug}.md</code> and add it to the manifest.
          </p>
          <Link href="/blog" className="mt-2 text-xs text-sky-400 hover:underline">
            ← Back to all posts
          </Link>
        </div>
      )}

      {/* Article */}
      {state.status === 'ready' && (() => {
        const { post, html } = state;
        return (
          <article className="max-w-3xl mx-auto px-6 pt-12 pb-24">

            {/* Article banner image */}
            {post.image && (
              <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 bg-white/5">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-sky-500/20 text-sky-400 bg-sky-500/5"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-10 pb-8 border-b border-white/5">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={11} />
                {formatDate(post.date)}
              </span>
              {post.readingTime && (
                <span className="flex items-center gap-1.5">
                  <Clock size={11} />
                  {post.readingTime}
                </span>
              )}
            </div>

            {/* Markdown Body */}
            <div
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Footer nav */}
            <div className="mt-16 pt-8 border-t border-white/5">
              <Link href="/blog" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
                <ArrowLeft size={14} className="text-sky-400" />
                <span>Back to all posts</span>
              </Link>
            </div>
          </article>
        );
      })()}
    </div>
  );
}
