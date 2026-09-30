import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Users, GitFork, Compass, ArrowRight, User, Heart, 
  MapPin, Calendar, Briefcase, Award, ChevronRight, Filter, Sparkles, Globe, Church
} from 'lucide-react';
import { 
  formatFullName, 
  getLifespan, 
  getAncestors, 
  getCousins, 
  calculateRelationship 
} from '../utils/genealogy';
import { translations, getDetailedKinshipTerm } from '../utils/i18n';

export default function GenealogyExplorer({ 
  persons = [], 
  personsMap, 
  relationships = [],
  selectedPersonId, 
  onSelectPerson,
  initialTab = 'ancestors',
  initialTargetBId = null,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [subjectId, setSubjectId] = useState(selectedPersonId || persons[0]?.id || '');
  const [targetBId, setTargetBId] = useState(initialTargetBId || (persons[1]?.id !== subjectId ? persons[1]?.id : persons[2]?.id) || '');
  
  // Filters
  const [ancestorFilter, setAncestorFilter] = useState('all');
  const [cousinFilter, setCousinFilter] = useState('all');
  const [selectedRelIndex, setSelectedRelIndex] = useState(0);

  const subject = personsMap.get(subjectId);
  const targetB = personsMap.get(targetBId);

  // Sync subjectId if selectedPersonId prop changes externally
  useEffect(() => {
    if (selectedPersonId) {
      setSubjectId(selectedPersonId);
    }
  }, [selectedPersonId]);

  // Sync initialTargetBId if passed
  useEffect(() => {
    if (initialTargetBId) {
      setTargetBId(initialTargetBId);
      setActiveTab('calculator');
    }
  }, [initialTargetBId]);

  // Reset selected relationship index when pair changes
  useEffect(() => {
    setSelectedRelIndex(0);
  }, [subjectId, targetBId]);

  // Compute Ancestors
  const ancestors = useMemo(() => {
    if (!subjectId) return [];
    return getAncestors(subjectId, personsMap);
  }, [subjectId, personsMap]);

  // Group ancestors by generation
  const ancestorsByGeneration = useMemo(() => {
    const grouped = {};
    ancestors.forEach(item => {
      if (ancestorFilter !== 'all' && item.lineageType !== ancestorFilter && item.generation > 1) {
        return;
      }
      if (!grouped[item.generation]) grouped[item.generation] = [];
      grouped[item.generation].push(item);
    });
    return grouped;
  }, [ancestors, ancestorFilter]);

  // Compute Cousins (with specific breakdown)
  const cousins = useMemo(() => {
    if (!subjectId) return [];
    return getCousins(subjectId, personsMap, relationships);
  }, [subjectId, personsMap, relationships]);

  // Filtered Cousins
  const filteredCousins = useMemo(() => {
    if (cousinFilter === 'all') return cousins;
    return cousins.filter(c => c.degree === Number(cousinFilter));
  }, [cousins, cousinFilter]);

  // Kinship between subject and targetB
  const kinship = useMemo(() => {
    if (!subjectId || !targetBId) return null;
    return calculateRelationship(subjectId, targetBId, personsMap, relationships);
  }, [subjectId, targetBId, personsMap, relationships]);

  // Active selected relationship (for dual / multi-kinship pairs)
  const activeKinship = useMemo(() => {
    if (!kinship) return null;
    if (kinship.allRelationships && kinship.allRelationships[selectedRelIndex]) {
      return kinship.allRelationships[selectedRelIndex];
    }
    return kinship;
  }, [kinship, selectedRelIndex]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      
      {/* Top Header & Person Picker */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {lang === 'zh' ? '家族亲属与寻祖探亲引擎' : 'Genealogy & Kinship Explorer'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'zh' 
                ? '精准追溯父系母系祖先、查找全代堂亲表亲（细分叔伯姑舅与侄甥辈）、推算任意两人亲属称谓。'
                : 'Trace paternal & maternal lineages, discover cousins with Uncle/Aunt vs Niece/Nephew tier clarity, and calculate kinship paths.'}
            </p>
          </div>

          {/* Subject Person Picker */}
          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-inner">
            <span className="text-xs font-semibold uppercase text-slate-400 pl-2">{t.subject}:</span>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="bg-slate-800 text-white text-sm font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 transition max-w-xs truncate"
            >
              {persons.map(p => (
                <option key={p.id} value={p.id}>
                  {formatFullName(p, lang)} ({p.birthDate ? String(p.birthDate).substring(0, 4) : 'b.?'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mt-6 flex space-x-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('ancestors')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
              activeTab === 'ancestors'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4 rotate-180" />
            <span>{t.searchAncestors} ({ancestors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cousins')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
              activeTab === 'cousins'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.searchCousins} ({cousins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
              activeTab === 'calculator'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t.kinshipCalculator}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* TAB 1: ANCESTORS */}
          {activeTab === 'ancestors' && (
            <div className="space-y-6">
              
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {ancestors.length}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {lang === 'zh' ? `${formatFullName(subject, lang)} 的直系祖先` : `Direct Ancestors of ${formatFullName(subject, lang)}`}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {lang === 'zh' ? '按世代跨度排列，支持父系（本宗）与母系（外祖）筛选' : 'Organized by generational distance from subject'}
                    </p>
                  </div>
                </div>

                {/* Lineage Filter */}
                <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 px-2 flex items-center">
                    <Filter className="w-3 h-3 mr-1" /> {t.paternal}:
                  </span>
                  <button
                    onClick={() => setAncestorFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      ancestorFilter === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.all}
                  </button>
                  <button
                    onClick={() => setAncestorFilter('paternal')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      ancestorFilter === 'paternal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.paternal}
                  </button>
                  <button
                    onClick={() => setAncestorFilter('maternal')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      ancestorFilter === 'maternal' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.maternal}
                  </button>
                </div>
              </div>

              {ancestors.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/60 p-8">
                  <GitFork className="w-12 h-12 text-slate-600 mx-auto mb-3 rotate-180" />
                  <h3 className="text-lg font-medium text-slate-300">
                    {lang === 'zh' ? '暂未记录祖先信息' : 'No Ancestors Recorded Yet'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {formatFullName(subject, lang)} {lang === 'zh' ? '暂无关联父母。请编辑族人或直接在 data/family.json 添加父母。' : 'does not have parents attached yet. Edit in webapp or data/family.json.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(ancestorsByGeneration).map(([genStr, genAncestors]) => {
                    const gen = Number(genStr);
                    const genTitle = 
                      gen === 1 ? (lang === 'zh' ? '第一代祖辈：父母尊长' : '1st Generation: Parents') :
                      gen === 2 ? (lang === 'zh' ? '第二代祖辈：祖父母 / 外祖父母' : '2nd Generation: Grandparents') :
                      gen === 3 ? (lang === 'zh' ? '第三代祖辈：曾祖父母' : '3rd Generation: Great-Grandparents') :
                      (lang === 'zh' ? `第 ${gen} 代高祖与远祖` : `${gen}th Generation Ancestors`);

                    return (
                      <div key={gen} className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Gen {gen}
                          </span>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                            {genTitle} ({genAncestors.length})
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {genAncestors.map(({ person, lineageType, relationshipLabel, isAdoptive }) => {
                            const isFemale = person.gender === 'female';
                            const lineageBadge = lineageType === 'paternal' 
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : 'bg-pink-500/10 text-pink-300 border-pink-500/20';

                            return (
                              <div
                                key={person.id}
                                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition cursor-pointer"
                                onClick={() => onSelectPerson(person)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-3.5">
                                    {person.avatar ? (
                                      <img
                                        src={person.avatar}
                                        alt={formatFullName(person, lang)}
                                        className="w-13 h-13 rounded-full object-cover border-2 border-slate-700 group-hover:border-amber-400 transition"
                                      />
                                    ) : (
                                      <div className="w-13 h-13 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                                        <User className="w-6 h-6" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="flex items-center space-x-1.5 mb-1">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${lineageBadge}`}>
                                          {relationshipLabel}
                                        </span>
                                      </div>
                                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                                        {formatFullName(person, lang)}
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        {getLifespan(person, lang)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                                  {person.ethnicity && (
                                    <div className="flex items-center truncate text-emerald-400">
                                      <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                      <span>{person.ethnicity}</span>
                                    </div>
                                  )}
                                  {person.birthPlace && (
                                    <div className="flex items-center truncate">
                                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                                      <span className="truncate">{person.birthPlace}</span>
                                    </div>
                                  )}
                                  {person.occupation && (
                                    <div className="flex items-center truncate">
                                      <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                                      <span className="truncate">{person.occupation}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center justify-between pt-2">
                                  <span className="text-[11px] text-amber-400/80 font-medium">
                                    {lang === 'zh' ? '点击查看此族人详情' : 'Click to inspect lineage'}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition transform group-hover:translate-x-1" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COUSINS */}
          {activeTab === 'cousins' && (
            <div className="space-y-6">
              
              {/* Filter and stats header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    {cousins.length}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {lang === 'zh' ? `${formatFullName(subject, lang)} 的堂亲与表亲` : `Cousins of ${formatFullName(subject, lang)}`}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {lang === 'zh'
                        ? '支持同辈堂表亲、一代差（父母辈堂叔/表舅/堂姑/表姨 vs 晚辈堂表侄甥）精确辨析'
                        : 'Identifies 1st cousins, 1st cousins once removed (Uncle/Aunt tier vs Niece/Nephew tier), and 2nd cousins'}
                    </p>
                  </div>
                </div>

                {/* Degree Filter */}
                <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 px-2 flex items-center">
                    <Filter className="w-3 h-3 mr-1" /> {t.degree}:
                  </span>
                  <button
                    onClick={() => setCousinFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      cousinFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.all} ({cousins.length})
                  </button>
                  <button
                    onClick={() => setCousinFilter('1')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      cousinFilter === '1' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1st ({cousins.filter(c => c.degree === 1).length})
                  </button>
                  <button
                    onClick={() => setCousinFilter('2')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      cousinFilter === '2' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2nd ({cousins.filter(c => c.degree === 2).length})
                  </button>
                </div>
              </div>

              {filteredCousins.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/60 p-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-300">
                    {lang === 'zh' ? '暂未发现堂表亲' : 'No Cousins Found'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {lang === 'zh' 
                      ? '当叔伯姑舅有后代关联时，系统将自动发掘堂兄弟姐妹或表兄弟姐妹。'
                      : 'Cousins are discovered when aunts or uncles have children attached.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCousins.map((cousin, idx) => {
                    const p = cousin.person;
                    const degreeBadge = cousin.degree === 1 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

                    return (
                      <div
                        key={p.id}
                        className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition cursor-pointer"
                        onClick={() => onSelectPerson(p)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3.5">
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={formatFullName(p, lang)}
                                className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 group-hover:border-purple-400 transition"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                                <User className="w-7 h-7" />
                              </div>
                            )}
                            <div>
                              <div className="flex flex-col mb-1">
                                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${degreeBadge}`}>
                                  {cousin.label}
                                </span>
                                {cousin.chineseTerm && (
                                  <span className="text-xs font-semibold text-amber-300 mt-1">
                                    称谓: {cousin.chineseTerm}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                                {formatFullName(p, lang)}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {getLifespan(p, lang)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Granular Subtitle: Uncle/Aunt generation vs Niece/Nephew tier */}
                        <div className="mt-3 text-xs text-purple-200 bg-purple-950/30 p-2.5 rounded-xl border border-purple-900/30">
                          {cousin.subtitle}
                        </div>

                        {/* Common Ancestor Highlight */}
                        <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-purple-400 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" /> {t.commonAncestor}
                          </div>
                          <div className="text-xs text-slate-200 mt-0.5 font-medium">
                            {cousin.commonAncestors.join(', ')}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="mt-3 space-y-1 text-xs text-slate-400">
                          {p.occupation && (
                            <div className="flex items-center truncate">
                              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                              <span>{p.occupation}</span>
                            </div>
                          )}
                          {p.birthPlace && (
                            <div className="flex items-center truncate">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                              <span>{p.birthPlace}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetBId(p.id);
                              setActiveTab('calculator');
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center"
                          >
                            <Compass className="w-3.5 h-3.5 mr-1" />
                            {lang === 'zh' ? '推算亲属脉络图' : 'View Kinship Path'}
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KINSHIP CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              
              {/* Pair Selectors */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center">
                  <Compass className="w-5 h-5 text-indigo-400 mr-2" />
                  {lang === 'zh' ? '选择任意两位族人推算亲属称谓与亲缘路径' : 'Select Any Two Family Members to Calculate Kinship'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Person A */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <label className="block text-xs font-semibold uppercase text-indigo-400 mb-2">
                      {lang === 'zh' ? '第一位族人 (本位)' : 'Person A (Origin)'}
                    </label>
                    <select
                      value={subjectId}
                      onChange={e => setSubjectId(e.target.value)}
                      className="w-full bg-slate-900 text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 transition"
                    >
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>
                          {formatFullName(p, lang)} ({p.gender || '?'})
                        </option>
                      ))}
                    </select>
                    {subject && (
                      <div className="mt-3 flex items-center space-x-3 text-xs text-slate-400">
                        {subject.avatar && <img src={subject.avatar} className="w-8 h-8 rounded-full object-cover" />}
                        <div>
                          <div className="font-semibold text-slate-200">{formatFullName(subject, lang)}</div>
                          <div>{getLifespan(subject, lang)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Person B */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <label className="block text-xs font-semibold uppercase text-pink-400 mb-2">
                      {lang === 'zh' ? '第二位族人 (目标)' : 'Person B (Target)'}
                    </label>
                    <select
                      value={targetBId}
                      onChange={e => setTargetBId(e.target.value)}
                      className="w-full bg-slate-900 text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-pink-500 transition"
                    >
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>
                          {formatFullName(p, lang)} ({p.gender || '?'})
                        </option>
                      ))}
                    </select>
                    {targetB && (
                      <div className="mt-3 flex items-center space-x-3 text-xs text-slate-400">
                        {targetB.avatar && <img src={targetB.avatar} className="w-8 h-8 rounded-full object-cover" />}
                        <div>
                          <div className="font-semibold text-slate-200">{formatFullName(targetB, lang)}</div>
                          <div>{getLifespan(targetB, lang)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Result Card */}
              {activeKinship && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  
                  {/* Multi-Relationship Selector when dual/multiple relationships exist */}
                  {kinship?.allRelationships && kinship.allRelationships.length > 1 && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-amber-300 flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400 animate-pulse" />
                          {lang === 'zh' ? '检测到多重亲属关系 (兼具多条亲缘脉络)' : 'Dual / Multiple Kinship Detected'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {lang === 'zh' ? `共发现 ${kinship.allRelationships.length} 条关系通道，点击可切换查看对应世系脉络` : `${kinship.allRelationships.length} distinct connections found — click to switch`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {kinship.allRelationships.map((r, rIdx) => {
                          const isSelected = selectedRelIndex === rIdx;
                          return (
                            <button
                              key={rIdx}
                              onClick={() => setSelectedRelIndex(rIdx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                              }`}
                            >
                              <span className="opacity-70 text-[10px]">#{rIdx + 1}</span>
                              <span>{lang === 'zh' ? (r.chineseTitle || r.title) : r.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 rounded-xl border border-indigo-500/20">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">
                        {lang === 'zh' ? '推算亲属称谓' : 'Kinship Calculation'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                        {formatFullName(targetB, lang)} {lang === 'zh' ? '是' : 'is'} {formatFullName(subject, lang)} {lang === 'zh' ? '的' : '’s'}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                          {lang === 'zh' ? (activeKinship.chineseTitle || activeKinship.title) : activeKinship.title}
                        </span>
                      </h2>
                      {activeKinship.chineseTitle && lang !== 'zh' && (
                        <div className="text-xs text-amber-300 font-medium mt-1">
                          Chinese Kinship Term (中文称谓): <span className="font-bold">{activeKinship.chineseTitle}</span>
                        </div>
                      )}
                      {(activeKinship.isAdoptive || activeKinship.isFoster) && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-2">
                          {activeKinship.isAdoptive 
                            ? (lang === 'zh' ? '领养亲缘关系' : 'Adoptive Lineage Relationship') 
                            : (lang === 'zh' ? '寄养亲缘关系' : 'Foster Lineage Relationship')}
                        </div>
                      )}
                      {activeKinship.notes && (
                        <p className="text-xs text-slate-300 mt-1">{activeKinship.notes}</p>
                      )}
                    </div>

                    <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-center shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t.relationshipType}</div>
                      <div className="text-xs font-bold text-indigo-300 capitalize">{activeKinship.degreeType?.replace('_', ' ') || 'Family'}</div>
                    </div>
                  </div>

                  {/* Step-by-Step Connection Path Visualizer */}
                  {activeKinship.path && activeKinship.path.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                        <GitFork className="w-4 h-4 mr-1.5 text-indigo-400" />
                        {t.lineagePath} ({activeKinship.path.length} {lang === 'zh' ? '个节点' : 'steps'})
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                        {activeKinship.path.map((node, i) => (
                          <React.Fragment key={node.id || i}>
                            <button
                              onClick={() => {
                                const p = personsMap.get(node.id);
                                if (p) onSelectPerson(p);
                              }}
                              className={`px-4 py-3 rounded-xl border text-left transition flex items-center space-x-3 ${
                                i === 0 
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                                  : i === activeKinship.path.length - 1
                                  ? 'bg-pink-600/20 border-pink-500 text-pink-200'
                                  : 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <div>
                                <div className="text-sm font-bold">{node.name}</div>
                                {node.role && <div className="text-xs text-slate-400 capitalize">{node.role}</div>}
                              </div>
                            </button>

                            {i < activeKinship.path.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
