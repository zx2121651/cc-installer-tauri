import React from 'react';
import { ListTree, ChevronRight, Globe, Cpu, Archive, Terminal, Command, Sliders } from 'lucide-react';

export default function EnvOverview({ envData, checkEnv, isCheckingEnv }) {
  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] card-hover-effect">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm text-[#4A3A31] flex items-center gap-2">
          <div className="p-1 bg-orange-100 rounded-lg text-[#F37042]"><ListTree className="w-3.5 h-3.5" /></div>
          系统环境概览
        </h3>
        <button onClick={checkEnv} className="text-[11px] font-bold text-[#F37042] hover:text-[#E06030] flex items-center gap-0.5">
          重新检测 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-4">
        {[
          { icon: Globe, color: 'text-blue-500', title: '操作系统', val: 'Windows 64-bit', status: '支持', ok: true },
          { icon: Cpu, color: 'text-green-600', title: 'Node.js', val: envData.node_version || '未检测/未安装', status: envData.node_version ? '已安装' : '未就绪', ok: !!envData.node_version },
          { icon: Archive, color: 'text-red-500', title: 'npm', val: envData.npm_version || '未检测/未安装', status: envData.npm_version ? '已安装' : '未就绪', ok: !!envData.npm_version },
          { icon: Terminal, color: 'text-gray-700', title: 'Git', val: envData.git_version || '未检测/未安装', status: envData.git_version ? '已安装' : '未安装', ok: !!envData.git_version },
          { icon: Command, color: 'text-blue-700', title: 'PowerShell', val: envData.powershell_version || '不可用', status: envData.powershell_version ? '可用' : '不可用', ok: !!envData.powershell_version },
          { icon: Sliders, color: 'text-purple-600', title: '执行策略', val: envData.powershell_policy, status: envData.powershell_policy !== 'Restricted' ? '正常' : '受限', ok: envData.powershell_policy !== 'Restricted' },
        ].map((item, i) => {
          const ItemIcon = item.icon;
          return (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`mt-0.5 ${item.color}`}><ItemIcon className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-black text-[#4A3A31]">{item.title}</div>
                  <div className="text-[10px] font-medium text-[#9A877B] truncate w-[130px]">{item.val}</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
