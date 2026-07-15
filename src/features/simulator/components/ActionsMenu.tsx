/**
 * ─── ActionsMenu ──────────────────────────────────────────────────────────────
 *
 * Top-right floating ⚙ Actions button + dropdown menu.
 * Contains: Save Architecture, Import JSON, Clear Canvas.
 */

import { useRef, useState } from 'react';
import { PRESETS } from '@/lib/presets';
import { User } from 'firebase/auth';

interface ActionsMenuProps {
  showMenu: boolean;
  onToggle: () => void;
  onSave: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onLoadPreset: (preset: any) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveCloud: () => void;
  onLoadCloud: (designId: string) => void;
  onDeleteCloud: (designId: string, e: React.MouseEvent) => void;
  cloudDesigns: { id: string; name: string }[];
  cloudDesignsLimit: number;
}

export function ActionsMenu({
  showMenu,
  onToggle,
  onSave,
  onImport,
  onClear,
  onLoadPreset,
  user,
  onSignIn,
  onSignOut,
  onSaveCloud,
  onLoadCloud,
  onDeleteCloud,
  cloudDesigns,
  cloudDesignsLimit
}: ActionsMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<'cloud' | 'preset' | null>(null);

  return (
    <div className="absolute top-4 right-4 z-30">
      <button
        id="actions-menu-btn"
        onClick={onToggle}
        className={`group flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-[13px] font-black tracking-wide uppercase border transition-all duration-300 shadow-xl backdrop-blur-xl ${showMenu
            ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-[1.02]'
            : 'bg-[hsl(220_14%_10%)]/95 border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5 hover:scale-[1.02] active:scale-95'
          }`}
      >
        <span className="text-[14px]">⚙</span>
        <span className="hidden sm:inline">Actions</span>
      </button>

      <div
        className={`absolute top-[52px] right-0 z-40 w-52 rounded-2xl border border-white/10 bg-[hsl(220_14%_11%)]/95 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5 transition-all duration-200 origin-top-right ${showMenu
            ? 'opacity-100 scale-100 visible'
            : 'opacity-0 scale-95 invisible pointer-events-none'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Profile / Authentication Section */}
        <div className="px-3 py-2.5 border-b border-white/5 mb-1 bg-white/[0.02] rounded-t-2xl">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center text-xs font-bold">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white/90 truncate">{user.displayName || 'User'}</span>
                  <span className="text-[9px] text-white/40 truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="w-full py-1.5 px-2 rounded-md bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 border border-white/5 hover:border-red-500/15 text-[10px] font-bold tracking-wider uppercase transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Cloud Storage</div>
              <button
                onClick={onSignIn}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#4285f4] hover:bg-[#357ae8] text-white border border-[#4285f4] text-[10px] font-black tracking-wide uppercase transition-all shadow-md active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.78 0-8.672-3.892-8.672-8.672s3.892-8.672 8.672-8.672c2.25 0 4.295.825 5.865 2.4l3.15-3.15C18.78 1.148 15.72 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.7 0 11.28-4.76 11.28-11.46 0-.74-.08-1.3-.22-1.735H12.24z" />
                </svg>
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-1.5 space-y-1">
          {user && (
            <>
              <button
                id="actions-cloud-save-btn"
                disabled={cloudDesigns.length >= cloudDesignsLimit}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium transition-all border ${
                  cloudDesigns.length >= cloudDesignsLimit
                    ? 'text-white/20 cursor-not-allowed border-transparent'
                    : 'text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/10 border-sky-500/5'
                }`}
                onClick={onSaveCloud}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center bg-sky-500/10">☁️</div>
                <span>Save to Cloud</span>
                <span className="ml-auto text-[9px] text-white/30">{cloudDesigns.length}/{cloudDesignsLimit}</span>
              </button>

              <div className="relative group">
                <button
                  disabled={cloudDesigns.length === 0}
                  onClick={(e) => { e.stopPropagation(); setOpenSubmenu(openSubmenu === 'cloud' ? null : 'cloud'); }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium transition-all ${cloudDesigns.length > 0
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-white/20 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5">📁</div>
                    <span>Load from Cloud</span>
                  </div>
                  {cloudDesigns.length > 0 && <span className="text-[9px] text-white/30">◀</span>}
                </button>

                {cloudDesigns.length > 0 && (
                  <div className={`absolute z-50 right-0 sm:right-full top-full sm:top-0 mt-1 sm:mt-0 sm:mr-1 w-44 rounded-xl border border-white/10 bg-[hsl(220_14%_11%)]/98 backdrop-blur-2xl shadow-2xl p-1 space-y-0.5 animate-in slide-in-from-right-1 fade-in duration-150 ${openSubmenu === 'cloud' ? 'block' : 'hidden sm:group-hover:block'}`}>
                    <div className="text-[9px] uppercase tracking-wider text-white/30 px-3 py-1 font-bold">
                      My Cloud Designs
                    </div>
                    {cloudDesigns.map((design) => (
                      <div key={design.id} className="flex items-center gap-1 group/item">
                        <button
                          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all min-w-0"
                          onClick={() => onLoadCloud(design.id)}
                        >
                          <div className="w-4 h-4 shrink-0 rounded flex items-center justify-center bg-white/5 text-[9px]">☁️</div>
                          <span className="truncate">{design.name}</span>
                        </button>
                        <button
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                          onClick={(e) => onDeleteCloud(design.id, e)}
                          title="Delete design"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5 mx-2 my-1" />
            </>
          )}

          <button
            id="actions-save-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            onClick={onSave}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5">💾</div>
            <span>Save Architecture</span>
          </button>

          <button
            id="actions-import-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5">📥</div>
            <span>Import JSON</span>
          </button>

          {PRESETS.length > 0 && (
            <>
              <div className="h-px bg-white/5 mx-2 my-1" />

              <div className="relative group">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenSubmenu(openSubmenu === 'preset' ? null : 'preset'); }}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5">📋</div>
                    <span>Load Preset</span>
                  </div>
                  <span className="text-[9px] text-white/30">◀</span>
                </button>

                {/* Flyout Submenu (positioned left on desktop, bottom on mobile) */}
                <div className={`absolute z-50 right-0 sm:right-full top-full sm:top-0 mt-1 sm:mt-0 sm:mr-1 w-44 rounded-xl border border-white/10 bg-[hsl(220_14%_11%)]/98 backdrop-blur-2xl shadow-2xl p-1 space-y-0.5 animate-in slide-in-from-right-1 fade-in duration-150 ${openSubmenu === 'preset' ? 'block' : 'hidden sm:group-hover:block'}`}>
                  <div className="text-[9px] uppercase tracking-wider text-white/30 px-3 py-1 font-bold">
                    Select Preset
                  </div>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                      onClick={() => onLoadPreset(preset.data)}
                    >
                      <div className="w-4 h-4 rounded flex items-center justify-center bg-white/5 text-[9px]">📄</div>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-white/5 mx-2 my-1" />

          <button
            id="actions-clear-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
            onClick={() => {
              if (confirm('Are you sure you want to clear the entire canvas?')) {
                onClear();
              }
            }}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center bg-red-500/10">🗑</div>
            <span>Clear Canvas</span>
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}
