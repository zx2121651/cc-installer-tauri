import React, { useState } from 'react';
import { HelpCircle, ChevronRight, BookOpen, Lightbulb, LifeBuoy } from 'lucide-react';

export default function HelpTab() {
  const faqs = [
    {
      q: '为什么提示我“无法加载文件，因为在此系统上禁止运行脚本”？',
      a: '这是由于 Windows 默认的 PowerShell 脚本执行策略受限导致的。您只需要在“首页”的“实用工具”卡片中，点击一次“修复安装（修复 PowerShell 执行限制）”按钮，本配置工具便会自动调用后台 API 将当前用户的执行策略配置为 `RemoteSigned` 以允许 npm 全局工具启动运行。'
    },
    {
      q: '如何在中国大陆无科学上网使用 Claude Code？',
      a: '您可以向服务商购买 Anthropic 的中转代理端点，并在“模型与 API 代理”面板中输入您的中转 API 地址（即修改 Base URL 为您中转服务商的域名地址）和 API Key 密钥，并保存配置，便能直接免代理高速直连使用！'
    },
    {
      q: '一键安装完成后，如何在我的项目目录中使用？',
      a: '安装成功并配置别名后，您只需要打开您的项目根文件夹目录，按住 `Shift` 键并在空白处右击选择“在此处打开 PowerShell/终端”，然后直接输入 `claude` 回车即可自动唤醒进入交互对话！'
    },
    {
      q: '什么是“思维推理限制 (max_thinking_tokens)”？',
      a: '这是 Claude 3.7 Sonnet 独有的思考特征。大模型能够像人类一样，在回答前在后台进行大段的草稿演算，以获得逻辑精确的代码。设为较高值（例如 1024 以上）能够得到无 Bug 的代码推理，但单次响应的时间会由于模型思索过程变长而相应增加。'
    }
  ];

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#F37042]" /> 关于与帮助中心
        </h3>
        <p className="text-xs text-[#9A877B] mt-1">快速上手使用 Claude Code 极速终端交互，排查您在使用中可能遇到的各种疑难报错。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#FEEFE6] pb-5">
        <a
          href="https://docs.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 border border-[#FDECE2] bg-[#FFFBF9] rounded-2xl flex flex-col justify-between hover:border-orange-300 transition-colors group"
        >
          <div>
            <div className="p-2 bg-[#FFF0E5] text-[#F37042] rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1.5">官网文档 (Documentation)</h4>
            <p className="text-[10px] text-[#9A877B] leading-relaxed mb-3">查看 Anthropic 官方的 Claude Code 完整操作指南及参数详解。</p>
          </div>
          <span className="text-[10px] font-bold text-[#F37042] flex items-center gap-0.5 mt-auto">
            访问网址 <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </a>

        <div className="p-4 border border-[#FDECE2] bg-[#FFFBF9] rounded-2xl flex flex-col justify-between">
          <div>
            <div className="p-2 bg-[#FFF0E5] text-[#F37042] rounded-xl w-fit mb-3">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-[#4A3A31] mb-1.5">产品支持 (Support)</h4>
            <p className="text-[10px] text-[#9A877B] leading-relaxed mb-3">
              如需版本更新、技术支持或商务合作，请通过您的产品渠道联系客户支持，不提供公开下载页。
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#9A877B] mt-auto">
            商业版 · 授权用户专属服务
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-black text-[#4A3A31] mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" /> 常见问题 FAQ 排障指南
        </h4>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border border-[#FDECE2] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 bg-[#FFFBF9] hover:bg-[#FFF5EE] text-left flex justify-between items-center transition-colors"
                >
                  <span className="text-xs font-black text-[#4A3A31]">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-[#9A877B] transition-transform ${isOpen ? 'rotate-90 text-[#F37042]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-4 bg-white border-t border-[#FEEFE6] text-[11px] text-[#6D5A4E] leading-relaxed font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
