import React from 'react';
import { Archive, Download, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

const DEFAULT_CONFIG = {
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

export default function BackupTab({ configData, saveConfig, showToast, handleStartUninstall }) {
  const handleBackup = () => {
    const includeSecrets = window.confirm(
      '备份是否包含 API Key？\n\n选择「确定」将导出完整密钥（请妥善保管文件）。\n选择「取消」将导出脱敏备份（推荐）。'
    );

    const exportData = {
      ...configData,
      api_key: includeSecrets ? (configData.api_key || '') : '***REDACTED***',
      _backup_meta: {
        version: '1.2.4',
        redacted: !includeSecrets,
        exported_at: new Date().toISOString()
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'claude_code_config_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(includeSecrets ? '💾 完整配置备份已导出（含密钥）' : '💾 脱敏配置备份已导出');
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          showToast('❌ 无效的配置文件格式');
          return;
        }
        if (parsed.base_url === undefined && parsed.api_key === undefined && parsed.model === undefined) {
          showToast('❌ 无效的配置文件，缺少必要字段');
          return;
        }

        if (!window.confirm('确定用备份覆盖当前配置吗？此操作会写入 settings.json。')) {
          return;
        }

        const restoredKey =
          typeof parsed.api_key === 'string' && parsed.api_key !== '***REDACTED***'
            ? parsed.api_key
            : configData.api_key || '';

        const merged = {
          ...DEFAULT_CONFIG,
          ...configData,
          ...parsed,
          api_key: restoredKey,
          always_thinking: typeof parsed.always_thinking === 'boolean' ? parsed.always_thinking : DEFAULT_CONFIG.always_thinking,
          max_thinking_tokens: Number.isFinite(Number(parsed.max_thinking_tokens)) ? Number(parsed.max_thinking_tokens) : DEFAULT_CONFIG.max_thinking_tokens,
          max_output_tokens: Number.isFinite(Number(parsed.max_output_tokens)) ? Number(parsed.max_output_tokens) : DEFAULT_CONFIG.max_output_tokens,
          max_context_length: Number.isFinite(Number(parsed.max_context_length)) ? Number(parsed.max_context_length) : DEFAULT_CONFIG.max_context_length,
          enable_auto_updater: typeof parsed.enable_auto_updater === 'boolean' ? parsed.enable_auto_updater : DEFAULT_CONFIG.enable_auto_updater,
          auto_accept_edits: typeof parsed.auto_accept_edits === 'boolean' ? parsed.auto_accept_edits : DEFAULT_CONFIG.auto_accept_edits,
          disable_auto_compact: typeof parsed.disable_auto_compact === 'boolean' ? parsed.disable_auto_compact : DEFAULT_CONFIG.disable_auto_compact,
        };
        delete merged._backup_meta;

        saveConfig(merged);
        showToast('✅ 配置备份恢复成功！');
      } catch (err) {
        showToast('❌ 解析备份 JSON 失败，文件格式有误');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!window.confirm('确定恢复出厂默认配置？当前 API Key 与自定义参数将被清空。')) return;
    saveConfig({ ...DEFAULT_CONFIG });
    showToast('🔄 已恢复出厂默认配置！');
  };

  const confirmUninstall = (uninstallNode, uninstallClaude, label) => {
    if (!window.confirm(`危险操作：${label}\n\n确定继续吗？此操作不可轻易撤销。`)) return;
    handleStartUninstall(uninstallNode, uninstallClaude);
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#F37042]" /> 备份与出厂配置恢复
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">导出配置偏好参数；导出时可选择是否包含 API Key。也可一键恢复默认或卸载环境。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 备份与恢复 */}
        <div className="border border-[#FDECE2] rounded-2xl p-5 bg-[#FFFBF9] flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> 安全备份与恢复</h4>
            <p className="text-[10px] text-[#9A877B] leading-relaxed">
              默认推荐脱敏导出（不含 API Key）。完整密钥备份请仅保存在本地安全位置，勿上传网盘或发给他人。
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
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
              重置配置将恢复出厂默认值。卸载会擦除 Node.js 或全局 Claude CLI，请谨慎操作。
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
            >
              一键清除自定义，恢复默认
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => confirmUninstall(false, true, '仅卸载 Claude CLI')}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-xl shadow-sm transition-all text-center hover:scale-[1.01] active:scale-[0.98]"
              >
                仅卸载 Claude CLI
              </button>
              <button
                type="button"
                onClick={() => confirmUninstall(true, false, '完全卸载 Node.js 环境')}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-xl shadow-sm transition-all text-center hover:scale-[1.01] active:scale-[0.98]"
              >
                完全卸载 Node 环境
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
