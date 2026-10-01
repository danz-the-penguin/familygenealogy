import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, User } from 'lucide-react';
import { formatFullName, getLifespan } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function DeleteConfirmModal({
  isOpen,
  person,
  onConfirm,
  onClose,
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;

  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleModalKeyDown, true);
    return () => window.removeEventListener('keydown', handleModalKeyDown, true);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen || !person) return null;

  const parentsCount = (person.parents || []).length;
  const spousesCount = (person.spouses || []).length;
  const childrenCount = (person.children || []).length;

  if (theme === 'win98') {
    return (
      <div 
        className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 backdrop-blur-none flex items-center justify-center p-4 animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md win98-box shadow-2xl overflow-hidden select-none"
          onClick={e => e.stopPropagation()}
        >
          {/* Win98 Titlebar */}
          <div className="win98-title-rose px-3 py-1 flex items-center justify-between text-xs font-bold text-white">
            <div className="flex items-center space-x-1.5">
              <span>⚠️</span>
              <span>{t.deleteConfirmTitle}</span>
            </div>
            <button 
              onClick={onClose}
              className="win98-btn px-2 py-0.2 text-xs font-bold text-black"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3.5 bg-[#c0c0c0]">
            {/* Sunken Details Panel */}
            <div className="win98-sunken p-3.5 bg-white text-black flex items-start space-x-3">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={formatFullName(person, lang)}
                  className="w-12 h-12 rounded object-cover border border-gray-400 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-neutral-200 border border-gray-400 rounded flex items-center justify-center text-black shrink-0 font-black text-xl">
                  {person.gender === 'female' ? '♀' : '♂'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-black leading-snug break-words whitespace-normal">
                  {formatFullName(person, lang)}
                </h3>
                <p className="text-xs font-extrabold text-neutral-800 mt-0.5">
                  {getLifespan(person, lang)}
                </p>
                <div className="flex items-center space-x-2 mt-1.5 text-xs font-bold text-neutral-900">
                  <span>{lang === 'zh' ? `父母: ${parentsCount}` : `Parents: ${parentsCount}`}</span>
                  <span>•</span>
                  <span>{lang === 'zh' ? `配偶: ${spousesCount}` : `Spouses: ${spousesCount}`}</span>
                  <span>•</span>
                  <span>{lang === 'zh' ? `子女: ${childrenCount}` : `Children: ${childrenCount}`}</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-extrabold text-rose-900 leading-normal bg-rose-50 border border-rose-300 p-2.5 rounded">
              {t.deleteConfirmWarning}
            </p>

            <div className="flex items-center justify-between text-xs font-bold text-neutral-800 px-1">
              <span>{t.deleteConfirmEnterHint}</span>
              <div className="flex items-center space-x-1.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-400 text-black">Enter ↵</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-400 text-black">Esc</kbd>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="win98-btn px-4 py-1 text-xs font-bold text-black"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="win98-btn px-5 py-1 text-xs font-black text-rose-900 bg-rose-100 hover:bg-rose-200"
              >
                {t.deleteMemberButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-rose-500/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t.deleteConfirmTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'zh' ? '键盘按 Delete 键触发' : 'Triggered via Delete key / button'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Esc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Person Card Preview */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={formatFullName(person, lang)}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {formatFullName(person, lang)}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {getLifespan(person, lang)}
              </p>
              <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                <span>{lang === 'zh' ? `父母: ${parentsCount}` : `Parents: ${parentsCount}`}</span>
                <span>•</span>
                <span>{lang === 'zh' ? `配偶: ${spousesCount}` : `Spouses: ${spousesCount}`}</span>
                <span>•</span>
                <span>{lang === 'zh' ? `子女: ${childrenCount}` : `Children: ${childrenCount}`}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {t.deleteConfirmWarning}
          </p>

          {/* Keyboard tip pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
            <span className="text-slate-400 text-[11px]">{t.deleteConfirmEnterHint}</span>
            <div className="flex items-center space-x-1.5 shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">Enter ↵</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">Esc</kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-lg shadow-rose-600/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deleteMemberButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
