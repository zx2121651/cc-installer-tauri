import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  Home, 
  ShieldCheck, 
  Settings, 
  Cpu, 
  Terminal, 
  Command, 
  LayoutTemplate,
  Archive,
  Sliders,
  FileWarning,
  HelpCircle,
  Rocket
} from 'lucide-react';

// 导入模块化子组件
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WelcomeBanner from './components/WelcomeBanner';
import EnvOverview from './components/EnvOverview';
import QuickInstall from './components/QuickInstall';
import UtilityTools from './components/UtilityTools';
import InstallProgress from './components/InstallProgress';
import LatestNews from './components/LatestNews';
import LogsTerminal from './components/LogsTerminal';
import Footer from './components/Footer';

// 导入高级页面子组件
import EnvTab from './components/EnvTab';
import InstallConfigTab from './components/InstallConfigTab';
import ApiConfigTab from './components/ApiConfigTab';
import TerminalConfigTab from './components/TerminalConfigTab';
import ShortcutsTab from './components/ShortcutsTab';
import TemplatesTab from './components/TemplatesTab';
import BackupTab from './components/BackupTab';
import AdvancedSettingsTab from './components/AdvancedSettingsTab';
import HelpTab from './components/HelpTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [installStep, setInstallStep] = useState(1); // 1: 准备环境, 2: 下载, 3: 依赖, 4: 配置, 5: 完成
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('准备就绪');
  const [logsList, setLogsList] = useState([]);

  // 系统环境检测状态
  const [envData, setEnvData] = useState({
    node_version: null,
    npm_version: null,
    git_version: null,
    powershell_version: null,
    powershell_policy: 'Restricted'
  });
  const [isCheckingEnv, setIsCheckingEnv] = useState(false);

  // 快速安装表单状态
  const [installPath, setInstallPath] = useState('');
  const [cbEnv, setCbEnv] = useState(true);
  const [cbPath, setCbPath] = useState(true);
  const [cbAlias, setCbAlias] = useState(true);
  const [cbShortcut, setCbShortcut] = useState(false);

  // Claude 核心高级配置状态
  const [configData, setConfigData] = useState({
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
  });

  // 提示通知
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // 检测环境
  const checkEnv = async (isSilent = false) => {
    if (isCheckingEnv) return;
    setIsCheckingEnv(true);
    if (!isSilent) {
      showToast('正在扫描系统依赖环境...');
    }
    try {
      const data = await invoke('check_system_env');
      setEnvData(data);
      if (!isSilent) {
        showToast('系统环境检测完成！');
      }
    } catch (e) {
      if (!isSilent) {
        showToast(`环境检测失败: ${e}`);
      }
    } finally {
      setIsCheckingEnv(false);
    }
  };

  // 加载 Claude 配置文件高级配置
  const loadConfig = async () => {
    try {
      const res = await invoke('get_claude_config');
      setConfigData(res);
    } catch (e) {
      // 首次可能文件不存在，这是正常的，静默不报错
    }
  };

  // 保存 Claude 配置文件高级配置
  const saveConfig = async (newConfig) => {
    try {
      await invoke('save_claude_config', { config: newConfig });
      setConfigData(newConfig);
      showToast('💾 配置文件保存成功！');
    } catch (e) {
      showToast(`❌ 保存配置失败: ${e}`);
    }
  };

  // 初始化加载环境检测和配置读取
  useEffect(() => {
    checkEnv();
    loadConfig();
  }, []);

  // 智能定时环境检测轮询 (当没有 Node.js 环境或处于安装状态时开启)
  useEffect(() => {
    let timer = null;
    const hasNode = envData && envData.node_version && envData.npm_version;
    const shouldPoll = !hasNode || isInstalling;

    if (shouldPoll) {
      timer = setInterval(() => {
        checkEnv(true);
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [envData, isInstalling]);

  // 监听 Tauri 后端一键安装的事件广播
  useEffect(() => {
    let unlistenLog, unlistenProgress, unlistenStatus, unlistenFinished;
    
    const setupListeners = async () => {
      unlistenLog = await listen('install-log', (event) => {
        setLogsList(prev => [...prev, event.payload]);
      });
      unlistenProgress = await listen('install-progress', (event) => {
        setInstallProgress(event.payload);
      });
      unlistenStatus = await listen('install-status', (event) => {
        const statusText = event.payload;
        setInstallStatus(statusText);
        
        // Automatically extract step (e.g. 3/5) to synchronize the progress steps correctly
        const match = statusText.match(/(\d+)\/(\d+)/);
        if (match) {
          const currentStep = parseInt(match[1], 10);
          if (currentStep >= 1 && currentStep <= 5) {
            setInstallStep(currentStep);
          }
        }
      });
      unlistenFinished = await listen('install-finished', (event) => {
        setIsInstalling(false);
        const success = event.payload;
        if (success) {
          setInstallStep(5);
          setInstallProgress(100);
          showToast('🏆 Claude Code 全自动配置成功！已可开箱即用。');
          checkEnv();
        } else {
          showToast('❌ 安装失败，请前往「日志与排障」页面查看详情。');
        }
      });
    };

    setupListeners();

    return () => {
      if (unlistenLog) unlistenLog();
      if (unlistenProgress) unlistenProgress();
      if (unlistenStatus) unlistenStatus();
      if (unlistenFinished) unlistenFinished();
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    setLogsList([]);
    setInstallProgress(0);
    setInstallStep(1);
    setInstallStatus('正在启动一键安装引擎...');

    showToast('🚀 正在拉起全自动配置通道...');

    try {
      await invoke('start_installation', {
        config: {
          install_path: installPath,
          auto_config_env: cbEnv,
          add_to_path: cbPath,
          set_alias: cbAlias,
          create_desktop_shortcut: cbShortcut,
          custom_api_url: configData.base_url,
          api_key: configData.api_key
        }
      });
    } catch (e) {
      showToast(`启动安装失败: ${e}`);
      setIsInstalling(false);
    }
  };

  // 实用工具触发
  const triggerTool = async (toolId, name) => {
    showToast(`正在执行: ${name}...`);
    try {
      const res = await invoke('run_utility_tool', { toolId });
      showToast(`✅ ${res}`);
    } catch (e) {
      showToast(`❌ 执行失败: ${e}`);
    }
  };

  const handleStartUninstall = async (uninstallNode, uninstallClaude) => {
    if (isInstalling) return;
    setIsInstalling(true);
    setLogsList([]);
    setInstallProgress(10);
    setInstallStep(1);
    setInstallStatus('正在启动卸载清理环境进程...');
    setActiveTab('home');

    showToast('🧹 正在拉起环境清理通道...');

    try {
      await invoke('start_uninstallation', { uninstallNode, uninstallClaude });
    } catch (e) {
      showToast(`启动卸载失败: ${e}`);
      setIsInstalling(false);
    }
  };

  const tabs = [
    { id: 'home', label: '首页', desc: '概览与快速安装', icon: Home },
    { id: 'env', label: '环境检测', desc: '检测系统环境与依赖', icon: ShieldCheck },
    { id: 'install_config', label: '安装配置', desc: '安装 Claude Code', icon: Settings },
    { id: 'api', label: '模型与API配置', desc: '配置模型与 API 服务', icon: Cpu },
    { id: 'terminal', label: '终端与工具配置', desc: '配置终端与开发工具', icon: Terminal },
    { id: 'shortcuts', label: '快捷命令配置', desc: '自定义快捷命令与别名', icon: Command },
    { id: 'templates', label: '项目模板', desc: '选择或创建项目模板', icon: LayoutTemplate },
    { id: 'backup', label: '备份与恢复', desc: '备份和恢复配置', icon: Archive },
    { id: 'advanced', label: '高级设置', desc: '更多个性化设置', icon: Sliders },
    { id: 'logs', label: '日志与故障排查', desc: '查看日志与解决问题', icon: FileWarning },
    { id: 'help', label: '关于与帮助', desc: '帮助文档与支持', icon: HelpCircle },
  ];

  return (
    <div className="w-screen h-screen bg-[#FFFBF9] font-sans text-[#4A3A31] selection:bg-orange-200 overflow-hidden flex flex-col">
      
      {/* 消息提示 */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#F37042] text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-[bounce_0.5s_ease-out]">
          <Rocket className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* 主应用容器 — 撑满整个窗口 */}
      <div className="flex-1 bg-[#FFFBF9] overflow-hidden flex flex-col">
        
        {/* 顶部栏组件 */}
        <Header checkEnv={checkEnv} isCheckingEnv={isCheckingEnv} />

        <div className="flex flex-1 overflow-hidden relative">
          
          {/* 左侧边栏组件 */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

          {/* 右侧主内容区 */}
          <div className="flex-1 bg-[#FFFBF9] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 relative">
            
            {activeTab === 'home' && (
              <>
                <WelcomeBanner />

                {/* 首页自适应响应式网格区 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  <EnvOverview envData={envData} checkEnv={checkEnv} isCheckingEnv={isCheckingEnv} />
                  <QuickInstall 
                    installPath={installPath} 
                    setInstallPath={setInstallPath}
                    cbEnv={cbEnv} 
                    setCbEnv={setCbEnv}
                    cbPath={cbPath} 
                    setCbPath={setCbPath}
                    cbAlias={cbAlias} 
                    setCbAlias={setCbAlias}
                    cbShortcut={cbShortcut} 
                    setCbShortcut={setCbShortcut}
                    handleInstall={handleInstall}
                    isInstalling={isInstalling}
                  />
                  <UtilityTools triggerTool={triggerTool} />
                </div>

                {/* 首页底部双列网格 */}
                <div className="flex flex-col lg:flex-row gap-5 pb-4">
                  <InstallProgress 
                    installStep={installStep} 
                    installProgress={installProgress} 
                    installStatus={installStatus} 
                    isInstalling={isInstalling} 
                  />
                  <LatestNews />
                </div>
              </>
            )}

            {/* 环境检测详细页 */}
            {activeTab === 'env' && (
              <EnvTab envData={envData} checkEnv={checkEnv} isCheckingEnv={isCheckingEnv} triggerTool={triggerTool} />
            )}

            {/* 安装配置详细页 */}
            {activeTab === 'install_config' && (
              <InstallConfigTab 
                installPath={installPath} 
                setInstallPath={setInstallPath}
                cbEnv={cbEnv} 
                setCbEnv={setCbEnv}
                cbPath={cbPath} 
                setCbPath={setCbPath}
                cbAlias={cbAlias} 
                setCbAlias={setCbAlias}
                cbShortcut={cbShortcut} 
                setCbShortcut={setCbShortcut}
                handleInstall={handleInstall}
                isInstalling={isInstalling}
                triggerTool={triggerTool}
              />
            )}

            {/* API 与模型配置页 */}
            {activeTab === 'api' && (
              <ApiConfigTab 
                configData={configData} 
                saveConfig={saveConfig} 
                handleInstall={handleInstall}
                isInstalling={isInstalling}
                setActiveTab={setActiveTab}
              />
            )}

            {/* 终端与网络代理配置页 */}
            {activeTab === 'terminal' && (
              <TerminalConfigTab configData={configData} saveConfig={saveConfig} />
            )}

            {/* 快捷别名配置页 */}
            {activeTab === 'shortcuts' && (
              <ShortcutsTab triggerTool={triggerTool} />
            )}

            {/* 项目模板市场页 */}
            {activeTab === 'templates' && (
              <TemplatesTab showToast={showToast} />
            )}

            {/* 备份与重置页 */}
            {activeTab === 'backup' && (
              <BackupTab configData={configData} saveConfig={saveConfig} showToast={showToast} handleStartUninstall={handleStartUninstall} />
            )}

            {/* 高级性能调优页 */}
            {activeTab === 'advanced' && (
              <AdvancedSettingsTab configData={configData} saveConfig={saveConfig} />
            )}

            {/* 日志详情排错页 */}
            {activeTab === 'logs' && (
              <LogsTerminal logsList={logsList} />
            )}

            {/* 帮助 FAQ 页 */}
            {activeTab === 'help' && (
              <HelpTab />
            )}
          </div>
        </div>

        {/* 底部状态栏组件 */}
        <Footer setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
