import { FolderOpen, Layout, BookOpen, Rss } from 'lucide-react';
import { Link } from 'wouter';
import { PRESETS } from '@/lib/presets';

interface WelcomeOverlayProps {
  onOpen: () => void;
  onLoadPreset: (preset: any) => void;
}

export function WelcomeOverlay({ onOpen, onLoadPreset }: WelcomeOverlayProps) {

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
    >
      {/* ── Start Here pointer instruction (casual look, responsive) ── */}
      <div className="absolute top-[76px] left-6 md:left-10 w-52 h-24 pointer-events-none select-none animate-bounce" style={{ animationDuration: '3.5s' }}>
        <svg className="absolute top-0 left-0 w-16 h-16 text-sky-400/80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
          {/* Handdrawn S-curve starting at tail (bottom-right) and pointing up-left */}
          <path d="M 75,75 C 60,40 45,70 30,15" />
          {/* Arrowhead pointing up-left */}
          <path d="M 20,25 L 30,15 L 38,25" />
        </svg>
        <span
          className="absolute top-[52px] left-[74px] text-[15px] md:text-lg text-sky-400 font-bold uppercase tracking-wider -rotate-6 whitespace-nowrap"
          style={{ fontFamily: "'Architects Daughter', cursive" }}
        >
          Start here!
        </span>
      </div>
      {/* ── Background Creative Elements ────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px]"
        />
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center pointer-events-auto">
        <div className="text-center">
          <div className="text-sm md:text-base font-bold text-sky-400 uppercase tracking-[0.4em] mb-3 select-none">
            CheapSystem
          </div>
          <h1 className="text-7xl font-black text-white mb-4 tracking-tighter leading-none select-none">
            SYSTEM<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-sky-300 to-sky-600">DESIGNER</span>
          </h1>

          <div className="flex items-center justify-center gap-5 text-xs font-extrabold text-white/20 tracking-[0.2em] mb-8 uppercase select-none">
            <span>Draft</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/5"></span>
            <span>Simulate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/5"></span>
            <span>Optimize</span>
          </div>

          {/* ── Action Buttons ────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center gap-4 justify-center">
              <button
                onClick={onOpen}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group cursor-pointer"
              >
                <FolderOpen size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wide">Open Design</span>
              </button>

              <Link href="/docs" className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group cursor-pointer">
                <BookOpen size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wide">Read Docs</span>
              </Link>

              <Link href="/blog" className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group cursor-pointer">
                <Rss size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wide">Read Blog</span>
              </Link>
            </div>

            {/* Simple Preset Buttons */}
            {PRESETS.length > 0 && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Or start with a preset</span>
                <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onLoadPreset(preset.data)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/10 transition-all active:scale-95"
                    >
                      <Layout size={14} className="opacity-70" />
                      <span className="text-xs font-semibold">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
