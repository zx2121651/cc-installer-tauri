import React from 'react';
import { CheckCircle2, Download, Settings, Sliders, Heart } from 'lucide-react';

export default function InstallProgress({ installStep, installProgress, installStatus, isInstalling, opType }) {
  const steps = [
    { step: 1, label: '准备环境', icon: CheckCircle2 },
    { step: 2, label: '下载包', icon: Download },
    { step: 3, label: '装依赖', icon: Settings },
    { step: 4, label: '配环境', icon: Sliders },
    { step: 5, label: '完成', icon: Heart },
  ];
  const title = opType === 'uninstall' ? '卸载进度' : '安装进度';

  return (
    <div className="flex-1 lg:flex-[2] bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] card-hover-effect">
      <h3 className="font-black text-sm text-[#4A3A31] mb-5">{title}</h3>
      
      <div className="relative">
        <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-[#FDECE2]" />
        <div 
          className="absolute top-[18px] left-[10%] h-0.5 bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, (installStep - 1) * 25))}%` }}
        />

        <div className="flex justify-between relative z-10">
          {steps.map((item, i) => {
            const StepIcon = item.icon;
            // Idle: all waiting. Active: current step. Success: all done.
            const isSuccess = !isInstalling && installProgress === 100;
            const isIdle = !isInstalling && installProgress === 0;
            let status = 'wait';
            if (isSuccess || installStep > item.step) {
              status = 'done';
            } else if (!isIdle && installStep === item.step) {
              status = isInstalling ? 'active' : 'wait';
            } else if (isSuccess && item.step === 5) {
              status = 'done';
            }
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-1/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'done' ? 'bg-green-500 text-white scale-105 shadow-[0_2px_8px_rgba(34,197,94,0.2)]' :
                  status === 'active' ? 'bg-white border-2 border-[#F37042] text-[#F37042] animate-pulse-glow scale-110' :
                  'bg-white border-2 border-[#FDECE2] text-[#D1C6C0]'
                }`}>
                  <StepIcon className={`w-5 h-5 ${status === 'active' ? 'animate-bounce' : ''}`} />
                </div>
                <span className={`text-[11px] font-bold transition-all duration-300 ${
                  status === 'done' ? 'text-green-600' :
                  status === 'active' ? 'text-[#F37042] scale-105' :
                  'text-[#8D7A6E]'
                }`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-bold text-[#8D7A6E]">
          <span className="transition-all duration-300">{installStatus}</span>
          <span className={installProgress > 0 && installProgress < 100 ? "text-[#F37042] animate-pulse" : ""}>{installProgress}%</span>
        </div>
        <div className="w-full h-2 bg-[#FDECE2] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out relative ${
              isInstalling && installProgress < 100 ? 'animate-shimmer' : 'bg-green-500'
            }`}
            style={{ width: `${installProgress}%` }}
          >
          </div>
        </div>
      </div>
    </div>
  );
}
