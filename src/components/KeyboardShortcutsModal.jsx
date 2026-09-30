import React, { useEffect } from 'react';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === '?' || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      groupTitle: lang === 'zh' ? '族人卡片与选中操作 (需先点击卡片选中)' : 'Selected Member Actions (Click card first)',
      items: [
        {
          keys: ['Delete', 'Backspace'],
          description: lang === 'zh' ? '删除当前选中的族人 (自动弹出确认框，按 Enter 确认)' : 'Delete selected member (Prompts confirm modal, press Enter)',
          highlight: true
        },
        {
          keys: ['E'],
          description: lang === 'zh' ? '编辑当前选中族人的档案与关系' : 'Edit profile & relationships for selected member'
        },
        {
          keys: ['F'],
          description: lang === 'zh' ? '以此族人为世系中心聚焦世系树' : 'Focus family pedigree tree on selected member'
        },
        {
          keys: ['C'],
          description: lang === 'zh' ? '为选中族人快速添加子女后代' : 'Quickly add child to selected member'
        },
        {
          keys: ['S'],
          description: lang === 'zh' ? '为选中族人快速添加配偶/伴侣/续弦' : 'Quickly link spouse or partner to selected member'
        },
        {
          keys: ['Esc'],
          description: lang === 'zh' ? '取消选中族人 / 关闭侧拉详情面板' : 'Deselect member / Close side drawer'
        }
      ]
    },
    {
      groupTitle: lang === 'zh' ? '全局视图切换与快速新建' : 'Navigation & Creation',
      items: [
        {
          keys: ['A'],
          description: lang === 'zh' ? '添加新族人 (打开添加档案弹窗)' : 'Add new family member'
        },
        {
          keys: ['1'],
          description: lang === 'zh' ? '切换至：家族树世系图 (Family Tree)' : 'Switch to Family Tree view'
        },
        {
          keys: ['2'],
          description: lang === 'zh' ? '切换至：寻祖与堂表亲计算器 (Explorer & Kinship)' : 'Switch to Genealogy Explorer'
        },
        {
          keys: ['3'],
          description: lang === 'zh' ? '切换至：族人名录总表 (Directory)' : 'Switch to People Directory'
        },
        {
          keys: ['4'],
          description: lang === 'zh' ? '切换至：家族编年史时间轴 (Timeline)' : 'Switch to Timeline view'
        },
        {
          keys: ['5'],
          description: lang === 'zh' ? '切换至：家族血统与统计看板 (Stats)' : 'Switch to Stats dashboard'
        },
        {
          keys: ['6'],
          description: lang === 'zh' ? '切换至：家族照片画廊与人脸标记 (Gallery)' : 'Switch to Photo Gallery & Tagging'
        },
        {
          keys: ['7'],
          description: lang === 'zh' ? '切换至：功能使用指南与教程 (Tutorial)' : 'Switch to Interactive Tutorial'
        }
      ]
    },
    {
      groupTitle: lang === 'zh' ? '弹窗与通用快捷键' : 'Modals & General',
      items: [
        {
          keys: ['Enter ↵'],
          description: lang === 'zh' ? '在删除确认对话框中执行确认' : 'Confirm action in deletion dialog'
        },
        {
          keys: ['Esc'],
          description: lang === 'zh' ? '关闭任意对话框、编辑弹窗或侧拉抽屉' : 'Close any active modal, drawer, or search'
        },
        {
          keys: ['?'],
          description: lang === 'zh' ? '随时按 ? 打开或关闭此快捷键面板' : 'Toggle this keyboard shortcuts cheat sheet'
        }
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <span>{t.shortcutsTitle}</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {lang === 'zh' ? '按键即时响应' : 'Instant Keys'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t.shortcutsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                {group.groupTitle}
              </h3>
              <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800/60">
                {group.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-800/30 transition">
                    <span className="text-xs text-slate-300">
                      {item.description}
                    </span>
                    <div className="flex items-center space-x-1 shrink-0 ml-4">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-2 py-1 text-[11px] font-mono rounded-lg border shadow-sm ${
                            item.highlight
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'zh' ? '输入框聚焦打字时会自动暂停快捷键，避免冲突' : 'Shortcuts are paused while typing in text inputs'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          >
            {lang === 'zh' ? '我知道了' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
