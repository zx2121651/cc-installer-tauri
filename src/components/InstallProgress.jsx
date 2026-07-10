import React from 'react';
import { CheckCircle2, Download, Settings, Sliders, Heart } from 'lucide-react';

export default function InstallProgress({ installStep, installProgress, installStatus, isInstalling }) {
  const steps = [
    { step: 1, label: '准备环境', icon: CheckCircle2 },
    { step: 2, label: '下载包', icon: Download },
    { step: 3, label: '装依赖', icon: Settings },
    { step: 4, label: '配环境', icon: Sliders },
    { step: 5, label: '完成', icon: Heart },
  ];

  return (
    <div className="flex-1 lg:flex-[2] bg-white border border-[#FDECE2] rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <h3 className="font-black text-sm text-[#4A3A31] mb-5">安装进度</h3>
      
      <div className="relative">
        <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-[#FDECE2]" />
        <div 
          className="absolute top-[18px] left-[10%] h-0.5 bg-[#5CB85C] transition-all duration-300"
          style={{ width: `${(installStep - 1) * 20}%` }}
        />

        <div className="flex justify-between relative z-10">
          {steps.map((item, i) => {
            const StepIcon = item.icon;
            const isFinished = installProgress === 100 || !isInstalling;
            const status = (installStep > item.step || (item.step === 5 && installStep === 5 && isFinished)) 
              ? 'done' 
              : installStep === item.step 
                ? 'active' 
                : 'wait';
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-1/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  status === 'done' ? 'bg-[#5CB85C] text-white' : 
                  status === 'active' ? 'bg-white border-2 border-[#5CB85C] text-[#5CB85C] shadow-[0_0_10px_rgba(92,184,92,0.3)]' : 
                  'bg-white border-2 border-[#FDECE2] text-[#D1C6C0]'
                }`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-bold ${status === 'active' ? 'text-[#5CB85C]' : 'text-[#8D7A6E]'}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-bold text-[#8D7A6E]">
          <span>{installStatus}</span>
          <span className={installProgress > 0 && installProgress < 100 ? "text-[#5CB85C]" : ""}>{installProgress}%</span>
        </div>
        <div className="w-full h-2 bg-[#FDECE2] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#5CB85C] to-[#4CAE4C] rounded-full transition-all duration-300 relative"
            style={{ width: `${installProgress}%` }}
          >
            {isInstalling && (
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px] animate-[bounce_1s_linear_infinite]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
