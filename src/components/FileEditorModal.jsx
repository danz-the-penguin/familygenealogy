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
  syncStatus 
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
