import React from 'react';
import { Archive, Download, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BackupTab({ configData, saveConfig, showToast, handleStartUninstall }) {
  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "claude_code_config_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 配置文件备份包已成功生成并下载！');
  };

  const handleRestore = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.base_url !== undefined && parsed.api_key !== undefined) {
          saveConfig(parsed);
          showToast('✅ 配置备份恢复成功！');
        } else {
          showToast('❌ 无效的配置文件，缺少必要字段');
        }
      } catch (err) {
        showToast('❌ 解析备份 JSON 失败，文件格式有误');
      }
    };
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0]);
    }
  };

  const handleReset = () => {
    const defaults = {
      base_url: 'https://api.anthropic.com',
      api_key: '',
      model: 'claude-sonnet-5',
      always_thinking: true,
      max_thinking_tokens: 1024,
      disable_auto_compact: false,
      max_output_tokens: 4096,
      max_context_length: 8192,
      enable_auto_updater: true,
      http_proxy: '',
      no_proxy: '',
      auto_accept_edits: true,
      theme: 'light'
    };
    saveConfig(defaults);
    showToast('🔄 已恢复出厂默认配置！');
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#F37042]" /> 备份与出厂配置恢复
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">导出您的 Claude 鉴权配置、代理和偏好参数作为备份，或者一键重新初始化它。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 备份与恢复 */}
        <div className="border border-[#FDECE2] rounded-2xl p-5 bg-[#FFFBF9] flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> 安全备份与恢复</h4>
            <p className="text-[10px] text-[#9A877B] leading-relaxed">
              将当前的配置文件打包并导出为 JSON 本地离线文件。此文件可用于在其他电脑上一键还原您当前的一切偏好设置。
            </p>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleBackup}
              className="w-full py-2.5 bg-[#F37042] hover:bg-[#E06030] text-white text-xs font-black rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> 导出当前配置备份
            </button>
            
            <label className="w-full py-2.5 bg-white border border-[#FDECE2] text-[#6D5A4E] text-xs font-black rounded-xl shadow-sm hover:bg-[#FFF0E5] hover:text-[#F37042] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-4 h-4" /> 导入本地备份还原...
              <input type="file" onChange={handleRestore} className="hidden" accept=".json" />
            </label>
          </div>
        </div>

        {/* 危险区 */}
        <div className="border border-red-100 rounded-2xl p-5 bg-red-50/20 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-red-600 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> 重度重置与卸载危险区</h4>
            <p className="text-[10px] text-red-500/80 leading-relaxed">
              重置配置将恢复出厂默认值。卸载环境支持静默擦除您系统上已配置的 Node.js 运行时或全局已安装的 Claude CLI。请务必谨慎操作！
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={handleReset}
              className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
            >
              一键清除自定义，恢复默认
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStartUninstall(false, true)}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-xl shadow-sm transition-all text-center hover:scale-[1.01] active:scale-[0.98]"
              >
                🗑️ 仅卸载 Claude CLI
              </button>
              <button
                onClick={() => handleStartUninstall(true, false)}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-xl shadow-sm transition-all text-center hover:scale-[1.01] active:scale-[0.98]"
              >
                💀 完全卸载 Node 环境
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
