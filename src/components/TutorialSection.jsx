import React, { useState } from 'react';
import { 
  BookOpen, GitFork, Users, Network, Calendar, BarChart3, Images,
  Sparkles, Keyboard, ShieldCheck, Heart, Church, Tag, FileCode, CheckCircle2,
  HelpCircle, ChevronRight, Eye, Edit, Trash2, ArrowRight
} from 'lucide-react';
import { translations } from '../utils/i18n';

export default function TutorialSection({ lang = 'en', onNavigateView, theme = 'win98' }) {
  const t = translations[lang] || translations.en;
  const [activeChapter, setActiveChapter] = useState('tree');

  const chapters = [
    {
      id: 'tree',
      title: t.guideTreeNav,
      icon: Network,
      color: 'indigo'
    },
    {
      id: 'kinship',
      title: t.guideKinship,
      icon: GitFork,
      color: 'purple'
    },
    {
      id: 'patronymics',
      title: t.guidePatronymics,
      icon: Users,
      color: 'emerald'
    },
    {
      id: 'marriages',
      title: t.guideMarriages,
      icon: Heart,
      color: 'pink'
    },
    {
      id: 'gallery',
      title: t.guideGallery,
      icon: Images,
      color: 'amber'
    },
    {
      id: 'persistence',
      title: t.guidePersistence,
      icon: ShieldCheck,
      color: 'blue'
    }
  ];

  if (theme === 'win98') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#c0c0c0] text-black overflow-hidden select-none">
        {/* Win98 Window Titlebar */}
        <div className="win98-title-navy px-3 py-1 flex items-center justify-between text-xs font-bold text-white shrink-0">
          <div className="flex items-center space-x-1.5">
            <span>📖</span>
            <span className="font-extrabold">{t.tutorialTitle} [Windows 98 Help Center]</span>
          </div>
          <span className="text-[11px] font-mono opacity-90">v1.998</span>
        </div>

        {/* Content: Sidebar Tabs + Chapter Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-3 md:p-5 gap-4">
          
          {/* Chapters Navigation Rail */}
          <div className="w-full md:w-72 win98-box p-3 space-y-1.5 shrink-0 overflow-y-auto max-h-[30vh] md:max-h-full bg-[#c0c0c0]">
            <div className="px-2 py-1 text-xs uppercase font-black tracking-wider text-black border-b border-gray-400 mb-2">
              {lang === 'zh' ? '• 指南章节目录' : '• Help Topics'}
            </div>
            {chapters.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`w-full text-left p-2.5 text-xs font-bold transition flex items-center justify-between win98-btn ${
                    isActive
                      ? 'win98-btn-active bg-[#000080] text-white hover:bg-[#000080]'
                      : 'text-black'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{ch.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Chapter Detailed Reader Area */}
          <div className="flex-1 win98-sunken bg-white text-black p-5 lg:p-7 overflow-y-auto space-y-5">
            
            {/* Chapter 1: Family Tree Navigation */}
            {activeChapter === 'tree' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 1</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guideTreeNav}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '家族树视图（Family Tree）通过直观的世系分层节点展示家族几代人的垂直血亲脉络。支持拖拽平移、鼠标滚轮缩放，并支持双向世系展开。'
                      : 'The Family Tree visualizer renders genealogical lineage across generations with clear vertical bloodlines. Supports pan, zoom, and dynamic root focusing.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="win98-box p-3.5 bg-[#f0f0f0] space-y-1.5 border border-gray-400">
                      <h3 className="font-black text-black flex items-center text-sm">
                        <Sparkles className="w-4 h-4 mr-1.5 text-[#000080]" />
                        {lang === 'zh' ? '世系聚焦 (Focus)' : 'Focus On Member'}
                      </h3>
                      <p className="text-xs text-neutral-800 font-bold">
                        {lang === 'zh'
                          ? '点击卡片上的“以此族人为世系中心”或快捷键 F，即可将该族人设为当前展示树的核心祖先。'
                          : 'Click "Focus tree here" or press F on any selected card to center the tree around that person.'}
                      </p>
                    </div>

                    <div className="win98-box p-3.5 bg-[#f0f0f0] space-y-1.5 border border-gray-400">
                      <h3 className="font-black text-black flex items-center text-sm">
                        <Eye className="w-4 h-4 mr-1.5 text-[#000080]" />
                        {lang === 'zh' ? '族人详情侧拉抽屉' : 'Profile Drawer'}
                      </h3>
                      <p className="text-xs text-neutral-800 font-bold">
                        {lang === 'zh'
                          ? '点击任意族人卡片，右侧即可滑出完整档案：包括生卒年、职业、圣名、历史照片、史料链接以及九族关系。'
                          : 'Click any member card to open the slideout drawer revealing vitals, biography, tagged photos, and source references.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 2: Kinship Calculation */}
            {activeChapter === 'kinship' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 2</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guideKinship}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '系统内置了严谨的九族亲属关系推算引擎，并完美支持传统汉文化四大堂表区分（堂、姑表、舅表、姨表）以及兼具多重亲缘关系的辨析。'
                      : 'The Kinship Engine evaluates the exact degree of relationship between any two individuals, resolving agnatic (堂) vs cognatic (表) distinctions and dual relationships.'}
                  </p>

                  <div className="win98-box p-4 bg-[#f8f8f8] space-y-3 border border-gray-400">
                    <h3 className="font-black text-black text-sm flex items-center">
                      <GitFork className="w-4 h-4 mr-1.5 text-[#000080]" />
                      {lang === 'zh' ? '堂亲与表亲精确四分法' : 'The Four-Fold Cousin Classification'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-black">
                      <div className="p-2.5 bg-white border border-gray-300">
                        <strong className="text-[#000080] block mb-1">堂亲 (Paternal Agnatic)</strong>
                        <span>{lang === 'zh' ? '父母双方皆为男性兄弟之子女（伯父/叔父之后代）。无论姓氏是否改拼或父称形式，均归为本宗堂亲（堂兄弟/堂姐妹）。' : "Father's brother's children (both connecting branches are male). Recognized as 堂亲 even with patronymic naming."}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-gray-300">
                        <strong className="text-rose-900 block mb-1">姑表亲 (Paternal Aunt Cousin)</strong>
                        <span>{lang === 'zh' ? '父亲之姐妹（姑母）的子女。' : "Father's sister's children."}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-gray-300">
                        <strong className="text-amber-900 block mb-1">舅表亲 (Maternal Uncle Cousin)</strong>
                        <span>{lang === 'zh' ? '母亲之兄弟（舅父）的子女。' : "Mother's brother's children."}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-gray-300">
                        <strong className="text-emerald-950 block mb-1">姨表亲 (Maternal Aunt Cousin)</strong>
                        <span>{lang === 'zh' ? '母亲之姐妹（姨母）的子女。' : "Mother's sister's children."}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-400 text-black">
                    <h4 className="font-black text-blue-950 mb-1 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#000080]" />
                      {lang === 'zh' ? '双重与多重亲属关系 (Dual Kinship)' : 'Dual & Multiple Kinship Handling'}
                    </h4>
                    <p className="text-neutral-900 font-bold">
                      {lang === 'zh'
                        ? '当家族中出现兄弟再娶亡嫂/亡弟媳等复杂婚姻时，两位后代可能同时兼具“同母异父兄弟”与“堂兄弟”。系统会自动检测并提供关系切换选择器，且血亲世系脉络绝不绕经继父母或无关配偶！'
                        : 'When levirate marriages or complex remarriages occur, individuals can be both Half-Brothers and 1st Paternal Cousins. The system detects both channels and provides interactive tabs with pure blood lineage paths.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 3: Patronymics & Names */}
            {activeChapter === 'patronymics' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 3</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guidePatronymics}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '名录与统计看板支持双语命名、父称（Patronymic / bin / binti）、洗礼圣名（Christian Name）与汉字字辈名。'
                      : 'The Directory and Statistics engine natively recognize patronymics (e.g. bin / binti), Christian/Baptism names, and Chinese generational names.'}
                  </p>

                  <div className="win98-box p-3.5 bg-[#f0f0f0] space-y-1.5 border border-gray-400">
                    <h3 className="font-black text-black text-sm">
                      {lang === 'zh' ? '父称世系统合 (bin & binti 宗支分组)' : 'Patronymic Lineage Grouping'}
                    </h3>
                    <p className="text-neutral-800 font-bold">
                      {lang === 'zh'
                        ? '“bin Matubol”与“binti Matubol”在名录中会自动识别为源自 Matubol 的同一世系，归入“bin/binti Matubol”统一宗支分组，避免男女因介词不同而被割裂。'
                        : 'Members with "bin Matubol" and "binti Matubol" are automatically consolidated under the unified lineage "bin/binti Matubol".'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 4: Marriage Perspectives */}
            {activeChapter === 'marriages' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 4</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guideMarriages}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '婚姻关系具有高度非对称性与历史阶段性。系统支持为每位配偶独立记录婚姻类型、婚姻状态（现任/亡故/离异）及结婚年份。'
                      : 'Marriages support historical multi-spouses, asymmetric roles (e.g. First Wife vs Remarried Second Wife), and wedding dates appearing in the Chronological Timeline.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-white border border-gray-300">
                      <span className="text-rose-900 font-black block mb-1">结发原配 (First Wife)</span>
                      <span className="text-neutral-800">初次婚姻配偶，可标注健在或已故。</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-300">
                      <span className="text-amber-900 font-black block mb-1">继室/续弦 (Second Wife)</span>
                      <span className="text-neutral-800">原配离世后继娶之配偶，记录再婚顺位。</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-300">
                      <span className="text-purple-950 font-black block mb-1">多配偶/平妻 (Plural)</span>
                      <span className="text-neutral-800">历史一夫多妻、平妻或侧室伴侣关系。</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 5: Photo Gallery & Tagging */}
            {activeChapter === 'gallery' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 5</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guideGallery}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '照片画廊提供家族珍贵合影、祖宅老照片与个人肖像的集中归档。支持标记族人、按族人筛选照片、以及一键将照片设为族人头像。'
                      : 'The Family Photo Gallery stores vintage photographs and modern reunions with member face tagging and one-click profile avatar updates.'}
                  </p>

                  <div className="win98-box p-3.5 bg-[#f0f0f0] space-y-1.5 border border-gray-400">
                    <h3 className="font-black text-black text-sm flex items-center">
                      <Tag className="w-4 h-4 mr-1.5 text-amber-800" />
                      {lang === 'zh' ? '照片标记族人 (Tagging Members)' : 'Tagging Family Members'}
                    </h3>
                    <p className="text-neutral-800 font-bold">
                      {lang === 'zh'
                        ? '在上传或编辑照片时，可以通过搜索框将家族树中的族人标记到照片上。标记后，可在画廊中“按族人筛选”此人的全部照片，并在族人档案抽屉中直接浏览其相关历史影像。'
                        : 'Tag one or more members on any photo. In the gallery, you can filter by tagged person, or inspect a member to see all photos featuring them.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 6: Admin Persistence */}
            {activeChapter === 'persistence' && (
              <div className="space-y-4">
                <div className="border-b-2 border-gray-300 pb-3">
                  <span className="text-xs font-black text-[#000080] uppercase tracking-wider">Chapter 6</span>
                  <h2 className="text-xl font-black text-black mt-0.5">{t.guidePersistence}</h2>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-black leading-relaxed">
                  <p>
                    {lang === 'zh'
                      ? '顶部导航栏提供“管理模式”与“族人查阅模式”切换。查阅模式专门用于公开阅览或防误触，隐藏了增删按钮与底层数据库代码编辑。'
                      : 'Switch between "Admin Panel" and "Viewer / Member Mode" using the top toggle. Viewer mode provides a clean, read-only experience.'}
                  </p>

                  <div className="win98-box p-3.5 bg-[#f0f0f0] space-y-1.5 border border-gray-400">
                    <h3 className="font-black text-black text-sm flex items-center">
                      <FileCode className="w-4 h-4 mr-1.5 text-emerald-800" />
                      {lang === 'zh' ? '本地数据文件实时持久化 (data/family.json)' : 'Live Disk Persistence'}
                    </h3>
                    <p className="text-neutral-800 font-bold">
                      {lang === 'zh'
                        ? '所有族人修改、照片添加和关系连接均即时同步写入本地 data/family.json 文件。系统通过 SSE 实时监听文件变动，确保数据安全不丢失。'
                        : 'All edits and photo archives are immediately synchronized to data/family.json with SSE live streaming.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center">
                <span>{t.tutorialTitle}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {lang === 'zh' ? '全功能指南' : 'App Guide'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {t.tutorialSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar Tabs + Chapter Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full p-4 lg:p-6 gap-6">
        
        {/* Chapters Navigation Rail */}
        <div className="w-full md:w-72 bg-slate-900/80 rounded-2xl border border-slate-800 p-3 space-y-1.5 shrink-0 overflow-y-auto max-h-[30vh] md:max-h-full">
          <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {lang === 'zh' ? '指南目录' : 'Table of Contents'}
          </div>
          {chapters.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ch.title}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition ${isActive ? 'translate-x-0.5' : 'opacity-40'}`} />
              </button>
            );
          })}
        </div>

        {/* Chapter Detailed Reader Area */}
        <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 lg:p-8 overflow-y-auto space-y-6">
          
          {/* Chapter 1: Family Tree Navigation */}
          {activeChapter === 'tree' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Chapter 1</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guideTreeNav}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '家族树视图（Family Tree）通过直观的世系分层节点展示家族几代人的垂直血亲脉络。支持拖拽平移、鼠标滚轮缩放，并支持双向世系展开。'
                    : 'The Family Tree visualizer renders genealogical lineage across generations with clear vertical bloodlines. Supports pan, zoom, and dynamic root focusing.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h3 className="font-bold text-white flex items-center text-sm">
                      <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" />
                      {lang === 'zh' ? '世系聚焦 (Focus)' : 'Focus On Member'}
                    </h3>
                    <p className="text-slate-400">
                      {lang === 'zh'
                        ? '点击卡片上的“以此族人为世系中心”或快捷键 F，即可将该族人设为当前展示树的核心祖先。'
                        : 'Click "Focus tree here" or press F on any selected card to center the tree around that person.'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h3 className="font-bold text-white flex items-center text-sm">
                      <Eye className="w-4 h-4 mr-1.5 text-purple-400" />
                      {lang === 'zh' ? '族人详情侧拉抽屉' : 'Profile Drawer'}
                    </h3>
                    <p className="text-slate-400">
                      {lang === 'zh'
                        ? '点击任意族人卡片，右侧即可滑出完整档案：包括生卒年、职业、圣名、历史照片、史料链接以及九族关系。'
                        : 'Click any member card to open the slideout drawer revealing vitals, biography, tagged photos, and source references.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 2: Kinship Calculation */}
          {activeChapter === 'kinship' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Chapter 2</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guideKinship}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '系统内置了严谨的九族亲属关系推算引擎，并完美支持传统汉文化四大堂表区分（堂、姑表、舅表、姨表）以及兼具多重亲缘关系的辨析。'
                    : 'The Kinship Engine evaluates the exact degree of relationship between any two individuals, resolving agnatic (堂) vs cognatic (表) distinctions and dual relationships.'}
                </p>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <GitFork className="w-4 h-4 mr-1.5 text-purple-400" />
                    {lang === 'zh' ? '堂亲与表亲精确四分法' : 'The Four-Fold Cousin Classification'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <strong className="text-indigo-300 block mb-1">堂亲 (Paternal Agnatic)</strong>
                      <span>{lang === 'zh' ? '父母双方皆为男性兄弟之子女（伯父/叔父之后代）。无论姓氏是否改拼或父称形式，均归为本宗堂亲（堂兄弟/堂姐妹）。' : "Father's brother's children (both connecting branches are male). Recognized as 堂亲 even with patronymic naming."}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <strong className="text-pink-300 block mb-1">姑表亲 (Paternal Aunt Cousin)</strong>
                      <span>{lang === 'zh' ? '父亲之姐妹（姑母）的子女。' : "Father's sister's children."}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <strong className="text-amber-300 block mb-1">舅表亲 (Maternal Uncle Cousin)</strong>
                      <span>{lang === 'zh' ? '母亲之兄弟（舅父）的子女。' : "Mother's brother's children."}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <strong className="text-emerald-300 block mb-1">姨表亲 (Maternal Aunt Cousin)</strong>
                      <span>{lang === 'zh' ? '母亲之姐妹（姨母）的子女。' : "Mother's sister's children."}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30">
                  <h4 className="font-bold text-white mb-1 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    {lang === 'zh' ? '双重与多重亲属关系 (Dual Kinship)' : 'Dual & Multiple Kinship Handling'}
                  </h4>
                  <p className="text-slate-300">
                    {lang === 'zh'
                      ? '当家族中出现兄弟再娶亡嫂/亡弟媳（如父系兄弟娶同一位母亲）等复杂婚姻时，两位后代可能同时兼具“同母异父兄弟”与“堂兄弟”。系统会自动检测并提供关系切换选择器，且血亲世系脉络绝不绕经继父母或无关配偶！'
                      : 'When levirate marriages or complex remarriages occur, individuals can be both Half-Brothers and 1st Paternal Cousins. The system detects both channels and provides interactive tabs with pure blood lineage paths.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 3: Patronymics & Names */}
          {activeChapter === 'patronymics' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Chapter 3</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guidePatronymics}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '名录与统计看板支持双语命名、父称（Patronymic / bin / binti）、洗礼圣名（Christian Name）与汉字字辈名。'
                    : 'The Directory and Statistics engine natively recognize patronymics (e.g. bin / binti), Christian/Baptism names, and Chinese generational names.'}
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">
                    {lang === 'zh' ? '父称世系统合 (bin & binti 宗支分组)' : 'Patronymic Lineage Grouping'}
                  </h3>
                  <p className="text-slate-400">
                    {lang === 'zh'
                      ? '“bin Matubol”与“binti Matubol”在名录中会自动识别为源自 Matubol 的同一世系，归入“bin/binti Matubol”统一宗支分组，避免男女因介词不同而被割裂。'
                      : 'Members with "bin Matubol" and "binti Matubol" are automatically consolidated under the unified lineage "bin/binti Matubol".'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 4: Marriage Perspectives & Milestones */}
          {activeChapter === 'marriages' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Chapter 4</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guideMarriages}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '婚姻关系具有高度非对称性与历史阶段性。系统支持为每位配偶独立记录婚姻类型、婚姻状态（现任/亡故/离异）及结婚年份。'
                    : 'Marriages support historical multi-spouses, asymmetric roles (e.g. First Wife vs Remarried Second Wife), and wedding dates appearing in the Chronological Timeline.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-pink-400 font-bold block mb-1">结发原配 (First Wife)</span>
                    <span className="text-slate-400">初次婚姻配偶，可标注健在或已故。</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">继室/续弦 (Second Wife)</span>
                    <span className="text-slate-400">原配离世后继娶之配偶，记录再婚顺位。</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-purple-400 font-bold block mb-1">多配偶/平妻 (Plural)</span>
                    <span className="text-slate-400">历史一夫多妻、平妻或侧室伴侣关系。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 5: Photo Gallery & Tagging */}
          {activeChapter === 'gallery' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chapter 5</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guideGallery}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '照片画廊提供家族珍贵合影、祖宅老照片与个人肖像的集中归档。支持标记族人、按族人筛选照片、以及一键将照片设为族人头像。'
                    : 'The Family Photo Gallery stores vintage photographs and modern reunions with member face tagging and one-click profile avatar updates.'}
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <Tag className="w-4 h-4 mr-1.5 text-amber-400" />
                    {lang === 'zh' ? '照片标记族人 (Tagging Members)' : 'Tagging Family Members'}
                  </h3>
                  <p className="text-slate-400">
                    {lang === 'zh'
                      ? '在上传或编辑照片时，可以通过搜索框将家族树中的族人标记到照片上。标记后，可在画廊中“按族人筛选”此人的全部照片，并在族人档案抽屉中直接浏览其相关历史影像。'
                      : 'Tag one or more members on any photo. In the gallery, you can filter by tagged person, or inspect a member to see all photos featuring them.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 6: Admin vs Viewer Mode & Persistence */}
          {activeChapter === 'persistence' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Chapter 6</span>
                <h2 className="text-2xl font-black text-white mt-1">{t.guidePersistence}</h2>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'zh'
                    ? '顶部导航栏提供“管理模式”与“族人查阅模式”切换。查阅模式专门用于公开阅览或防误触，隐藏了增删按钮与底层数据库代码编辑。'
                    : 'Switch between "Admin Panel" and "Viewer / Member Mode" using the top toggle. Viewer mode provides a clean, read-only experience.'}
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <FileCode className="w-4 h-4 mr-1.5 text-emerald-400" />
                    {lang === 'zh' ? '本地数据文件实时持久化 (data/family.json)' : 'Live Disk Persistence'}
                  </h3>
                  <p className="text-slate-400">
                    {lang === 'zh'
                      ? '所有族人修改、照片添加和关系连接均即时同步写入本地 data/family.json 文件。系统通过 SSE 实时监听文件变动，确保数据安全不丢失。'
                      : 'All edits and photo archives are immediately synchronized to data/family.json with SSE live streaming.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
