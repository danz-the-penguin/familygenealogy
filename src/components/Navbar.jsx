import React, { useState, useMemo } from 'react';
import { 
  GitFork, Users, Network, Calendar, BarChart3, Plus, 
  FileCode, Search, RefreshCw, Sparkles, CheckCircle2, Globe, Keyboard,
  Images, BookOpen, ShieldCheck, Eye, Shield, Lock, LogIn, LogOut
} from 'lucide-react';
import { formatFullName } from '../utils/genealogy';
import { translations } from '../utils/i18n';
import TabAutocompleteInput from './TabAutocompleteInput';

export default function Navbar({
  currentView,
  onViewChange,
  persons = [],
  onSelectPerson,
  onOpenAddModal,
  onOpenFileEditor,
  onOpenShortcuts,
  isSynced,
  lastSaved,
  lang = 'en',
  onToggleLang,
  isAdminMode = false,
  onOpenAdminLogin,
  onAdminLogout
}) {
  const t = translations[lang] || translations.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const personNameSuggestions = useMemo(() => {
    return persons.map(p => formatFullName(p, lang)).filter(Boolean);
  }, [persons, lang]);

  const searchResults = searchQuery.trim() 
    ? persons.filter(p => {
        const full = `${p.firstName} ${p.lastName} ${p.maidenName || ''} ${p.chineseName || ''}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
      }).slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between z-30 shrink-0">
      
      {/* Brand & Title */}
      <div className="flex items-center space-x-6">
        <div 
          onClick={() => onViewChange('tree')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
            <GitFork className="w-5 h-5 rotate-180" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-wide group-hover:text-indigo-300 transition flex items-center">
              {t.appTitle} <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Genealogy</span>
            </div>
            <div className="text-[11px] text-slate-400">{t.appSubtitle}</div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="hidden xl:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onViewChange('tree')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'tree'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{t.treeView}</span>
          </button>

          <button
            onClick={() => onViewChange('explorer')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'explorer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 rotate-180" />
            <span>{t.explorerView}</span>
          </button>

          <button
            onClick={() => onViewChange('directory')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'directory'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.directoryView}</span>
          </button>

          <button
            onClick={() => onViewChange('timeline')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.timelineView}</span>
          </button>

          <button
            onClick={() => onViewChange('stats')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'stats'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t.statsView}</span>
          </button>

          <button
            onClick={() => onViewChange('gallery')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'gallery'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>{t.galleryView}</span>
          </button>

          <button
            onClick={() => onViewChange('tutorial')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'tutorial'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.tutorialView}</span>
          </button>
        </nav>
      </div>

      {/* Right Actions: Mode / Auth + Search + Lang + Shortcuts + File Sync + Add Member */}
      <div className="flex items-center space-x-2">
        
        {/* Admin Login / Logout Ribbon Section */}
        {isAdminMode ? (
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'zh' ? '管理权限' : 'Admin'}</span>
            </div>
            <button
              onClick={onAdminLogout}
              title={lang === 'zh' ? '退出管理登录，切换为族人查阅模式' : 'Log out of Admin, switch to Viewer Mode'}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{lang === 'zh' ? '退出' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t.viewerMode}</span>
            </div>
            <button
              onClick={onOpenAdminLogin}
              title={lang === 'zh' ? '管理员输入密码登录' : 'Sign in as Admin to edit tree'}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'zh' ? '管理登录' : 'Admin Login'}</span>
            </button>
          </div>
        )}

        {/* Quick Search Dropdown */}
        <div className="relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 z-10 pointer-events-none" />
            <TabAutocompleteInput
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              suggestions={personNameSuggestions}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  e.preventDefault();
                  onSelectPerson(searchResults[0]);
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder={t.searchPlaceholder}
              className="w-32 sm:w-40 lg:w-48 pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Autocomplete Menu */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                {lang === 'zh' ? '匹配族人' : 'Matching Members'}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPerson(p);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-800 flex items-center justify-between text-xs transition border-b border-slate-800/40 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-white">{formatFullName(p, lang)}</div>
                      <div className="text-[10px] text-slate-400">{p.birthDate ? String(p.birthDate).substring(0, 4) : 'b.?'} • {p.occupation || 'Member'}</div>
                    </div>
                    <span className="text-[10px] text-indigo-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Guide Button */}
        <button
          onClick={onOpenShortcuts}
          title={lang === 'zh' ? '查看键盘快捷键 (按 ? 键)' : 'Keyboard Shortcuts (Press ?)'}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 text-xs font-medium transition"
        >
          <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">{t.shortcuts}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd>
        </button>

        {/* Language Switcher (EN / 中文) */}
        <button
          onClick={onToggleLang}
          title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 text-xs font-medium transition"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{lang === 'en' ? '中文' : 'EN'}</span>
        </button>

        {/* Live File Sync Pill (data/family.json) - Only in Admin Mode */}
        {isAdminMode && (
          <button
            onClick={onOpenFileEditor}
            title={lang === 'zh' ? '点击查看数据文件同步状态或直接编辑 JSON' : 'Click to view file status or edit data/family.json'}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition"
          >
            <span className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px] text-slate-300">data/family.json</span>
          </button>
        )}

        {/* Add Family Member Button - Only in Admin Mode */}
        {isAdminMode && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMember}</span>
          </button>
        )}

      </div>
    </header>
  );
}
