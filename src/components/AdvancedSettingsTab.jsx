import React, { useState, useEffect } from 'react';
import { Sliders, Save, ShieldAlert } from 'lucide-react';

const DEFAULTS = {
  max_thinking_tokens: 1024,
  max_output_tokens: 4096,
  max_context_length: 8192,
};

function safeParseInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdvancedSettingsTab({ configData, saveConfig }) {
  const getValidTokenValue = (val, fallback) => {
    const num = safeParseInt(val, fallback);
    return num > 0 ? num : fallback;
  };

  const [alwaysThinking, setAlwaysThinking] = useState(configData.always_thinking);
  const [maxThinkingTokens, setMaxThinkingTokens] = useState(getValidTokenValue(configData.max_thinking_tokens, DEFAULTS.max_thinking_tokens));
  const [maxOutputTokens, setMaxOutputTokens] = useState(getValidTokenValue(configData.max_output_tokens, DEFAULTS.max_output_tokens));
  const [maxContextLength, setMaxContextLength] = useState(getValidTokenValue(configData.max_context_length, DEFAULTS.max_context_length));
  const [enableAutoUpdater, setEnableAutoUpdater] = useState(configData.enable_auto_updater);
  const [autoAcceptEdits, setAutoAcceptEdits] = useState(configData.auto_accept_edits);
  const [disableAutoCompact, setDisableAutoCompact] = useState(!!configData.disable_auto_compact);

  useEffect(() => {
    setAlwaysThinking(configData.always_thinking);
    setMaxThinkingTokens(getValidTokenValue(configData.max_thinking_tokens, DEFAULTS.max_thinking_tokens));
    setMaxOutputTokens(getValidTokenValue(configData.max_output_tokens, DEFAULTS.max_output_tokens));
    setMaxContextLength(getValidTokenValue(configData.max_context_length, DEFAULTS.max_context_length));
    setEnableAutoUpdater(configData.enable_auto_updater);
    setAutoAcceptEdits(configData.auto_accept_edits);
    setDisableAutoCompact(!!configData.disable_auto_compact);
  }, [configData]);

  const handleSave = () => {
    const updated = {
      ...configData,
      always_thinking: alwaysThinking,
      max_thinking_tokens: safeParseInt(maxThinkingTokens, DEFAULTS.max_thinking_tokens),
      max_output_tokens: safeParseInt(maxOutputTokens, DEFAULTS.max_output_tokens),
      max_context_length: safeParseInt(maxContextLength, DEFAULTS.max_context_length),
      enable_auto_updater: enableAutoUpdater,
      auto_accept_edits: autoAcceptEdits,
      disable_auto_compact: disableAutoCompact,
    };
    saveConfig(updated);
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#F37042]" /> Claude Code 运行高级配置
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">精细化调整大语言模型的上下文限制、最大输出大小、及思考模型参数设定。</p>
      </div>

      <div className="space-y-4">
        {/* Toggle Switches */}
        <div className="grid grid-cols-2 gap-4 bg-[#FFFBF9] border border-[#FDECE2] p-4 rounded-2xl">
          {[
            { state: alwaysThinking, setter: setAlwaysThinking, title: '深度思考模式 (always_thinking)', desc: '强制让 Claude 总是开启思维推理，大幅提升编程代码质量' },
            { state: enableAutoUpdater, setter: setEnableAutoUpdater, title: '自动检查热更新', desc: '启动时自动检测最新的 Claude CLI 版本并静默更新' },
            { state: autoAcceptEdits, setter: setAutoAcceptEdits, title: '自动同意编辑 (auto_accept_edits)', desc: '在安全可控的前提下，允许 AI 直接向代码中写入修改，跳过提示' },
            { state: disableAutoCompact, setter: setDisableAutoCompact, title: '禁用自动压缩 (disable_auto_compact)', desc: '关闭上下文自动压缩，保留完整对话细节（会占用更多上下文空间）' },
          ].map((item, idx) => (
            <label key={idx} className="flex items-start gap-3 cursor-pointer group col-span-2 md:col-span-1">
              <input
                type="checkbox"
                checked={item.state}
                onChange={e => item.setter(e.target.checked)}
                className="accent-[#F37042] w-4 h-4 rounded mt-0.5"
              />
              <div>
                <span className="text-xs font-black text-[#4A3A31] group-hover:text-[#F37042] transition-colors">{item.title}</span>
                <p className="text-[10px] text-[#9A877B] mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Sliders / Inputs */}
        <div className="space-y-4 border-t border-dashed border-[#FEEFE6] pt-4">
          {/* 最大思考 token */}
          <div>
            <div className="flex justify-between text-xs font-black text-[#4A3A31] mb-1.5">
              <span>思维推理限制 (max_thinking_tokens)</span>
              <span className="text-[#F37042]">{maxThinkingTokens} Tokens</span>
            </div>
            <input
              type="range"
              min="512"
              max="4096"
              step="256"
              value={maxThinkingTokens}
              onChange={e => setMaxThinkingTokens(e.target.value)}
              className="w-full accent-[#F37042]"
            />
            <span className="text-[9px] text-[#9A877B] block mt-1">
              设置 Claude 3.7 推理所消耗的最大容量。高容量会得到极聪明的代码推理，但会略微拖慢回复速度。
            </span>
          </div>

          {/* 最大上下文长度 */}
          <div>
            <div className="flex justify-between text-xs font-black text-[#4A3A31] mb-1.5">
              <span>最大文件读取上下文 (max_context_length)</span>
              <span className="text-[#F37042]">{maxContextLength} Tokens</span>
            </div>
            <input
              type="range"
              min="4096"
              max="65536"
              step="4096"
              value={maxContextLength}
              onChange={e => setMaxContextLength(e.target.value)}
              className="w-full accent-[#F37042]"
            />
            <span className="text-[9px] text-[#9A877B] block mt-1">
              控制 Claude Code 搜索本地代码树时能加载的最大词容量，过大可能会耗费更多 Token。
            </span>
          </div>

          {/* 最大输出 token */}
          <div>
            <div className="flex justify-between text-xs font-black text-[#4A3A31] mb-1.5">
              <span>单词回答输出上限 (max_output_tokens)</span>
              <span className="text-[#F37042]">{maxOutputTokens} Tokens</span>
            </div>
            <input
              type="range"
              min="2048"
              max="8192"
              step="512"
              value={maxOutputTokens}
              onChange={e => setMaxOutputTokens(e.target.value)}
              className="w-full accent-[#F37042]"
            />
            <span className="text-[9px] text-[#9A877B] block mt-1">
              限制单词回答返回的内容深度。对于大段代码生成，推荐设在 4096 或以上。
            </span>
          </div>
        </div>

        {/* 提示通知 */}
        <div className="bg-[#FFF5EE] border border-[#FDECE2] p-4 rounded-2xl flex gap-3 items-start mt-2">
          <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1">注意：高级调参将直接写入本地配置文件</h4>
            <p className="text-[10px] text-[#8D7A6E] leading-relaxed">
              这些配置由 Anthropic 全局规则约束，错误设置可能导致程序运行发生超时限制，推荐使用默认配置。
            </p>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 bg-[#F37042] hover:bg-[#E06030] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] mt-2"
        >
          <Save className="w-4 h-4" /> 保存高级调优参数
        </button>
      </div>
    </div>
  );
}
