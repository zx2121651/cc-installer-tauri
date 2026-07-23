import React from 'react';
import { Lightbulb, BookOpen, Heart } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

const openExternal = async (url) => {
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export default function Footer({ setActiveTab }) {
  return (
    <div className="h-10 bg-[#FFFBF9] border-t border-[#FEEFE6] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-[10px] font-bold text-[#9A877B] shrink-0">v1.2.4</span>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8D7A6E] bg-[#FFF5EE] px-3 py-1 rounded-full border border-[#FDECE2] min-w-0">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          <span className="truncate">
            小贴士：安装过程中如遇问题，可前往{' '}
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className="font-bold text-[#F37042] hover:underline"
            >
              日志与故障排查
            </button>
            {' '}页面查看解决方案
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-[11px] font-bold text-[#8D7A6E] shrink-0">
        <button
          type="button"
          onClick={() => openExternal('https://docs.anthropic.com')}
          className="flex items-center gap-1.5 hover:text-[#4A3A31] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> 官网文档
        </button>
        <span className="text-[#9A877B]">技术支持请联系您的产品渠道</span>
        <span className="flex items-center gap-1.5 text-[#F37042] ml-2">
          <Heart className="w-3.5 h-3.5 fill-current" /> 感谢使用
        </span>
      </div>
    </div>
  );
}
