import React from 'react';
import { Settings, Play, FileEdit, ListTree, Trash2, Wrench, ShieldCheck } from 'lucide-react';

export default function UtilityTools({ triggerTool }) {
  const tools = [
    { id: 'open_claude', icon: Play, bg: 'bg-orange-100', color: 'text-orange-500', title: '打开 Claude Code', desc: '启动 Claude 交互控制台' },
    { id: 'edit_config', icon: FileEdit, bg: 'bg-purple-100', color: 'text-purple-500', title: '配置文件编辑', desc: '记事本修改 config' },
    { id: 'env_vars', icon: ListTree, bg: 'bg-blue-100', color: 'text-blue-500', title: '环境变量管理', desc: '打开系统 PATH 属性' },
    { id: 'clean_cache', icon: Trash2, bg: 'bg-red-100', color: 'text-red-500', title: '清理缓存', desc: '清理 npm 安装缓存' },
    { id: 'fix_env', icon: Wrench, bg: 'bg-green-100', color: 'text-green-600', title: '修复安装', desc: '修复 PowerShell 执行限制' },
    { id: 'uninstall', icon: ShieldCheck, bg: 'bg-orange-100', color: 'text-orange-600', title: '卸载 Claude', desc: '从全局安全卸载 CLI' },
  ];

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1 bg-purple-50 rounded-lg text-purple-500"><Settings className="w-3.5 h-3.5" /></div>
        <h3 className="font-black text-sm text-[#4A3A31]">实用工具</h3>
      </div>

      <div className="flex flex-col gap-1">
        {tools.map((tool, i) => {
          const ToolIcon = tool.icon;
          return (
            <button 
              key={i} 
              onClick={() => triggerTool(tool.id, tool.title)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF0E8] transition-colors text-left group"
            >
              <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform`}>
                <ToolIcon className="w-4 h-4 fill-current opacity-20" />
              </div>
              <div>
                <div className="text-xs font-black text-[#4A3A31]">{tool.title}</div>
                <div className="text-[9px] font-medium text-[#9A877B]">{tool.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
