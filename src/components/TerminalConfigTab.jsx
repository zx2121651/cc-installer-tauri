import React, { useState, useEffect } from 'react';
import { Terminal, Save, ShieldAlert } from 'lucide-react';

const toUiTheme = (theme) => {
  if (theme === 'auto' || theme === 'system') return 'system';
  if (theme === 'dark' || theme === 'light') return theme;
  return 'light';
};

const toBackendTheme = (theme) => (theme === 'system' ? 'auto' : theme);

export default function TerminalConfigTab({ configData, saveConfig }) {
  const [httpProxy, setHttpProxy] = useState(configData.http_proxy);
  const [noProxy, setNoProxy] = useState(configData.no_proxy);
  const [theme, setTheme] = useState(toUiTheme(configData.theme));

  useEffect(() => {
    setHttpProxy(configData.http_proxy);
    setNoProxy(configData.no_proxy);
    setTheme(toUiTheme(configData.theme));
  }, [configData]);

  const handleSave = () => {
    const updated = {
      ...configData,
      http_proxy: httpProxy,
      no_proxy: noProxy,
      theme: toBackendTheme(theme)
    };
    saveConfig(updated);
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[#F37042]" /> 终端与网络代理配置
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">配置本地终端偏好、网络代理服务器（以打通大陆网络环境）及显示主题样式。</p>
      </div>

      <div className="space-y-4">
        {/* HTTP / HTTPS 代理 */}
        <div>
          <label className="block text-xs font-black text-[#4A3A31] mb-2">HTTP / HTTPS 网络代理 (http_proxy)</label>
          <input
            type="text"
            value={httpProxy}
            onChange={e => setHttpProxy(e.target.value)}
            className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-300"
            placeholder="http://127.0.0.1:7890"
          />
          <span className="text-[10px] text-[#9A877B] mt-1.5 block">
            输入您的本地 HTTP 代理地址，如果您使用科学上网客户端，可填写代理端口以加速与 Anthropic 官方的连接。
          </span>
        </div>

        {/* 绕过代理范围 */}
        <div>
          <label className="block text-xs font-black text-[#4A3A31] mb-2">绕过代理域名/网段 (no_proxy)</label>
          <input
            type="text"
            value={noProxy}
            onChange={e => setNoProxy(e.target.value)}
            className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-300"
            placeholder="localhost, 127.0.0.1, .local"
          />
          <span className="text-[10px] text-[#9A877B] mt-1.5 block">
            以逗号分隔，定义哪些域名或网段直连，不走代理。通常包含本地开发测试的环回地址。
          </span>
        </div>

        {/* 终端主题 */}
        <div>
          <label className="block text-xs font-black text-[#4A3A31] mb-2">终端渲染主题 (Theme)</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: '暗黑主题 (Dark)', desc: '极客风黑色背景' },
              { id: 'light', label: '亮色主题 (Light)', desc: '清晰高对比白背景' },
              { id: 'system', label: '跟随系统', desc: '根据系统设置自动' }
            ].map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                  theme === t.id
                    ? 'border-[#F37042] bg-[#FFF5EE] shadow-sm'
                    : 'border-[#FDECE2] hover:bg-[#FFFBF9]'
                }`}
              >
                <span className="text-xs font-black text-[#4A3A31]">{t.label}</span>
                <span className="text-[9px] text-[#9A877B] mt-1.5 scale-95 origin-left leading-relaxed">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 提示通知 */}
        <div className="bg-[#FFF5EE] border border-[#FDECE2] p-4 rounded-2xl flex gap-3 items-start mt-2">
          <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1">注意：网络代理配置的时效性</h4>
            <p className="text-[10px] text-[#8D7A6E] leading-relaxed">
              部分 VPN 客户端关闭后，本地代理端口将不再可用，请及时修改或移除本设置以避免 Claude Code CLI 发生网络中断。
            </p>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 bg-[#F37042] hover:bg-[#E06030] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] mt-2"
        >
          <Save className="w-4 h-4" /> 保存终端网络配置
        </button>
      </div>
    </div>
  );
}
