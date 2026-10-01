import React, { useState, useEffect } from 'react';
import { 
  X, FileCode, Save, RefreshCw, Download, Upload, CheckCircle2, 
  AlertCircle, Copy, Check, Terminal, ExternalLink
} from 'lucide-react';

export default function FileEditorModal({ 
  isOpen, 
  onClose, 
  currentData, 
  onSaveData, 
  onReloadFromFile,
  syncStatus,
  lang = 'en',
  theme = 'win98'
}) {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && currentData) {
      setJsonText(JSON.stringify(currentData, null, 2));
      setParseError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, currentData]);

  if (!isOpen) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setParseError(null);
      onSaveData(parsed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-genealogy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const parsed = JSON.parse(content);
        setJsonText(JSON.stringify(parsed, null, 2));
        setParseError(null);
      } catch (err) {
        setParseError(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  if (theme === 'win98') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-3 select-none">
        <div className="relative w-full max-w-4xl win98-box shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Win98 Titlebar */}
          <div className="win98-title-navy px-3 py-1 flex items-center justify-between text-xs font-bold text-white select-none">
            <div className="flex items-center space-x-1.5">
              <span>📄</span>
              <span className="font-extrabold">{lang === 'zh' ? '族谱数据源底层编辑 - family.json [记事本 1998]' : 'family.json - Genealogy Editor [Notepad 1998]'}</span>
            </div>
            <button
              onClick={onClose}
              className="win98-btn px-2 py-0.2 text-xs font-bold text-black hover:bg-red-100"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Win98 Toolbar */}
          <div className="p-2 border-b border-gray-400 bg-[#c0c0c0] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1 font-bold text-black">
              <span>{lang === 'zh' ? '本地文件: ' : 'File: '}</span>
              <code className="win98-sunken px-2 py-0.5 bg-white text-black font-mono">data/family.json</code>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={onReloadFromFile}
                className="win98-btn px-2.5 py-1 text-xs font-bold text-black"
              >
                {lang === 'zh' ? '从磁盘重新加载' : 'Reload Disk'}
              </button>
              <label className="win98-btn px-2.5 py-1 text-xs font-bold text-black cursor-pointer">
                <span>{lang === 'zh' ? '导入文件' : 'Import'}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                onClick={handleDownload}
                className="win98-btn px-2.5 py-1 text-xs font-bold text-black"
              >
                {lang === 'zh' ? '导出备份' : 'Export'}
              </button>
              <button
                onClick={handleFormat}
                className="win98-btn px-2.5 py-1 text-xs font-bold text-black"
              >
                {lang === 'zh' ? '规范缩进' : 'Format'}
              </button>
              <button
                onClick={handleCopy}
                className="win98-btn px-2.5 py-1 text-xs font-bold text-black"
              >
                {copied ? (lang === 'zh' ? '已复制!' : 'Copied!') : (lang === 'zh' ? '复制' : 'Copy')}
              </button>
            </div>
          </div>

          {/* Alert messages */}
          {parseError && (
            <div className="win98-sunken m-2 p-2 bg-rose-50 text-rose-900 text-xs font-black">
              ⚠️ JSON 格式语法错误: {parseError}
            </div>
          )}
          {saveSuccess && (
            <div className="win98-sunken m-2 p-2 bg-emerald-50 text-emerald-950 text-xs font-black">
              ✅ 成功保存至 data/family.json！数据已实时热重载。
            </div>
          )}

          {/* Editor Body */}
          <div className="flex-1 p-2 bg-[#c0c0c0] overflow-hidden flex flex-col">
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setParseError(null);
              }}
              spellCheck="false"
              className="w-full flex-1 p-3 win98-sunken bg-white text-black font-mono text-xs leading-relaxed resize-none overflow-y-auto"
            />
          </div>

          {/* Footer Controls */}
          <div className="p-2.5 border-t border-gray-400 bg-[#c0c0c0] flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800">
              {lang === 'zh' ? '• 直接修改底层 JSON，网页与磁盘双向同步' : '• Edits data/family.json directly'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="win98-btn px-4 py-1 text-xs font-bold text-black"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="win98-btn px-5 py-1 text-xs font-black text-black bg-[#d4d0c8]"
              >
                {lang === 'zh' ? '保存更改 (Save)' : 'Save Changes'}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Manual File & Database Sync</h2>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>data/family.json</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit directly on disk in VS Code or edit raw JSON here. Webapp syncs both ways automatically.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-950/40 p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Direct File Path: <code className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">familygenealogy/data/family.json</code>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onReloadFromFile}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload From Disk</span>
            </button>
            <label className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Error / Success alert */}
        {parseError && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-5 py-2.5 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>JSON Syntax Error: {parseError}</span>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-5 py-2.5 flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Saved successfully to data/family.json! Family tree reloaded.</span>
          </div>
        )}

        {/* JSON Code Editor */}
        <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-hidden flex flex-col">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setParseError(null);
            }}
            spellCheck="false"
            className="w-full flex-1 p-4 bg-slate-900/90 text-slate-200 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 transition resize-none overflow-y-auto"
          />
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormat}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Prettify JSON
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes to data/family.json</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
