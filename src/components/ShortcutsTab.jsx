import React, { useState } from 'react';
import { Command, Plus, Trash2, Check, RefreshCw } from 'lucide-react';

export default function ShortcutsTab({ triggerTool }) {
  const [aliases, setAliases] = useState([
    { alias: 'claude', cmd: 'npm install -g @anthropic-ai/claude-code', active: true, desc: '官方 CLI 的标准启动指令' },
    { alias: 'c', cmd: 'claude', active: true, desc: '极简极速交互模式启动别名' },
    { alias: 'cc', cmd: 'claude --thinking', active: false, desc: '自动开启深度思考分析的快捷启动' }
  ]);

  const [newAlias, setNewAlias] = useState('');
  const [newCmd, setNewCmd] = useState('');

  const addAlias = () => {
    if (!newAlias || !newCmd) return;
    setAliases([...aliases, { alias: newAlias, cmd: newCmd, active: true, desc: '自定义配置命令别名' }]);
    setNewAlias('');
    setNewCmd('');
  };

  const removeAlias = (idx) => {
    setAliases(aliases.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex-1 bg-white border border-[#FDECE2] rounded-[20px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-[#FEEFE6] pb-4">
        <div>
          <h3 className="text-lg font-black text-[#4A3A31] flex items-center gap-2">
            <Command className="w-5 h-5 text-[#F37042]" /> 快捷命令与 Shell 别名配置
          </h3>
          <p className="text-xs text-[#9A877B] mt-1">配置命令行别名（Aliases），让您可以只敲击单个按键一键唤起强大的 Claude Code 机器人。</p>
        </div>
        <button 
          onClick={() => triggerTool('fix_env', '配置命令别名')}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#F37042] hover:bg-[#E06030] px-4 py-2 rounded-xl shadow-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 刷新并同步本地别名
        </button>
      </div>

      <div className="space-y-4">
        {/* 新增别名 */}
        <div className="bg-[#FFFBF9] border border-[#FDECE2] p-4 rounded-2xl flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-[#8D7A6E] mb-1.5">输入触发别名 (Alias)</label>
            <input 
              type="text" 
              value={newAlias}
              onChange={e => setNewAlias(e.target.value)}
              className="w-full bg-white border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-bold text-[#4A3A31] focus:outline-none focus:border-orange-300"
              placeholder="例如: c"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] font-black text-[#8D7A6E] mb-1.5">映射目标命令行指令 (Command)</label>
            <input 
              type="text" 
              value={newCmd}
              onChange={e => setNewCmd(e.target.value)}
              className="w-full bg-white border border-[#FDECE2] px-3 py-2 rounded-xl text-xs font-bold text-[#4A3A31] focus:outline-none focus:border-orange-300"
              placeholder="例如: claude --thinking"
            />
          </div>
          <button 
            onClick={addAlias}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5CB85C] hover:bg-[#4CAE4C] text-white text-xs font-black rounded-xl transition-colors h-[37px]"
          >
            <Plus className="w-4 h-4" /> 添加
          </button>
        </div>

        {/* 列表 */}
        <div className="border border-[#FDECE2] rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF5EE] border-b border-[#FDECE2] text-[#8D7A6E] font-black">
                <th className="p-3">快捷别名</th>
                <th className="p-3">目标映射命令</th>
                <th className="p-3">描述说明</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FEEFE6] text-[#4A3A31] font-medium">
              {aliases.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FFFBF9] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#F37042]">{item.alias}</td>
                  <td className="p-3 font-mono text-gray-600">{item.cmd}</td>
                  <td className="p-3 text-[#9A877B] text-[10px]">{item.desc}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => removeAlias(idx)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
