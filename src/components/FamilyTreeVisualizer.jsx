import React, { useState, useRef, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, User, Heart, GitFork, Users, 
  Plus, Eye, Sparkles, HeartCrack, Award, Globe, Edit, Search
} from 'lucide-react';
import { formatFullName, getLifespan } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function FamilyTreeVisualizer({
  persons = [],
  personsMap,
  relationships = [],
  rootPersonId,
  onSelectPerson,
  onSetRootPerson,
  onAddChild,
  onAddSpouse,
  onExploreAncestors,
  onExploreCousins,
  onEditPerson,
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [magnifyOnHover, setMagnifyOnHover] = useState(true);

  const rootPerson = personsMap.get(rootPersonId) || persons[0];

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.4));

  // Determine partner status
  const getPartnerStatus = (personAId, personBId) => {
    const personA = personsMap.get(personAId);
    if (personA?.partnerDetails?.[personBId]?.status) {
      return personA.partnerDetails[personBId].status;
    }
    const rel = relationships.find(r => 
      (r.person1 === personAId && r.person2 === personBId) || 
      (r.person1 === personBId && r.person2 === personAId)
    );
    if (rel) {
      if (rel.type === 'divorce' || rel.type === 'ex_spouse' || rel.status === 'ex_spouse') return 'ex_spouse';
      if (rel.type === 'ex_partner' || rel.status === 'ex_partner') return 'ex_partner';
      if (rel.type === 'partner' || rel.status === 'partner') return 'partner';
    }
    return 'spouse';
  };

  // Levels
  const parents = useMemo(() => {
    if (!rootPerson) return [];
    return (rootPerson.parents || []).map(id => personsMap.get(id)).filter(Boolean);
  }, [rootPerson, personsMap]);

  const grandparents = useMemo(() => {
    const list = [];
    parents.forEach(p => {
      (p.parents || []).forEach(gpId => {
        const gp = personsMap.get(gpId);
        if (gp && !list.some(x => x.id === gp.id)) list.push(gp);
      });
    });
    return list;
  }, [parents, personsMap]);

  const spouses = useMemo(() => {
    if (!rootPerson) return [];
    return (rootPerson.spouses || []).map(id => personsMap.get(id)).filter(Boolean);
  }, [rootPerson, personsMap]);

  const children = useMemo(() => {
    if (!rootPerson) return [];
    return (rootPerson.children || []).map(id => personsMap.get(id)).filter(Boolean);
  }, [rootPerson, personsMap]);

  const grandchildren = useMemo(() => {
    const list = [];
    children.forEach(c => {
      (c.children || []).forEach(gcId => {
        const gc = personsMap.get(gcId);
        if (gc && !list.some(x => x.id === gc.id)) list.push(gc);
      });
    });
    return list;
  }, [children, personsMap]);

  const siblings = useMemo(() => {
    if (!rootPerson || parents.length === 0) return [];
    const sibSet = new Set();
    parents.forEach(p => {
      (p.children || []).forEach(cId => {
        if (cId !== rootPerson.id) sibSet.add(cId);
      });
    });
    return Array.from(sibSet).map(id => personsMap.get(id)).filter(Boolean);
  }, [rootPerson, parents, personsMap]);

  if (!rootPerson) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8 text-center">
        <div>
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-300">
            {lang === 'zh' ? '暂无族人数据' : 'No Family Members Found'}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${theme === 'win98' ? 'bg-[#008080] text-black' : 'bg-slate-950 text-white'}`}>
      
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Root Person Selector */}
        <div className={`pointer-events-auto flex items-center space-x-2 px-3 py-2 shadow-xl ${
          theme === 'win98' ? 'win98-box' : 'bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800'
        }`}>
          <span className={`text-xs font-bold uppercase pl-1 ${theme === 'win98' ? 'text-black' : 'text-slate-400'}`}>
            {t.subject}:
          </span>
          <select
            value={rootPerson.id}
            onChange={e => onSetRootPerson(e.target.value)}
            className={`text-xs md:text-sm font-bold px-3 py-1.5 focus:outline-none max-w-xs truncate ${
              theme === 'win98' 
                ? 'win98-sunken text-black bg-white cursor-pointer' 
                : 'bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-indigo-500'
            }`}
          >
            {persons.map(p => (
              <option key={p.id} value={p.id}>
                {formatFullName(p, lang)} ({p.birthDate ? String(p.birthDate).substring(0, 4) : 'b.?'})
              </option>
            ))}
          </select>
          <span className={`text-xs px-2 py-1 font-bold ${
            theme === 'win98' 
              ? 'win98-sunken bg-yellow-100 text-black border border-yellow-500' 
              : 'text-indigo-400 bg-indigo-500/10 rounded-lg border border-indigo-500/20'
          }`}>
            {lang === 'zh' ? '世系家谱图' : 'Pedigree View'}
          </span>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className={`pointer-events-auto flex items-center space-x-1.5 p-1.5 shadow-xl ${
          theme === 'win98' ? 'win98-box' : 'bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800'
        }`}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className={theme === 'win98' ? 'win98-btn p-1.5 font-bold' : 'p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className={theme === 'win98' ? 'win98-btn p-1.5 font-bold' : 'p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 ${theme === 'win98' ? 'win98-sunken bg-white text-black' : 'text-slate-400'}`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleReset}
            title="Reset View"
            className={theme === 'win98' ? 'win98-btn p-1.5 font-bold' : 'p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className={`w-[1px] h-5 my-auto mx-0.5 ${theme === 'win98' ? 'bg-gray-400' : 'bg-slate-800'}`} />

          <button
            onClick={() => setMagnifyOnHover(prev => !prev)}
            title={lang === 'zh' ? '光标悬停卡片放大 2 倍 (开/关)' : 'Magnify card 2x on hover (Toggle)'}
            className={theme === 'win98' 
              ? `win98-btn flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold ${magnifyOnHover ? 'win98-btn-active bg-[#b0b0b0]' : ''}`
              : `flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  magnifyOnHover 
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`
            }
          >
            <Search className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '悬停放大 2x' : '2x Zoom'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''} genealogy-grid-pattern relative`}
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 40%',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="min-w-full min-h-full flex flex-col items-center justify-center p-20 space-y-14"
        >
          {/* LEVEL 1: GRANDPARENTS */}
          {grandparents.length > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                theme === 'win98' 
                  ? 'win98-box px-3 py-0.5 text-black bg-[#c0c0c0]' 
                  : 'text-amber-500/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20'
              }`}>
                {lang === 'zh' ? '祖父辈 (祖父母 / 外祖父母)' : 'Grandparents'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {grandparents.map(gp => (
                  <PersonNodeCard
                    key={gp.id}
                    person={gp}
                    role={gp.gender === 'female' ? (lang === 'zh' ? '祖母/外祖母' : 'Grandmother') : (lang === 'zh' ? '祖父/外祖父' : 'Grandfather')}
                    onSelect={() => onSelectPerson(gp)}
                    onSetRoot={() => onSetRootPerson(gp.id)}
                    onEdit={() => onEditPerson && onEditPerson(gp)}
                    isRoot={false}
                    magnify={magnifyOnHover}
                    lang={lang}
                    theme={theme}
                  />
                ))}
              </div>
              <div className={`w-0.5 h-6 ${theme === 'win98' ? 'bg-black/60' : 'bg-slate-700/80'}`} />
            </div>
          )}

          {/* LEVEL 2: PARENTS */}
          {parents.length > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                theme === 'win98' 
                  ? 'win98-box px-3 py-0.5 text-black bg-[#c0c0c0]' 
                  : 'text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20'
              }`}>
                {lang === 'zh' ? '父母尊长' : 'Parents'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {parents.map(p => (
                  <PersonNodeCard
                    key={p.id}
                    person={p}
                    role={p.gender === 'female' ? (lang === 'zh' ? '母亲' : 'Mother') : (lang === 'zh' ? '父亲' : 'Father')}
                    onSelect={() => onSelectPerson(p)}
                    onSetRoot={() => onSetRootPerson(p.id)}
                    onEdit={() => onEditPerson && onEditPerson(p)}
                    isRoot={false}
                    magnify={magnifyOnHover}
                    lang={lang}
                    theme={theme}
                  />
                ))}
              </div>
              <div className={`w-0.5 h-8 ${theme === 'win98' ? 'bg-black/60' : 'bg-indigo-500/50'}`} />
            </div>
          )}

          {/* LEVEL 3: CENTER NODE (FOCUS PERSON & SPOUSE & SIBLINGS) */}
          <div className="flex flex-col items-center space-y-4">
            <span className={`text-[11px] font-black uppercase tracking-widest flex items-center ${
              theme === 'win98' 
                ? 'win98-box px-4 py-1 text-black bg-[#d4d0c8]' 
                : 'text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-full border border-indigo-500/30'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 mr-1 ${theme === 'win98' ? 'text-black' : 'text-indigo-400'}`} /> 
              {lang === 'zh' ? '世系核心 (本位世代)' : 'Focus Generation'}
            </span>

            <div className={`flex flex-wrap items-center justify-center gap-6 p-4 ${
              theme === 'win98' 
                ? 'win98-box bg-[#c0c0c0] shadow-lg' 
                : 'rounded-3xl bg-slate-900/50 border border-slate-800/80 shadow-2xl backdrop-blur-sm'
            }`}>
              {/* Siblings */}
              {siblings.slice(0, 2).map(sib => (
                <PersonNodeCard
                  key={sib.id}
                  person={sib}
                  role={sib.gender === 'female' ? (lang === 'zh' ? '姐妹' : 'Sister') : (lang === 'zh' ? '兄弟' : 'Brother')}
                  onSelect={() => onSelectPerson(sib)}
                  onSetRoot={() => onSetRootPerson(sib.id)}
                  onEdit={() => onEditPerson && onEditPerson(sib)}
                  isRoot={false}
                  compact
                  magnify={magnifyOnHover}
                  lang={lang}
                  theme={theme}
                />
              ))}

              {/* ROOT PERSON */}
              <PersonNodeCard
                person={rootPerson}
                role={lang === 'zh' ? '本位族人' : 'Selected Focus'}
                onSelect={() => onSelectPerson(rootPerson)}
                onSetRoot={() => onSetRootPerson(rootPerson.id)}
                isRoot={true}
                onAddChild={() => onAddChild(rootPerson.id)}
                onAddSpouse={() => onAddSpouse(rootPerson.id)}
                onExploreAncestors={() => onExploreAncestors(rootPerson.id)}
                onExploreCousins={() => onExploreCousins(rootPerson.id)}
                onEdit={() => onEditPerson && onEditPerson(rootPerson)}
                magnify={magnifyOnHover}
                lang={lang}
                theme={theme}
              />

              {/* Spouses & Partners with Remarriage / Plural / Ex-Partner handling */}
              {spouses.length > 0 && spouses.map(spouse => {
                const status = getPartnerStatus(rootPerson.id, spouse.id);
                const isEx = status === 'ex_spouse' || status === 'ex_partner';
                const isFemale = spouse.gender === 'female';
                
                let roleLabel = lang === 'zh' ? '配偶' : 'Spouse';
                if (status === 'first_spouse') roleLabel = isFemale ? (lang === 'zh' ? '原配发妻' : 'First Wife') : (lang === 'zh' ? '第一任丈夫' : 'First Husband');
                else if (status === 'second_spouse') roleLabel = isFemale ? (lang === 'zh' ? '继室/续弦' : 'Second Wife') : (lang === 'zh' ? '第二任丈夫' : 'Second Husband');
                else if (status === 'third_spouse') roleLabel = isFemale ? (lang === 'zh' ? '第三任妻子' : 'Third Wife') : (lang === 'zh' ? '第三任丈夫' : 'Third Husband');
                else if (status === 'remarriage_after_death' || status === 'remarriage') roleLabel = isFemale ? (lang === 'zh' ? '丧偶续弦' : 'Remarried Wife') : (lang === 'zh' ? '丧偶再婚' : 'Remarried Husband');
                else if (status === 'polygamous') roleLabel = lang === 'zh' ? '多配偶/平妻' : 'Plural Spouse';
                else if (status === 'ex_spouse') roleLabel = isFemale ? (lang === 'zh' ? '前妻' : 'Ex-Wife') : (lang === 'zh' ? '前夫' : 'Ex-Husband');
                else if (status === 'partner') roleLabel = lang === 'zh' ? '伴侣' : 'Partner';
                else if (status === 'ex_partner') roleLabel = lang === 'zh' ? '前伴侣' : 'Ex-Partner';

                return (
                  <div key={spouse.id} className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full border ${
                      isEx 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                    }`}>
                      {isEx ? <HeartCrack className="w-4 h-4 fill-rose-500/30" /> : <Heart className="w-4 h-4 fill-pink-500/30" />}
                    </div>
                    <PersonNodeCard
                      person={spouse}
                      role={roleLabel}
                      onSelect={() => onSelectPerson(spouse)}
                      onSetRoot={() => onSetRootPerson(spouse.id)}
                      onEdit={() => onEditPerson && onEditPerson(spouse)}
                      isRoot={false}
                      isExPartner={isEx}
                      magnify={magnifyOnHover}
                      lang={lang}
                      theme={theme}
                    />
                  </div>
                );
              })}

              {/* Link / Add Spouse button */}
              <button
                onClick={() => onAddSpouse(rootPerson.id)}
                className={theme === 'win98'
                  ? 'win98-btn px-3 py-2 text-xs font-bold flex items-center space-x-1.5 shrink-0 text-black'
                  : 'px-3.5 py-3 rounded-2xl border border-dashed border-slate-700 hover:border-pink-500/60 hover:bg-pink-500/10 text-slate-400 hover:text-pink-300 text-xs font-medium transition flex items-center space-x-2 shrink-0'
                }
                title={lang === 'zh' ? '添加或关联新配偶、续弦再婚或多配偶' : 'Link or add spouse, remarriage, or partner'}
              >
                <Heart className="w-4 h-4 text-pink-500" />
                <span>+ {spouses.length > 0 ? (lang === 'zh' ? '再婚/配偶' : 'Add Spouse') : (lang === 'zh' ? '关联配偶' : 'Link Spouse')}</span>
              </button>
            </div>

            {children.length > 0 && <div className={`w-0.5 h-8 ${theme === 'win98' ? 'bg-black/60' : 'bg-emerald-500/50'}`} />}
          </div>

          {/* LEVEL 4: CHILDREN */}
          {children.length > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                theme === 'win98' 
                  ? 'win98-box px-3 py-0.5 text-black bg-[#c0c0c0]' 
                  : 'text-emerald-400/90 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20'
              }`}>
                {lang === 'zh' ? '子女后代' : 'Children'} ({children.length})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {children.map(child => (
                  <PersonNodeCard
                    key={child.id}
                    person={child}
                    role={child.gender === 'female' ? (lang === 'zh' ? '女儿' : 'Daughter') : (lang === 'zh' ? '儿子' : 'Son')}
                    onSelect={() => onSelectPerson(child)}
                    onSetRoot={() => onSetRootPerson(child.id)}
                    onEdit={() => onEditPerson && onEditPerson(child)}
                    isRoot={false}
                    magnify={magnifyOnHover}
                    lang={lang}
                    theme={theme}
                  />
                ))}
              </div>

              {grandchildren.length > 0 && <div className={`w-0.5 h-8 ${theme === 'win98' ? 'bg-black/60' : 'bg-teal-500/50'}`} />}
            </div>
          )}

          {/* LEVEL 5: GRANDCHILDREN */}
          {grandchildren.length > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                theme === 'win98' 
                  ? 'win98-box px-3 py-0.5 text-black bg-[#c0c0c0]' 
                  : 'text-teal-400/90 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20'
              }`}>
                {lang === 'zh' ? '孙辈后代' : 'Grandchildren'} ({grandchildren.length})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {grandchildren.map(gc => (
                  <PersonNodeCard
                    key={gc.id}
                    person={gc}
                    role={gc.gender === 'female' ? (lang === 'zh' ? '孙女' : 'Granddaughter') : (lang === 'zh' ? '孙子' : 'Grandson')}
                    onSelect={() => onSelectPerson(gc)}
                    onSetRoot={() => onSetRootPerson(gc.id)}
                    onEdit={() => onEditPerson && onEditPerson(gc)}
                    isRoot={false}
                    magnify={magnifyOnHover}
                    lang={lang}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PersonNodeCard({
  person,
  role,
  onSelect,
  onSetRoot,
  isRoot = false,
  compact = false,
  isExPartner = false,
  onAddChild,
  onAddSpouse,
  onExploreAncestors,
  onExploreCousins,
  onEdit,
  magnify = true,
  lang = 'en',
  theme = 'win98'
}) {
  const isFemale = person.gender === 'female';

  if (theme === 'win98') {
    const titleClass = isRoot 
      ? 'win98-title-gold' 
      : isExPartner 
      ? 'win98-title-gray' 
      : isFemale 
      ? 'win98-title-rose' 
      : 'win98-title-navy';

    return (
      <div
        onClick={onSelect}
        className={`group relative win98-box cursor-pointer select-none transition-transform duration-200 origin-center ${
          magnify 
            ? 'hover:scale-[1.85] hover:z-50 hover:shadow-2xl' 
            : 'hover:scale-[1.03]'
        } ${
          isRoot 
            ? 'ring-2 ring-blue-800 shadow-2xl z-10 w-72' 
            : `${compact ? 'w-56' : 'w-64'}`
        }`}
      >
        {/* Win98 Window Title Bar */}
        <div className={`px-2 py-0.5 flex items-center justify-between text-xs font-bold text-white select-none ${titleClass}`}>
          <div className="flex items-center space-x-1.5 truncate">
            <span className="text-[11px]">{isRoot ? '👑' : (isFemale ? '♀' : '♂')}</span>
            <span className="truncate">{role}</span>
          </div>
          <div className="flex items-center space-x-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <span className="win98-icon-btn">_</span>
            <span className="win98-icon-btn">✕</span>
          </div>
        </div>

        {/* Win98 Sunken White Panel for Maximum Legibility */}
        <div className="m-1 win98-sunken p-2.5 bg-white text-black flex items-start space-x-3">
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={formatFullName(person, lang)}
              className="w-12 h-12 rounded object-cover border border-gray-400 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-[#dfdfdf] border border-gray-400 rounded flex items-center justify-center text-gray-700 shrink-0 font-bold text-lg">
              {person.gender === 'female' ? '♀' : '♂'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-black text-sm md:text-base leading-snug truncate">
              {formatFullName(person, lang)}
            </h3>

            {person.chineseName && (
              <div className="text-xs font-bold text-[#000080] truncate mt-0.5">
                {person.chineseName}
              </div>
            )}

            <p className="text-xs font-bold text-neutral-800 mt-1">
              {getLifespan(person, lang)}
            </p>

            <div className="mt-1 flex items-center space-x-1">
              {person.isLiving ? (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded">
                  {lang === 'zh' ? '在世' : 'Living'}
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-neutral-200 text-neutral-800 border border-neutral-400 rounded">
                  {lang === 'zh' ? '已故' : 'Deceased'}
                </span>
              )}
              {person.occupation && (
                <span className="text-[10px] text-neutral-600 truncate">
                  • {person.occupation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win98 Action Buttons */}
        {isRoot ? (
          <div className="p-1 pt-0 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={onExploreAncestors}
              className="win98-btn flex-1 text-xs font-bold py-1 px-1.5 flex items-center justify-center text-black"
            >
              <GitFork className="w-3 h-3 mr-1 rotate-180" /> {lang === 'zh' ? '祖先' : 'Ancestors'}
            </button>
            <button
              onClick={onExploreCousins}
              className="win98-btn flex-1 text-xs font-bold py-1 px-1.5 flex items-center justify-center text-black"
            >
              <Users className="w-3 h-3 mr-1" /> {lang === 'zh' ? '堂表亲' : 'Cousins'}
            </button>
            {onAddSpouse && (
              <button
                onClick={onAddSpouse}
                className="win98-btn text-xs font-bold py-1 px-1.5 flex items-center justify-center text-black"
                title={lang === 'zh' ? '添加或关联配偶' : 'Add or Link Spouse'}
              >
                <Heart className="w-3 h-3 mr-0.5 text-rose-600" /> {lang === 'zh' ? '配偶' : 'Spouse'}
              </button>
            )}
            {onAddChild && (
              <button
                onClick={onAddChild}
                className="win98-btn text-xs font-bold py-1 px-1.5 flex items-center justify-center text-black"
              >
                <Plus className="w-3 h-3 mr-0.5" /> {lang === 'zh' ? '子女' : 'Child'}
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="win98-btn text-xs font-bold py-1 px-1.5 flex items-center justify-center text-black"
                title={lang === 'zh' ? '编辑族人' : 'Edit Member'}
              >
                <Edit className="w-3 h-3 mr-0.5" /> {lang === 'zh' ? '编辑' : 'Edit'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-1 pt-0 flex items-center justify-between text-xs" onClick={e => e.stopPropagation()}>
            <button
              onClick={onSetRoot}
              className="win98-btn text-xs font-bold py-0.5 px-2 flex items-center text-black"
            >
              <Eye className="w-3 h-3 mr-1" /> {lang === 'zh' ? '定为中心' : 'Focus'}
            </button>
            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="win98-btn text-xs font-bold py-0.5 px-1.5 flex items-center text-black"
                  title={lang === 'zh' ? '编辑族人' : 'Edit Member'}
                >
                  <Edit className="w-3 h-3 mr-1" /> {lang === 'zh' ? '编辑' : 'Edit'}
                </button>
              )}
              <span className="text-[10px] text-gray-700 font-bold">{lang === 'zh' ? '详情' : 'Info'}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modern Theme Card rendering (preserved for modern theme toggle)
  const genderBorder = isExPartner 
    ? 'border-dashed border-rose-500/40 hover:border-rose-400'
    : isFemale 
    ? 'border-pink-500/40 hover:border-pink-400' 
    : 'border-blue-500/40 hover:border-blue-400';

  const roleBadgeColor = isRoot 
    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
    : isExPartner
    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    : isFemale 
    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30';

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-slate-900 border rounded-2xl cursor-pointer transition-all duration-300 ease-out origin-center ${
        magnify 
          ? 'hover:scale-[2] hover:z-50 hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95)] hover:ring-2 hover:ring-indigo-400/80 hover:border-indigo-400' 
          : 'hover:scale-[1.03]'
      } ${
        isRoot 
          ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10 highlight-node p-5 w-72' 
          : `${genderBorder} hover:shadow-xl hover:shadow-indigo-500/5 ${compact ? 'p-3 w-52' : 'p-4 w-64'}`
      }`}
    >
      <div className="flex items-start space-x-3">
        {person.avatar ? (
          <img
            src={person.avatar}
            alt={formatFullName(person, lang)}
            className={`rounded-full object-cover border-2 shrink-0 ${
              isRoot ? 'w-14 h-14 border-indigo-400' : `${compact ? 'w-10 h-10' : 'w-12 h-12'} border-slate-700`
            }`}
          />
        ) : (
          <div className={`rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 shrink-0 ${
            isRoot ? 'w-14 h-14' : `${compact ? 'w-10 h-10' : 'w-12 h-12'}`
          }`}>
            <User className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${roleBadgeColor}`}>
              {role}
            </span>
          </div>

          <h3 className={`font-bold text-white truncate mt-1 group-hover:text-indigo-300 transition ${isRoot ? 'text-base' : 'text-sm'}`}>
            {formatFullName(person, lang)}
          </h3>

          <p className="text-xs text-slate-400 truncate mt-0.5">
            {getLifespan(person, lang)}
          </p>
        </div>
      </div>

      {/* Root card extra actions */}
      {isRoot && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onExploreAncestors}
            className="flex-1 text-[11px] font-medium py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center justify-center transition"
          >
            <GitFork className="w-3 h-3 mr-1 rotate-180" /> {lang === 'zh' ? '祖先' : 'Ancestors'}
          </button>
          <button
            onClick={onExploreCousins}
            className="flex-1 text-[11px] font-medium py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 flex items-center justify-center transition"
          >
            <Users className="w-3 h-3 mr-1" /> {lang === 'zh' ? '堂表亲' : 'Cousins'}
          </button>
          {onAddSpouse && (
            <button
              onClick={onAddSpouse}
              className="text-[11px] font-medium py-1.5 px-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 flex items-center justify-center transition"
              title={lang === 'zh' ? '添加或关联配偶' : 'Add or Link Spouse'}
            >
              <Heart className="w-3 h-3 mr-0.5" /> {lang === 'zh' ? '配偶' : 'Spouse'}
            </button>
          )}
          <button
            onClick={onAddChild}
            className="text-[11px] font-medium py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 flex items-center justify-center transition"
          >
            <Plus className="w-3 h-3 mr-0.5" /> {lang === 'zh' ? '子女' : 'Child'}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-[11px] font-medium py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex items-center justify-center transition"
              title={lang === 'zh' ? '编辑族人' : 'Edit Member'}
            >
              <Edit className="w-3 h-3 mr-0.5" /> {lang === 'zh' ? '编辑' : 'Edit'}
            </button>
          )}
        </div>
      )}

      {/* Set as root button & edit button for non-root nodes */}
      {!isRoot && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <button
            onClick={onSetRoot}
            className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center transition"
          >
            <Eye className="w-3 h-3 mr-1" /> {lang === 'zh' ? '定为世系中心' : 'Focus Tree Here'}
          </button>
          <div className="flex items-center space-x-1.5">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center transition px-1.5 py-0.5 rounded hover:bg-slate-800"
                title={lang === 'zh' ? '编辑族人' : 'Edit Member'}
              >
                <Edit className="w-3 h-3 mr-1" /> {lang === 'zh' ? '编辑' : 'Edit'}
              </button>
            )}
            <span className="text-[10px] text-slate-600">{lang === 'zh' ? '详情 →' : 'Details →'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
