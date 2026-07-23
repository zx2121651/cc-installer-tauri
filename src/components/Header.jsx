import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { RefreshCw, Minus, Square, Copy, X } from 'lucide-react';

export default function Header({ checkEnv, isCheckingEnv }) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Monitor window resize/maximize state to toggle icons dynamically
  useEffect(() => {
    let cancelled = false;
    let unlisten;

    const watchWindowSize = async () => {
      try {
        const unlistenFn = await getCurrentWindow().onResized(async () => {
          if (cancelled) return;
          const maximized = await getCurrentWindow().isMaximized();
          if (!cancelled) setIsMaximized(maximized);
        });
        if (cancelled) {
          unlistenFn();
        } else {
          unlisten = unlistenFn;
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error listening to window resize:', err);
        }
      }
    };

    watchWindowSize();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  const handleToggleMaximize = async () => {
    try {
      const windowInstance = getCurrentWindow();
      await windowInstance.toggleMaximize();
      const maximized = await windowInstance.isMaximized();
      setIsMaximized(maximized);
    } catch (err) {
      console.error('Toggle maximize failed:', err);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-12 flex items-center justify-between px-5 bg-[#FFFBF9] shrink-0 border-b border-[#FEEFE6] select-none cursor-default"
    >
      {/* Logo + Title — pointer-events-none so drags pass through to container */}
      <div className="flex items-center gap-2.5 pointer-events-none">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF9877] to-[#F37042] flex items-center justify-center text-white shadow-sm shadow-orange-200 transition-transform duration-300 hover:scale-110">
          <svg viewBox="0 0 100 100" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M50 10 L50 90 M10 50 L90 50 M21.7 21.7 L78.3 78.3 M21.7 78.3 L78.3 21.7" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black tracking-tight text-[#4A3A31]">Claude Code 一键安装程序</span>
          {/* Hide secondary badge on very narrow screens */}
          <span className="hidden sm:inline-flex text-[10px] font-extrabold text-[#F37042] bg-[#FFF0E5] px-2 py-0.5 rounded-md border border-[#FDECE2] shadow-2xs items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F37042] animate-ping" />
            <span className="gradient-text-animated">让 AI 编程触手可及</span>
          </span>
        </div>
      </div>

      {/* Right controls — pointer-events-auto to re-enable button interactions */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <button
          type="button"
          onClick={checkEnv}
          disabled={isCheckingEnv}
          className={`flex items-center gap-1.5 text-[11px] font-bold text-[#6D5A4E] bg-white border border-[#FDECE2] px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
            isCheckingEnv
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:bg-[#FFF0E5] hover:text-[#F37042] hover:scale-105 active:scale-95 hover:border-[#FCD9C6]'
          }`}
        >
          <RefreshCw className={`w-3 h-3 transition-transform duration-500 ${isCheckingEnv ? 'animate-spin' : 'group-hover:rotate-180'}`} /> 重新检测
        </button>

        {/* Custom Window Controls (Minimize, Maximize/Restore, Close) */}
        <div className="flex items-center -mr-5 no-drag">
          <button
            type="button"
            onClick={() => getCurrentWindow().minimize()}
            className="w-12 h-12 flex items-center justify-center text-[#B0A09A] hover:bg-[#FFF0E5] hover:text-[#F37042] transition-colors"
            title="最小化"
            aria-label="最小化"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-12 h-12 flex items-center justify-center text-[#B0A09A] hover:bg-[#FFF0E5] hover:text-[#F37042] transition-colors"
            title={isMaximized ? '还原' : '最大化'}
            aria-label={isMaximized ? '还原' : '最大化'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => getCurrentWindow().close()}
            className="w-12 h-12 flex items-center justify-center text-[#B0A09A] hover:bg-red-500 hover:text-white transition-colors"
            title="关闭"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
