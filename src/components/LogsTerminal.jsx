import React from 'react';
import { Terminal } from 'lucide-react';

export default function LogsTerminal({ logsList }) {
  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <h3 className="font-black text-sm text-[#4A3A31] mb-2 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-[#F37042]" /> 实时安装日志与排障终端
      </h3>
      <p className="text-xs text-[#9A877B] mb-4">在这里您可以查看 npm 安装及 PowerShell 脚本执行的原始终端输出。</p>
      <div className="flex-1 bg-[#1E1E1E] rounded-xl p-4 font-mono text-sm text-[#D4D4D4] overflow-y-auto custom-scrollbar h-[480px]">
        {logsList.length === 0 ? (
          <div className="text-[#858585] italic">等待一键安装启动，实时命令行日志将在此输出...</div>
        ) : (
          logsList.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-[#2D2D2D] py-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
}
