import React from 'react';
import { Lightbulb, BookOpen, Mail, Heart } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Footer({ setActiveTab }) {
  return (
    <div className="h-10 bg-[#FFFBF9] border-t border-[#FEEFE6] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold text-[#9A877B] w-[172px]">v1.2.4 <span className="text-[#5CB85C] ml-2">Tauri 重构版</span></span>
        
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8D7A6E] bg-[#FFF5EE] px-3 py-1 rounded-full border border-[#FDECE2]">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
          小贴士：安装过程中如遇问题，可前往 <span onClick={() => setActiveTab('logs')} className="font-bold text-[#F37042] cursor-pointer">日志与故障排查</span> 页面查看解决方案
        </div>
      </div>

      <div className="flex items-center gap-5 text-[11px] font-bold text-[#8D7A6E]">
        <button className="flex items-center gap-1.5 hover:text-[#4A3A31] transition-colors"><BookOpen className="w-3.5 h-3.5" /> 官网文档</button>
        <button className="flex items-center gap-1.5 hover:text-[#4A3A31] transition-colors"><GithubIcon className="w-3.5 h-3.5" /> GitHub</button>
        <button className="flex items-center gap-1.5 hover:text-[#4A3A31] transition-colors"><Mail className="w-3.5 h-3.5" /> 反馈建议</button>
        <span className="flex items-center gap-1.5 text-[#F37042] ml-2"><Heart className="w-3.5 h-3.5 fill-current" /> 感谢使用 Claude Code！</span>
      </div>
    </div>
  );
}
