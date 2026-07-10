import React, { useState, useEffect } from 'react';
import { Cpu, Save, ShieldAlert, Key, Globe, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function ApiConfigTab({ configData, saveConfig, handleInstall, isInstalling, setActiveTab }) {
  const [selectedProfileIdx, setSelectedProfileIdx] = useState(0);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  
  const [baseUrl, setBaseUrl] = useState(configData.base_url);
  const [apiKey, setApiKey] = useState(configData.api_key);
  const [customModelInput, setCustomModelInput] = useState('');

  // Local model service scanning states
  const [localUrl, setLocalUrl] = useState('http://localhost:11434');
  const [detectedModels, setDetectedModels] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // 1. Data Presets matched exactly with app.rs (Egui version) + LM Studio official first-class support
  const apiProfiles = [
    { name: '📡 CCSwitch 本地中转网关 (推荐)', url: 'http://localhost:9090', hint: 'ccswitch', defaultModelIdx: 4 },
    { name: 'SiliconFlow 硅基流动 (国内聚合)', url: 'https://api.siliconflow.cn/v1', hint: 'siliconflow', defaultModelIdx: 21 },
    { name: 'DeepSeek 官方 API', url: 'https://api.deepseek.com/v1', hint: 'deepseek', defaultModelIdx: 5 },
    { name: '智谱 GLM / Z.ai (国内直连)', url: 'https://open.bigmodel.cn/api/anthropic', hint: 'glm', defaultModelIdx: 7 },
    { name: 'Moonshot Kimi (国内直连)', url: 'https://api.moonshot.cn/v1', hint: 'kimi', defaultModelIdx: 9 },
    { name: '阿里 通义千问 Qwen (国内直连)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', hint: 'qwen', defaultModelIdx: 11 },
    { name: 'MiniMax (国内直连)', url: 'https://api.minimax.io/v1', hint: 'minimax', defaultModelIdx: 13 },
    { name: 'Google Gemini (需科学上网)', url: 'https://generativelanguage.googleapis.com/v1beta/openai', hint: 'gemini', defaultModelIdx: 15 },
    { name: 'OpenAI GPT (需科学上网)', url: 'https://api.openai.com/v1', hint: 'openai', defaultModelIdx: 17 },
    { name: 'Anthropic 官方 (需科学上网)', url: '', hint: 'anthropic', defaultModelIdx: 0 },
    { name: 'llama.cpp 本地推理', url: 'http://localhost:8080', hint: 'llamacpp', defaultModelIdx: 28 },
    { name: 'Ollama 本地推理', url: 'http://localhost:11434', hint: 'ollama', defaultModelIdx: 29 },
    { name: 'LM Studio 本地推理', url: 'http://localhost:1234', hint: 'lmstudio', defaultModelIdx: 30 },
    { name: '自定义中转 API', url: '', hint: 'any', defaultModelIdx: 33 }
  ];

  const modelPresets = [
    // ───── Anthropic 官方 (idx=9) ─────
    { name: '官方默认 (自动跟随最新 Sonnet)', id: '', hint: 'anthropic' },
    { name: 'Claude Sonnet 4 (最新, 推荐)', id: 'sonnet', hint: 'anthropic' },
    { name: 'Claude Opus 4.8+ (最强推理)', id: 'opus', hint: 'anthropic' },
    { name: 'Claude Haiku 4 (极速响应)', id: 'haiku', hint: 'anthropic' },

    // ───── CCSwitch 本地网关 (idx=0) ─────
    { name: '由 CCSwitch 管理 (推荐留空)', id: '', hint: 'ccswitch' },

    // ───── DeepSeek 官方 (idx=2) ─────
    { name: 'DeepSeek V4 Pro (旗舰编码推理)', id: 'deepseek-v4-pro', hint: 'deepseek' },
    { name: 'DeepSeek V4 Flash (高速轻量)', id: 'deepseek-v4-flash', hint: 'deepseek' },

    // ───── 智谱 GLM (idx=3) ─────
    { name: 'GLM-5.2 (旗舰, 1M 上下文)', id: 'glm-5.2', hint: 'glm' },
    { name: 'GLM-5.1 (长程任务/代码工程)', id: 'glm-5.1', hint: 'glm' },

    // ───── Kimi / Moonshot (idx=4) ─────
    { name: 'Kimi K2.7-Code (编码旗舰)', id: 'kimi-k2.7-code', hint: 'kimi' },
    { name: 'Kimi K1.5 (长文本 128K)', id: 'kimi-k1.5', hint: 'kimi' },

    // ───── 通义千问 Qwen (idx=5) ─────
    { name: 'Qwen3.7 Max (旗舰推理/Agent)', id: 'qwen3.7-max', hint: 'qwen' },
    { name: 'Qwen3.7 Plus (多模态高性价比)', id: 'qwen3.7-plus', hint: 'qwen' },

    // ───── MiniMax (idx=6) ─────
    { name: 'MiniMax-M3 (1M 上下文, Agent)', id: 'MiniMax-M3', hint: 'minimax' },
    { name: 'MiniMax-M1 (开源推理旗舰)', id: 'MiniMax-M1', hint: 'minimax' },

    // ───── Google Gemini (idx=7) ─────
    { name: 'Gemini 2.5 Pro (最强推理)', id: 'gemini-2.5-pro', hint: 'gemini' },
    { name: 'Gemini 2.5 Flash (高速低价)', id: 'gemini-2.5-flash', hint: 'gemini' },

    // ───── OpenAI GPT (idx=8) ─────
    { name: 'GPT-5.5 (旗舰)', id: 'gpt-5.5', hint: 'openai' },
    { name: 'GPT-5.5 Pro (最强旗舰)', id: 'gpt-5.5-pro', hint: 'openai' },
    { name: 'GPT-5.4 Mini (高性价比)', id: 'gpt-5.4-mini', hint: 'openai' },
    { name: 'GPT-5.4 Nano (极速轻量)', id: 'gpt-5.4-nano', hint: 'openai' },

    // ───── 硅基流动聚合 (idx=1) ─────
    { name: '硅基: DeepSeek V4 Pro', id: 'deepseek-ai/DeepSeek-V4-Pro', hint: 'siliconflow' },
    { name: '硅基: DeepSeek R1 (深度推理)', id: 'deepseek-ai/DeepSeek-R1', hint: 'siliconflow' },
    { name: '硅基: Qwen3.7 Max', id: 'Qwen/Qwen3.7-Max', hint: 'siliconflow' },
    { name: '硅基: Qwen3.6 27B', id: 'Qwen/Qwen3.6-27B', hint: 'siliconflow' },
    { name: '硅基: Kimi-K2.7-Code', id: 'moonshot-ai/Kimi-K2.7-Code', hint: 'siliconflow' },
    { name: '硅基: GLM-5.2', id: 'THUDM/GLM-5.2', hint: 'siliconflow' },
    { name: '硅基: MiniMax-M3', id: 'minimax/MiniMax-M3', hint: 'siliconflow' },

    // ───── 通用本地与自定义 ─────
    { name: '🦙 llama.cpp (自动扫描 8080 端口)', id: '__LOCAL__', hint: 'llamacpp' },
    { name: '🐋 Ollama 本地模型 (自动扫描)', id: '__LOCAL__', hint: 'ollama' },
    { name: '🖥️ LM Studio 本地模型 (自动扫描)', id: '__LOCAL__', hint: 'lmstudio' },
    { name: '🖥️ 扫描所有本地推理服务', id: '__LOCAL__', hint: 'local' },
    { name: '✏️ 手动输入任意模型 ID', id: '__CUSTOM__', hint: 'any' }
  ];

  // Get current active profile hint
  const currentProvider = apiProfiles[selectedProfileIdx].hint;

  // Filter model presets matching current profile (aligned with logic on line 1841 in app.rs)
  const isLocalProvider = currentProvider === 'ccswitch' || currentProvider === 'llamacpp' || currentProvider === 'ollama' || currentProvider === 'lmstudio' || currentProvider === 'any';
  const filteredPresets = modelPresets.filter(m => 
    m.hint === currentProvider || 
    m.hint === 'any' || 
    (m.hint === 'local' && isLocalProvider)
  );

  // Sync internal state when configData loads from backend
  useEffect(() => {
    setBaseUrl(configData.base_url);
    setApiKey(configData.api_key);

    // Try to auto-match the selected profile index based on baseUrl
    const profileIdx = apiProfiles.findIndex(p => p.url !== '' && configData.base_url?.startsWith(p.url));
    const activeIdx = profileIdx !== -1 ? profileIdx : apiProfiles.length - 1; // Default to Custom API
    setSelectedProfileIdx(activeIdx);

    // Try to match the selected model preset index
    const presetIdx = modelPresets.findIndex(p => p.id !== '' && p.id === configData.model);
    if (presetIdx !== -1) {
      const matchedModel = modelPresets[presetIdx];
      const modelInFilteredIdx = filteredPresets.findIndex(f => f.name === matchedModel.name);
      if (modelInFilteredIdx !== -1) {
        setSelectedPresetIdx(modelInFilteredIdx);
      } else {
        setSelectedPresetIdx(0);
      }
      setCustomModelInput('');
    } else if (configData.model === '') {
      setSelectedPresetIdx(0); // Follow default
      setCustomModelInput('');
    } else {
      const customIdx = filteredPresets.findIndex(f => f.id === '__CUSTOM__');
      setSelectedPresetIdx(customIdx !== -1 ? customIdx : 0);
      setCustomModelInput(configData.model || '');
    }
  }, [configData]);

  // Sync default URL and models when profile index changes
  const handleProfileChange = (idx) => {
    setSelectedProfileIdx(idx);
    const profile = apiProfiles[idx];
    if (profile.url !== '') {
      setBaseUrl(profile.url);
    }
    
    // Auto-update to profile's default model preset
    const defaultModelPreset = modelPresets[profile.defaultModelIdx];
    const newIsLocalProvider = profile.hint === 'ccswitch' || profile.hint === 'llamacpp' || profile.hint === 'ollama' || profile.hint === 'lmstudio' || profile.hint === 'any';
    const newFiltered = modelPresets.filter(m => 
      m.hint === profile.hint || 
      m.hint === 'any' || 
      (m.hint === 'local' && newIsLocalProvider)
    );
    const matchedIdx = newFiltered.findIndex(f => f.name === defaultModelPreset.name);
    setSelectedPresetIdx(matchedIdx !== -1 ? matchedIdx : 0);
    setCustomModelInput('');

    // Synchronize local service URLs automatically on channel switches
    if (profile.hint === 'ollama') {
      setLocalUrl('http://localhost:11434');
    } else if (profile.hint === 'llamacpp') {
      setLocalUrl('http://localhost:8080');
    } else if (profile.hint === 'lmstudio') {
      setLocalUrl('http://localhost:1234');
    }
  };

  const handlePresetModelChange = (idx) => {
    const selectedPreset = filteredPresets[idx];
    setSelectedPresetIdx(idx);

    if (selectedPreset.id === '__LOCAL__') {
      if (selectedPreset.hint === 'ollama') {
        setLocalUrl('http://localhost:11434');
      } else if (selectedPreset.hint === 'llamacpp') {
        setLocalUrl('http://localhost:8080');
      } else if (selectedPreset.hint === 'lmstudio') {
        setLocalUrl('http://localhost:1234');
      } else {
        setLocalUrl('http://localhost:11434'); // Default fallback
      }
    }
  };

  const handleScanLocal = async () => {
    setIsScanning(true);
    try {
      const res = await invoke('scan_local_models', { localServiceUrl: localUrl });
      setDetectedModels(res || []);
    } catch (err) {
      console.error(err);
      alert('扫描失败，请确保本地 Ollama / LM Studio 等服务已经启动，并且端口正确！');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectLocalModel = (val) => {
    if (!val || val.includes('当前运行模型') || val.includes('未检测到本地模型') || val.includes('无本地模型')) return;
    
    let parsedModel = val;
    if (val.startsWith('Ollama: ')) {
      parsedModel = val.replace('Ollama: ', '');
    } else if (val.startsWith('llama.cpp: ')) {
      parsedModel = val.replace('llama.cpp: ', '');
    } else if (val.startsWith('LM Studio: ')) {
      parsedModel = val.replace('LM Studio: ', '');
    }
    
    setCustomModelInput(parsedModel);
    setBaseUrl(localUrl);
    
    if (!apiKey || apiKey === '') {
      setApiKey('local-no-key-needed');
    }
  };

  const handleSave = () => {
    const selectedPreset = filteredPresets[selectedPresetIdx];
    let finalModel = selectedPreset.id;
    let finalBaseUrl = baseUrl;

    if (selectedPreset.id === '__LOCAL__') {
      finalModel = customModelInput || 'local-model';
      finalBaseUrl = localUrl;
    } else if (selectedPreset.id === '__CUSTOM__') {
      finalModel = customModelInput;
    }

    const updated = {
      ...configData,
      base_url: finalBaseUrl,
      api_key: apiKey,
      model: finalModel
    };
    saveConfig(updated);
  };

  // Triggers atomic save + auto switch tab to home to run the pipeline
  const handleAutoInstallClick = async () => {
    const selectedPreset = filteredPresets[selectedPresetIdx];
    let finalModel = selectedPreset.id;
    let finalBaseUrl = baseUrl;

    if (selectedPreset.id === '__LOCAL__') {
      finalModel = customModelInput || 'local-model';
      finalBaseUrl = localUrl;
    } else if (selectedPreset.id === '__CUSTOM__') {
      finalModel = customModelInput;
    }

    const updated = {
      ...configData,
      base_url: finalBaseUrl,
      api_key: apiKey,
      model: finalModel
    };
    
    try {
      await saveConfig(updated);
    } catch (e) {
      console.error('Failed to save config before install:', e);
    }

    if (handleInstall) {
      handleInstall();
    }
    
    if (setActiveTab) {
      setActiveTab('home');
    }
  };

  // Determine if we should show the local scanning panel
  const activePreset = filteredPresets[selectedPresetIdx] || {};
  const showLocalScanPanel = activePreset.id === '__LOCAL__' || currentProvider === 'ccswitch';

  // Determine if protocol mismatch alert should be shown (Ollama/llama.cpp direct connect warning)
  const isDirectLocalConnection = baseUrl.includes('11434') || baseUrl.includes('8080') || baseUrl.includes('1234');

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-hidden">
      {/* Tab Title Block */}
      <div className="bg-[#FFFBF9] border border-[#FDECE2] rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <h3 className="text-base font-black text-[#4A3A31] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#F37042]" /> 模型与 API 代理配置
        </h3>
        <p className="text-[10px] text-[#9A877B] mt-0.5">配置 Claude Code 的网络请求中转与 API 鉴权，支持直连、中转、企业代理等多种架构。</p>
      </div>

      {/* Responsive Two Column Form */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-2">
        
        {/* Left Column: API Endpoint & Authentication */}
        <div className="bg-white border border-[#FDECE2] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#F37042] border-b border-[#FEEFE6] pb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> 1. API 通道与网络接入
            </h4>

            {/* Profile Selection */}
            <div>
              <label className="block text-[11px] font-black text-[#4A3A31] mb-1.5">选择 API 预设渠道</label>
              <div className="relative">
                <select
                  value={selectedProfileIdx}
                  onChange={e => handleProfileChange(parseInt(e.target.value, 10))}
                  className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-bold text-[#4A3A31] appearance-none focus:outline-none focus:border-orange-300"
                >
                  {apiProfiles.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 w-3 h-3 text-[#9A877B] pointer-events-none flex items-center justify-center font-mono text-[9px]">▼</div>
              </div>
            </div>

            {/* Base URL Input */}
            <div>
              <label className="block text-[11px] font-black text-[#4A3A31] mb-1.5">模型 API 基准地址 (Base URL)</label>
              <input 
                type="text" 
                value={baseUrl} 
                onChange={e => setBaseUrl(e.target.value)}
                className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-300"
                placeholder="https://api.anthropic.com"
              />
              <span className="text-[9px] text-[#9A877B] mt-1 block">
                中转加速通道可填入对应中转商域名。如果直连官网请保持默认值。
              </span>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[11px] font-black text-[#4A3A31] mb-1.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-[#F37042]" /> Anthropic API Key (鉴权密钥)
              </label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-300"
                placeholder="在此粘贴 sk-ant-api03-..."
              />
              <span className="text-[9px] text-[#9A877B] mt-1 block">
                密钥将仅安全地保存在本地用户目录的 `.claude/settings.json` 中，绝不上报。
              </span>
            </div>
          </div>

          {/* Prompt/Info Notice at the bottom of left column */}
          <div className="bg-[#FFF5EE] border border-[#FDECE2] p-3.5 rounded-xl flex gap-2 items-start mt-4">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h5 className="text-[10px] font-black text-[#4A3A31] mb-0.5">计费小贴士</h5>
              <p className="text-[9px] text-[#8D7A6E] leading-relaxed">
                Claude Code 作为交互式编程 Agent，会执行代码构建、grep 诊断并读取长上下文，Token 消耗较大，请确保 API 余额充足。
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Model Preset & Local Llama/Ollama integration */}
        <div className="bg-white border border-[#FDECE2] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#F37042] border-b border-[#FEEFE6] pb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 2. 默认模型与离线环境
            </h4>

            {/* Standard Model Preset */}
            <div>
              <label className="block text-[11px] font-black text-[#4A3A31] mb-1.5">运行模型预设 (Model)</label>
              <div className="relative">
                <select 
                  value={selectedPresetIdx} 
                  onChange={e => handlePresetModelChange(parseInt(e.target.value, 10))}
                  className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-bold text-[#4A3A31] appearance-none focus:outline-none focus:border-orange-300"
                >
                  {filteredPresets.map((m, i) => (
                    <option key={i} value={i}>{m.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 w-3 h-3 text-[#9A877B] pointer-events-none flex items-center justify-center font-mono text-[9px]">▼</div>
              </div>
            </div>

            {/* Custom Model ID Sub-input */}
            {(activePreset.id === '__CUSTOM__' || activePreset.id === '__LOCAL__') && (
              <div>
                <label className="block text-[10px] font-black text-[#9A877B] mb-1.5">绑定运行的模型 ID / 名称</label>
                <input 
                  type="text" 
                  value={customModelInput}
                  onChange={e => setCustomModelInput(e.target.value)}
                  className="w-full bg-[#FFFBF9] border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-300"
                  placeholder="如: deepseek-chat 或 qwen2.5-coder:7b"
                />
              </div>
            )}

            {/* Local Model Scan panel - shown only when selecting local models */}
            {showLocalScanPanel && (
              <div className="p-3 border border-dashed border-[#FDECE2] bg-[#FFFBF9] rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-[#F37042] flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> 离线环境扫描 (Ollama / LM Studio)
                  </span>
                  <button
                    onClick={handleScanLocal}
                    disabled={isScanning}
                    className="px-2 py-1 bg-[#FFF0E5] hover:bg-[#FEE4D2] text-[#F37042] text-[9px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? '扫描中...' : '一键扫描'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-[#9A877B] mb-1">本地引擎端口地址</label>
                    <input 
                      type="text" 
                      value={localUrl} 
                      onChange={e => setLocalUrl(e.target.value)}
                      className="w-full bg-white border border-[#FEEFE6] px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-[#6D5A4E] focus:outline-none focus:border-orange-200"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-[#9A877B] mb-1">选择已识别的模型</label>
                    <div className="relative">
                      <select 
                        onChange={e => handleSelectLocalModel(e.target.value)}
                        className="w-full bg-white border border-[#FEEFE6] px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#4A3A31] appearance-none focus:outline-none focus:border-orange-200"
                      >
                        {detectedModels.length === 0 ? (
                          <option>无本地模型 (请先扫描)</option>
                        ) : (
                          detectedModels.map((m, i) => (
                            <option key={i} value={m}>{m}</option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-2 top-2.5 w-3 h-3 text-[#9A877B] pointer-events-none flex items-center justify-center font-mono text-[8px]">▼</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Protocol Mismatch warning box -> Native Compatibility Notice */}
          {isDirectLocalConnection && (
            <div className="bg-[#F0FDF4] border border-green-200 p-3 rounded-xl flex gap-2 items-start mt-2">
              <div className="w-4 h-4 text-green-600 shrink-0 mt-0.5 font-bold flex items-center justify-center text-xs">✓</div>
              <div className="min-w-0">
                <h5 className="text-[10px] font-black text-green-800">🟢 本地推理原生直连已启用</h5>
                <p className="text-[9px] text-green-700 leading-relaxed mt-0.5">
                  最新的 Ollama (0.14+)、llama.cpp 和 LM Studio 已经原生兼容并支持了 Anthropic 消息协议接口。Claude Code 可 100% 极速直接调用本地模型，已为您自动跳过网关中转以确保极致速度！
                </p>
              </div>
            </div>
          )}

          {/* Dual Action Buttons: Save Config vs. Save & Auto Install */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 border border-[#FDECE2] bg-white hover:bg-[#FFFBF9] text-[#6D5A4E] font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save className="w-4 h-4 text-[#F37042]" /> 仅保存当前配置
            </button>
            <button
              onClick={handleAutoInstallClick}
              disabled={isInstalling}
              className="flex-[1.5] py-2.5 bg-gradient-to-r from-[#F37042] to-[#E06030] hover:brightness-105 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Cpu className="w-4 h-4 animate-pulse" /> ⚡ 启动一键全自动配置安装
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
