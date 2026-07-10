import React, { useState } from 'react';
import { Settings, Folder, Rocket, RefreshCw, Trash2, Check } from 'lucide-react';

export default function InstallConfigTab({
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
  isInstalling,
  triggerTool
}) {
  const [registryMode, setRegistryMode] = useState('mirror'); // mirror, official, custom
  const [customRegistry, setCustomRegistry] = useState('https://registry.npmjs.org');

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#F37042]" /> Claude Code 部署与安装设置
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">深度自定义全局包安装配置，完美配合开发者的本地安装偏好。</p>
      </div>

      <div className="space-y-5">
        {/* 安装位置 */}
        <div className="border-b border-[#FEEFE6] pb-4">
          <label className="block text-xs font-black text-[#4A3A31] mb-2">全局安装前缀路径 (Prefix)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={installPath} 
              onChange={e => setInstallPath(e.target.value)}
              placeholder="系统默认全局目录 (推荐，无需管理员权限)"
              className="flex-1 bg-[#FFFBF9] border border-[#FDECE2] px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#6D5A4E] focus:outline-none focus:border-orange-300"
            />
          </div>
          <span className="text-[10px] text-[#9A877B] mt-1.5 block">
            默认情况下会全局装到 npm default path，通常是 `%APPDATA%\npm`。可设定自定义的 CLI 独立运行前缀。
          </span>
        </div>

        {/* 镜像源设置 */}
        <div className="border-b border-[#FEEFE6] pb-4">
          <label className="block text-xs font-black text-[#4A3A31] mb-2">npm 依赖下载镜像源 (Registry)</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'mirror', label: '淘宝/华为镜像源 (加速)', desc: '适合中国大陆网络极速部署' },
              { id: 'official', label: 'npm 官方源 (直接)', desc: '推荐海外开发者或全局代理' },
              { id: 'custom', label: '自定义 Registry', desc: '用于企业内网或专属私有源' }
            ].map(source => (
              <button
                key={source.id}
                onClick={() => setRegistryMode(source.id)}
                className={`p-3.5 border rounded-2xl text-left flex flex-col justify-between transition-all ${
                  registryMode === source.id 
                    ? 'border-[#F37042] bg-[#FFF5EE] shadow-sm' 
                    : 'border-[#FDECE2] hover:bg-[#FFFBF9]'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-black text-[#4A3A31]">{source.label}</span>
                  {registryMode === source.id && <div className="w-3.5 h-3.5 rounded-full bg-[#F37042] flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></div>}
                </div>
                <span className="text-[9px] text-[#9A877B] mt-2 scale-95 origin-left leading-relaxed">{source.desc}</span>
              </button>
            ))}
          </div>
          
          {registryMode === 'custom' && (
            <input 
              type="text" 
              value={customRegistry}
              onChange={e => setCustomRegistry(e.target.value)}
              className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#6D5A4E] focus:outline-none focus:border-orange-300 mt-3"
              placeholder="请输入自定义源地址 (例如：https://registry.npm.org)"
            />
          )}
        </div>

        {/* 环境变量配置项 */}
        <div className="bg-[#FFFBF9] border border-[#FDECE2] p-4 rounded-2xl">
          <label className="block text-xs font-black text-[#4A3A31] mb-3">环境变量注入设定</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { state: cbEnv, setter: setCbEnv, title: '自动配置环境变量', desc: '安装后在后端注册相关的 Claude 加速加速变量' },
              { state: cbPath, setter: setCbPath, title: '添加到系统 PATH', desc: '添加 node 或者是自定义路径到用户的 PATH 环境变量中' },
              { state: cbAlias, setter: setCbAlias, title: '配置命令别名 (claude)', desc: '自动在 PowerShell 配置文件中注入别名' },
              { state: cbShortcut, setter: setCbShortcut, title: '创建桌面快捷方式', desc: '一键生成桌面打开 Claude Code 的命令行快捷图标' },
            ].map((cb, idx) => (
              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={cb.state} 
                  onChange={e => cb.setter(e.target.checked)}
                  className="accent-[#F37042] w-4 h-4 rounded mt-0.5"
                />
                <div>
                  <span className="text-xs font-black text-[#4A3A31] group-hover:text-[#F37042] transition-colors">{cb.title}</span>
                  <p className="text-[10px] text-[#9A877B] mt-0.5 leading-relaxed">{cb.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 操作动作 */}
        <div className="flex gap-4 pt-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={`flex-1 py-3 bg-gradient-to-r from-[#FF8E62] to-[#F37042] hover:from-[#FF7D4D] hover:to-[#E05D2F] text-white font-black text-sm rounded-xl shadow-[0_4px_12px_rgba(243,112,66,0.2)] transition-all text-center flex items-center justify-center gap-2 ${isInstalling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.98]'}`}
          >
            <Rocket className="w-4 h-4" /> 确认部署并开始安装
          </button>
          
          <button
            onClick={() => triggerTool('clean_cache', '清理缓存')}
            className="flex items-center gap-1.5 px-4 bg-white border border-[#FDECE2] text-xs font-bold text-[#6D5A4E] rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> 清理 npm 缓存
          </button>
        </div>
      </div>
    </div>
  );
}
