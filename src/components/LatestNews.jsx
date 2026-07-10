import React from 'react';

export default function LatestNews() {
  return (
    <div className="flex-1 bg-[#FFF5EE] border border-[#FDECE2] rounded-[20px] p-5 relative shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
      <div className="absolute right-[-15px] top-[-35px] w-[110px] h-[110px] pointer-events-none z-10 drop-shadow-md">
        <svg viewBox="0 0 150 150" className="w-full h-full">
          <path d="M40 120 L45 105 L50 120 L65 125 L50 130 L45 145 L40 130 L25 125 Z" fill="#FFCA28" />
          <path d="M50 100 Q75 10 100 100" fill="#A5D6A7" />
          <path d="M50 100 Q75 140 100 100" fill="#A5D6A7" />
          <path d="M60 30 L50 15 L70 25 Z" fill="#81C784" />
          <path d="M80 20 L75 5 L90 20 Z" fill="#81C784" />
          <path d="M100 35 L105 15 L110 35 Z" fill="#81C784" />
          <path d="M115 60 L130 50 L115 70 Z" fill="#81C784" />
          
          <circle cx="75" cy="80" r="28" fill="#FFFFFF" />
          <ellipse cx="60" cy="85" rx="6" ry="3" fill="#FF8A80" opacity="0.6" />
          <ellipse cx="90" cy="85" rx="6" ry="3" fill="#FF8A80" opacity="0.6" />
          <circle cx="63" cy="75" r="3" fill="#4E342E" />
          <circle cx="87" cy="75" r="3" fill="#4E342E" />
          <path d="M72 82 Q75 85 78 82" fill="none" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M45 105 Q75 130 105 105 L115 130 Q75 150 35 130 Z" fill="#81C784" />
          <circle cx="65" cy="115" r="8" fill="#FFFFFF" />
          <circle cx="85" cy="115" r="8" fill="#FFFFFF" />
        </svg>
      </div>

      <h3 className="font-black text-sm text-[#4A3A31] mb-4">最新动态</h3>
      
      <div className="space-y-3.5 flex-1 relative z-20">
        <div className="flex justify-between items-start border-b border-[#FDECE2] pb-2">
          <div className="flex gap-2">
            <span className="text-xl leading-none">🎉</span>
            <span className="text-xs font-bold text-[#4A3A31]">Tauri + React 版全新发布！</span>
          </div>
          <span className="text-[10px] text-[#9A877B] whitespace-nowrap">2026-07-09</span>
        </div>
        <div className="flex justify-between items-start border-b border-[#FDECE2] pb-2">
          <div className="flex gap-2">
            <span className="text-xl leading-none">⚡</span>
            <span className="text-xs font-bold text-[#4A3A31]">基于 Windows 11 WebView2 极速渲染</span>
          </div>
          <span className="text-[10px] text-[#9A877B] whitespace-nowrap">2026-07-08</span>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <span className="text-xl leading-none">🐱</span>
            <span className="text-xs font-bold text-[#4A3A31]">猫咪动效与响应式完美集成</span>
          </div>
          <span className="text-[10px] text-[#9A877B] whitespace-nowrap">2026-07-07</span>
        </div>
      </div>
    </div>
  );
}
