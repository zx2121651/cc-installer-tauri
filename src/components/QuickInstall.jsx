import React from 'react';
import { Download, Rocket } from 'lucide-react';

export default function QuickInstall({
  installPath,
  setInstallPath,
  cbEnv,
  setCbEnv,
  cbPath,
  setCbPath,
  cbAlias,
  setCbAlias,
  cbShortcut,
  setCbShortcut,
  handleInstall,
  isInstalling
}) {
  return (
    <div className="flex-[1.2] bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col card-hover-effect">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1 bg-blue-50 rounded-lg text-blue-500"><Download className="w-3.5 h-3.5" /></div>
        <h3 className="font-black text-sm text-[#4A3A31]">快速安装</h3>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-[11px] font-bold text-[#8D7A6E] mb-1.5">安装位置</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={installPath}
              onChange={e => setInstallPath(e.target.value)}
              placeholder="系统默认全局目录 (推荐，无需管理员权限)"
              className="flex-1 bg-[#FFFBF9] border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-medium text-[#6D5A4E] focus:outline-none focus:border-[#F37042] focus:ring-2 focus:ring-orange-100 transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2 bg-[#FAFAFA] p-3 rounded-xl border border-[#F3F3F3]">
          {[
            { state: cbEnv, setter: setCbEnv, label: '自动配置环境变量' },
            { state: cbPath, setter: setCbPath, label: '添加到系统 PATH' },
            { state: cbAlias, setter: setCbAlias, label: '配置命令别名 (claude)' },
            { state: cbShortcut, setter: setCbShortcut, label: '创建桌面快捷方式' },
          ].map((cb, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer group font-sans transition-transform duration-150 hover:translate-x-0.5">
              <input
                type="checkbox"
                checked={cb.state}
                onChange={e => cb.setter(e.target.checked)}
                className="accent-[#F37042] w-3.5 h-3.5 rounded transition-transform duration-200 active:scale-125 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-[#6D5A4E] group-hover:text-[#F37042] transition-colors">{cb.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-dashed border-[#FEEFE6] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className={`w-full py-3.5 bg-gradient-to-r from-[#FF8E62] via-[#F37042] to-[#E05D2F] text-white font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(243,112,66,0.35)] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group animate-button-shine ${
            isInstalling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(243,112,66,0.45)] active:scale-[0.98]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Rocket className={`w-4 h-4 transition-transform duration-300 ${isInstalling ? 'animate-bounce' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110'}`} />
            <span>一键安装 Claude Code</span>
          </div>
          <div className="text-[9px] font-medium opacity-90 font-mono mt-0.5">下载并完成环境自动配置</div>
        </button>
      </div>
    </div>
  );
}
