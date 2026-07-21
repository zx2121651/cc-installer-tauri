import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  return (
    <div className="w-[64px] lg:w-[220px] bg-[#FFFBF9] border-r border-[#FEEFE6] flex flex-col shrink-0 transition-all duration-300">
      <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1 custom-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer ${
                isActive 
                  ? 'bg-[#FFF0E5] text-[#F37042] shadow-[0_2px_8px_rgba(243,112,66,0.08)]' 
                  : 'text-[#6D5A4E] hover:bg-[#FAF0E8]'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 transition-transform duration-300 ${isActive ? 'bg-white shadow-sm scale-110' : 'bg-transparent'}`}>
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-3 scale-105' : ''}`} />
              </div>
              <div className="hidden lg:block text-left flex-1 min-w-0">
                <div className={`text-xs font-black truncate ${isActive ? 'text-[#F37042]' : 'text-[#4A3A31]'}`}>{tab.label}</div>
                <div className={`text-[9px] ${isActive ? 'text-[#E06030]' : 'text-[#9A877B]'} mt-0.5 scale-90 origin-left leading-tight truncate`}>{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Code cat SVG illustration - automatically hides on smaller screen heights and widths */}
      <div className="hidden lg:block h-[160px] relative shrink-0 overflow-hidden border-t border-[#FEEFE6]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFF0E5]/50 to-transparent pointer-events-none" />
        <svg viewBox="0 0 200 150" className="w-full h-full relative z-10 scale-[1.15] translate-y-3 translate-x-2">
          {/* Plant pot */}
          <path d="M160 130 L180 130 L175 150 L165 150 Z" fill="#D1A390" />
          <g className="animate-plant-sway">
            <path d="M170 130 Q160 100 170 80 Q180 100 170 130" fill="#9CD877" />
            <path d="M170 130 Q185 105 185 85 Q175 110 170 130" fill="#7CB359" />
            <path d="M170 130 Q155 110 150 90 Q165 115 170 130" fill="#B3E390" />
          </g>
          
          {/* Cat Group with Breathing Animation */}
          <g className="animate-cat-breathe">
            {/* Cat body */}
            <path d="M40 150 Q40 80 80 80 Q120 80 120 150 Z" fill="#FFF2E5" />
            <path d="M60 150 Q60 100 80 100 Q100 100 100 150 Z" fill="#FFFFFF" />
            
            {/* Face */}
            <circle cx="80" cy="70" r="35" fill="#FFF2E5" />
            <circle cx="80" cy="75" r="30" fill="#FFFFFF" />
            
            {/* Ears with individual twitch animations */}
            <g className="animate-ear-left">
              <path d="M50 48 L40 15 L65 38 Z" fill="#FFF2E5" stroke="#FDECE2" strokeWidth="2" strokeLinejoin="round" />
              <path d="M52 45 L45 22 L62 38 Z" fill="#FFC9C9" />
            </g>
            <g className="animate-ear-right">
              <path d="M110 48 L120 15 L95 38 Z" fill="#FFF2E5" stroke="#FDECE2" strokeWidth="2" strokeLinejoin="round" />
              <path d="M108 45 L115 22 L98 38 Z" fill="#FFC9C9" />
            </g>
            
            {/* Face details */}
            <ellipse cx="65" cy="75" rx="3.5" ry="5" fill="#4A3A31" />
            <ellipse cx="95" cy="75" rx="3.5" ry="5" fill="#4A3A31" />
            <ellipse cx="55" cy="82" rx="6" ry="3" fill="#FFB4B4" opacity="0.6" />
            <ellipse cx="105" cy="82" rx="6" ry="3" fill="#FFB4B4" opacity="0.6" />
            
            {/* Nose and mouth */}
            <polygon points="80,78 77,81 83,81" fill="#FFB4B4" />
            <path d="M76 83 Q80 86 80 83 Q80 86 84 83" stroke="#4A3A31" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            
            {/* Whiskers */}
            <line x1="38" y1="76" x2="22" y2="73" stroke="#D1C6C0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="38" y1="81" x2="20" y2="81" stroke="#D1C6C0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="122" y1="76" x2="138" y2="73" stroke="#D1C6C0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="122" y1="81" x2="140" y2="81" stroke="#D1C6C0" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          
          {/* Desk */}
          <path d="M10 135 L190 135" stroke="#FDECE2" strokeWidth="4" strokeLinecap="round" />
          <rect x="50" y="115" width="60" height="20" rx="3" fill="#FFE2CC" />
          <circle cx="80" cy="120" r="1.5" fill="#4A3A31" />
        </svg>
      </div>
    </div>
  );
}
