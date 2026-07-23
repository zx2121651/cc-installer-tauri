import React from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function EnvTab({ envData, checkEnv, isCheckingEnv, triggerTool }) {
  const envItems = [
    { name: 'Node.js 运行时环境', value: envData.node_version, desc: '运行 JS 项目及 CLI 程序的底层基石（推荐 v18 或 v20+）', rec: '>=18.0.0' },
    { name: 'npm 包管理器', value: envData.npm_version, desc: '安装管理全局及项目内第三方依赖包', rec: '>=9.0.0' },
    { name: 'Git 版本控制工具', value: envData.git_version, desc: '提供版本提交、项目追踪，Claude Code 需要 Git 管理项目', rec: '>=2.0.0' },
    { name: 'Windows PowerShell', value: envData.powershell_version, desc: '命令行终端解释器', rec: '>=5.1' },
    { name: 'PowerShell 执行策略', value: envData.powershell_policy, desc: '控制脚本的运行权限。Restricted 会阻止 npm 包运行', rec: 'RemoteSigned / Unrestricted' }
  ];

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-[#FEEFE6] pb-4">
        <div>
          <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F37042]" /> 系统依赖环境检测中心
          </h3>
          <p className="text-xs text-[#9A877B] mt-1">深度扫描并诊断 Claude Code 所需的本地依赖项，保证稳定运行。</p>
        </div>
        <button
          type="button"
          onClick={checkEnv}
          disabled={isCheckingEnv}
          className={`flex items-center gap-1.5 text-xs font-bold text-white bg-[#F37042] hover:bg-[#E06030] px-4 py-2 rounded-xl shadow-md transition-colors ${
            isCheckingEnv ? 'opacity-60 cursor-not-allowed hover:bg-[#F37042]' : ''
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingEnv ? 'animate-spin' : ''}`} /> 重新扫描系统
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {envItems.map((item, i) => {
          const isOk = item.value && item.value !== '未检测' && item.value !== 'Restricted';
          return (
            <div key={i} className="border border-[#FDECE2] rounded-2xl p-4 bg-[#FFFBF9] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black text-[#4A3A31]">{item.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOk ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {isOk ? (
                      <><CheckCircle2 className="w-3 h-3" /> 准备就绪</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3" /> 状态异常</>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-[#9A877B] leading-relaxed mb-3">{item.desc}</p>
              </div>

              <div className="bg-white border border-[#FEEFE6] p-2.5 rounded-xl flex items-center justify-between text-xs mt-2">
                <div>
                  <span className="text-[10px] text-[#9A877B]">检测到版本:</span>
                  <div className="font-mono font-bold text-[#4A3A31] mt-0.5">{item.value || '未检测到安装'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#9A877B]">推荐要求:</span>
                  <div className="font-mono font-medium text-[#6D5A4E] mt-0.5">{item.rec}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#FFF5EE] border border-[#FDECE2] rounded-2xl p-4 flex gap-3 items-start mt-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-black text-[#4A3A31] mb-1">提示：PowerShell 脚本执行策略受限？</h4>
          <p className="text-[11px] text-[#8D7A6E] leading-relaxed mb-3">
            若您的执行策略显示为 `Restricted`，在后续使用 CLI 编程时，可能会遇到“禁止运行脚本”的报错错误。您可以通过右侧的修复工具一键设置，或手动在 PowerShell 管理员中运行 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`。
          </p>
          <button
            type="button"
            onClick={() => triggerTool('fix_env', '修复 PowerShell 执行限制')}
            className="text-[10px] font-bold bg-white text-[#F37042] border border-[#FDECE2] px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#FFF0E5] transition-colors"
          >
            一键修复执行策略
          </button>
        </div>
      </div>
    </div>
  );
}
