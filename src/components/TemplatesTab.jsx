import React from 'react';
import { LayoutTemplate, Rocket, ChevronRight, Folder } from 'lucide-react';

export default function TemplatesTab({ showToast }) {
  const templates = [
    {
      title: 'React + Tailwind CSS 极速版模板',
      desc: '专为极速 Web 界面开发设计的单页模板，内置 Vite 配置与 PostCSS 兼容，一键拉起漂亮的卡片式网站。',
      tech: ['React', 'Vite', 'TailwindCSS', 'lucide-react'],
      cmd: 'npx create-vite-app my-react-app --template react'
    },
    {
      title: 'Python FastAPI 轻量高性能后端',
      desc: '极简的接口中转和本地微服务开发模板，内置 Swagger UI 文档生成及 CORS 跨域安全配置。',
      tech: ['Python', 'FastAPI', 'Uvicorn', 'Pydantic'],
      cmd: 'pip install fastapi uvicorn'
    },
    {
      title: 'Rust Tauri (v2) 混合桌面客户端',
      desc: '使用 Web 页面作为前端，调用 Rust 本地原生 API 编译出超轻量单文件 exe 的开发骨架，本项目即是该模板衍生品。',
      tech: ['Rust', 'Tauri v2', 'Vite', 'React'],
      cmd: 'npx -y create-tauri-app@latest'
    }
  ];

  const handleRun = (cmd) => {
    navigator.clipboard.writeText(cmd);
    showToast('📋 命令已复制到剪贴板，您可在终端直接运行！');
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-[#F37042]" /> 项目初始化模版市场
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">精选了主流的、高颜值的编程语言及框架空工程模版，方便您的一键复制并在本地极速启动项目。</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates.map((tpl, i) => (
          <div key={i} className="border border-[#FDECE2] rounded-2xl p-5 bg-[#FFFBF9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-200 transition-colors">
            <div className="flex-1">
              <h4 className="text-sm font-black text-[#4A3A31] mb-1">{tpl.title}</h4>
              <p className="text-xs text-[#9A877B] leading-relaxed mb-3">{tpl.desc}</p>
              <div className="flex gap-1.5 flex-wrap">
                {tpl.tech.map((t, idx) => (
                  <span key={idx} className="text-[9px] font-bold text-[#F37042] bg-[#FFF0E5] px-2 py-0.5 rounded-md">{t}</span>
                ))}
              </div>
            </div>
            
            <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
              <div className="bg-white border border-[#FEEFE6] p-2 rounded-xl text-[10px] font-mono text-gray-500 truncate w-full md:w-[240px]">
                {tpl.cmd}
              </div>
              <button 
                onClick={() => handleRun(tpl.cmd)}
                className="w-full md:w-auto px-4 py-2 bg-[#F37042] hover:bg-[#E06030] text-white text-xs font-black rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.98]"
              >
                复制启动命令 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
