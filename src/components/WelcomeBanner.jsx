import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Sliders, Heart } from 'lucide-react';

export default function WelcomeBanner() {
  return (
    <div className="bg-[#FFF5EE] border border-[#FDECE2] rounded-[20px] p-6 relative overflow-hidden shrink-0 shadow-sm shadow-orange-100/50">
      <Sparkles className="absolute top-4 right-1/3 text-yellow-400 w-5 h-5 opacity-60" />
      <Sparkles className="absolute bottom-6 left-1/4 text-orange-300 w-4 h-4 opacity-50" />
      <Sparkles className="absolute top-8 left-1/2 text-pink-300 w-3 h-3 opacity-60" />

      <div className="relative z-10 w-2/3">
        <h2 className="text-[26px] font-black tracking-tight text-[#4A3A31] mb-2 flex items-center gap-2">
          欢迎使用 <span className="text-[#F37042]">Claude Code</span> 一键安装程序 🎉
        </h2>
        <p className="text-sm font-bold text-[#8D7A6E] mb-6">
          一站式安装、配置 Claude Code，助你高效编程，灵感不断！
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#FDECE2] px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-[#6D5A4E]">
            <div className="w-5 h-5 bg-green-100 text-green-600 rounded flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></div> 一键安装
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#FDECE2] px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-[#6D5A4E]">
            <div className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5" /></div> 智能检测
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#FDECE2] px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-[#6D5A4E]">
            <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded flex items-center justify-center"><Sliders className="w-3.5 h-3.5" /></div> 灵活配置
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-[#FDECE2] px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-[#6D5A4E]">
            <div className="w-5 h-5 bg-pink-100 text-pink-600 rounded flex items-center justify-center"><Heart className="w-3.5 h-3.5" /></div> 开箱即用
          </div>
        </div>
      </div>

      {/* 右侧魔法猫猫插画 SVG */}
      <div className="absolute right-0 bottom-[-10px] w-[320px] h-[220px] pointer-events-none">
        <svg viewBox="0 0 300 240" className="w-full h-full">
          <path d="M220 50 Q220 20 250 20 Q280 20 280 50 Q280 80 250 80 Q240 80 230 90 L235 75 Q220 70 220 50 Z" fill="#FFFFFF" stroke="#FDECE2" strokeWidth="2" />
          <text x="238" y="45" fontFamily="sans-serif" fontWeight="900" fontSize="12" fill="#4A3A31">Let's</text>
          <text x="235" y="60" fontFamily="sans-serif" fontWeight="900" fontSize="12" fill="#F37042">code! 🚀</text>

          <path d="M145 60 L150 45 L155 60 L170 65 L155 70 L150 85 L145 70 L130 65 Z" fill="#FFE57F" />
          <path d="M120 110 L148 68" stroke="#D7CCC8" strokeWidth="4" strokeLinecap="round" />

          <circle cx="200" cy="110" r="50" fill="#FFFFFF" />
          <path d="M165 80 L150 40 L190 65 Z" fill="#FFFFFF" />
          <path d="M168 75 L158 48 L185 65 Z" fill="#FFC9C9" />
          <path d="M235 80 L250 40 L210 65 Z" fill="#FFFFFF" />
          <path d="M232 75 L242 48 L215 65 Z" fill="#D1A390" />
          <path d="M220 130 Q245 130 250 100 Q230 80 210 90 Z" fill="#D1A390" />

          <path d="M175 110 Q180 105 185 110" fill="none" stroke="#4A3A31" strokeWidth="3" strokeLinecap="round" />
          <circle cx="215" cy="110" r="4.5" fill="#4A3A31" />
          <ellipse cx="165" cy="120" rx="8" ry="4" fill="#FFB4B4" opacity="0.6" />
          <ellipse cx="225" cy="120" rx="8" ry="4" fill="#FFB4B4" opacity="0.6" />
          <path d="M195 125 Q200 130 205 125" fill="none" stroke="#4A3A31" strokeWidth="2" strokeLinecap="round" />

          <path d="M140 200 L140 160 Q170 130 200 130 Q230 130 260 160 L260 200 Z" fill="#2C3E50" />
          <path d="M140 200 L140 240 L260 240 L260 200 Z" fill="#2C3E50" />
          <path d="M160 135 L140 180" stroke="#1A252F" strokeWidth="6" strokeLinecap="round" />
          <path d="M240 135 L260 180" stroke="#1A252F" strokeWidth="6" strokeLinecap="round" />
          
          <g transform="translate(185, 175) scale(0.6)">
            <svg viewBox="0 0 100 100" width="30" height="30">
              <path d="M50 10 L50 90 M10 50 L90 50 M21.7 21.7 L78.3 78.3 M21.7 78.3 L78.3 21.7" stroke="#F37042" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <text x="35" y="20" fontFamily="sans-serif" fontWeight="bold" fontSize="18" fill="#FFFFFF">Claude</text>
            <text x="45" y="40" fontFamily="sans-serif" fontWeight="bold" fontSize="18" fill="#F37042">Code</text>
          </g>

          <circle cx="125" cy="115" r="12" fill="#FFFFFF" />
          <circle cx="265" cy="140" r="12" fill="#D1A390" />
          
          <path d="M260 210 Q290 200 280 180 Q270 160 280 150" fill="none" stroke="#D1A390" strokeWidth="14" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
