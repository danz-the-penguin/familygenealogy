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
  lang = 'en',
  theme = 'win98'
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
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${
      theme === 'win98' ? 'bg-[#c0c0c0] text-black' : 'bg-slate-950 text-white'
    }`}>
      
      {/* Top Header & Person Picker */}
      <div className={`p-4 md:p-6 ${
        theme === 'win98' 
          ? 'bg-[#c0c0c0] border-b border-gray-400' 
          : 'border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md'
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`p-1.5 rounded-lg ${
                theme === 'win98' ? 'win98-box text-black' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                <Compass className="w-5 h-5" />
              </span>
              <h1 className={`text-xl md:text-2xl font-black tracking-tight ${
                theme === 'win98' ? 'text-black' : 'text-white'
              }`}>
                {lang === 'zh' ? '家族亲属与寻祖探亲引擎' : 'Genealogy & Kinship Explorer'}
              </h1>
            </div>
            <p className={`text-xs mt-1 font-semibold ${
              theme === 'win98' ? 'text-gray-800' : 'text-slate-400'
            }`}>
              {lang === 'zh' 
                ? '精准追溯父系母系祖先、查找全代堂亲表亲（细分叔伯姑舅与侄甥辈）、推算任意两人亲属称谓。'
                : 'Trace paternal & maternal lineages, discover cousins with Uncle/Aunt vs Niece/Nephew tier clarity, and calculate kinship paths.'}
            </p>
          </div>

          {/* Subject Person Picker */}
          <div className={`flex items-center space-x-2 p-1.5 ${
            theme === 'win98' ? 'win98-box' : 'bg-slate-900 border border-slate-800 rounded-2xl shadow-inner'
          }`}>
            <span className={`text-xs font-bold uppercase pl-2 ${
              theme === 'win98' ? 'text-black' : 'text-slate-400'
            }`}>{t.subject}:</span>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
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
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`max-w-6xl mx-auto mt-3 sm:mt-5 flex space-x-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 ${
          theme === 'win98' ? 'border-b-2 border-gray-400' : 'border-b border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('ancestors')}
            className={theme === 'win98'
              ? `win98-btn px-3 sm:px-4 py-1.5 text-xs font-bold flex items-center space-x-1.5 text-black shrink-0 ${activeTab === 'ancestors' ? 'win98-btn-active bg-white' : ''}`
              : `flex items-center space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b-2 font-medium text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'ancestors'
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`
            }
          >
            <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
            <span>{t.searchAncestors} ({ancestors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cousins')}
            className={theme === 'win98'
              ? `win98-btn px-3 sm:px-4 py-1.5 text-xs font-bold flex items-center space-x-1.5 text-black shrink-0 ${activeTab === 'cousins' ? 'win98-btn-active bg-white' : ''}`
              : `flex items-center space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b-2 font-medium text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'cousins'
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`
            }
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t.searchCousins} ({cousins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={theme === 'win98'
              ? `win98-btn px-3 sm:px-4 py-1.5 text-xs font-bold flex items-center space-x-1.5 text-black shrink-0 ${activeTab === 'calculator' ? 'win98-btn-active bg-white' : ''}`
              : `flex items-center space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b-2 font-medium text-xs sm:text-sm transition shrink-0 ${
                  activeTab === 'calculator'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`
            }
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t.kinshipCalculator}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* TAB 1: ANCESTORS */}
          {activeTab === 'ancestors' && (
            <div className="space-y-6">
              
              {/* Controls bar */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 ${
                theme === 'win98' ? 'win98-box bg-[#c0c0c0] text-black' : 'bg-slate-900/50 rounded-2xl border border-slate-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-lg ${
                    theme === 'win98' ? 'win98-sunken bg-white text-black' : 'rounded-xl bg-amber-500/20 text-amber-400'
                  }`}>
                    {ancestors.length}
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                      {lang === 'zh' ? `${formatFullName(subject, lang)} 的直系祖先` : `Direct Ancestors of ${formatFullName(subject, lang)}`}
                    </h2>
                    <p className={`text-xs ${theme === 'win98' ? 'text-gray-800 font-semibold' : 'text-slate-400'}`}>
                      {lang === 'zh' ? '按世代跨度排列，支持父系（本宗）与母系（外祖）筛选' : 'Organized by generational distance from subject'}
                    </p>
                  </div>
                </div>

                {/* Lineage Filter */}
                <div className={`flex items-center space-x-1.5 p-1.5 ${
                  theme === 'win98' ? 'win98-box bg-[#c0c0c0]' : 'bg-slate-950/80 rounded-xl border border-slate-800'
                }`}>
                  <span className={`text-xs font-bold px-1.5 flex items-center ${
                    theme === 'win98' ? 'text-black' : 'text-slate-400'
                  }`}>
                    <Filter className="w-3 h-3 mr-1" /> {t.paternal}:
                  </span>
                  <button
                    onClick={() => setAncestorFilter('all')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${ancestorFilter === 'all' ? 'win98-btn-active bg-[#d4d0c8]' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          ancestorFilter === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    {t.all}
                  </button>
                  <button
                    onClick={() => setAncestorFilter('paternal')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${ancestorFilter === 'paternal' ? 'win98-btn-active bg-blue-100 text-blue-950' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          ancestorFilter === 'paternal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    {t.paternal}
                  </button>
                  <button
                    onClick={() => setAncestorFilter('maternal')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${ancestorFilter === 'maternal' ? 'win98-btn-active bg-pink-100 text-pink-950' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          ancestorFilter === 'maternal' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
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

                            if (theme === 'win98') {
                              return (
                                <div
                                  key={person.id}
                                  className="win98-box p-1 hover:scale-[1.01] transition-transform cursor-pointer select-none"
                                  onClick={() => onSelectPerson(person)}
                                >
                                  <div className={`px-2.5 py-0.5 flex items-center justify-between text-xs font-bold text-white ${isFemale ? 'win98-title-rose' : 'win98-title-navy'}`}>
                                    <span>{relationshipLabel}</span>
                                    <span className="text-[10px] font-mono opacity-85 uppercase">{lineageType === 'paternal' ? (lang === 'zh' ? '父系' : 'Paternal') : (lang === 'zh' ? '母系' : 'Maternal')}</span>
                                  </div>
                                  <div className="m-1 win98-sunken p-3 bg-white text-black flex items-start space-x-3">
                                    {person.avatar ? (
                                      <img
                                        src={person.avatar}
                                        alt={formatFullName(person, lang)}
                                        className="w-13 h-13 rounded object-cover border border-gray-400 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-13 h-13 bg-[#dfdfdf] border border-gray-400 rounded flex items-center justify-center text-gray-800 font-bold text-xl shrink-0">
                                        {person.gender === 'female' ? '♀' : '♂'}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-black text-black break-words whitespace-normal leading-snug">
                                        {formatFullName(person, lang)}
                                      </h4>
                                      <p className="text-xs font-extrabold text-neutral-900 mt-0.5 whitespace-normal">
                                        {getLifespan(person, lang)}
                                      </p>
                                      {person.ethnicity && (
                                        <div className="text-xs text-emerald-900 font-bold mt-1">
                                          • {person.ethnicity}
                                        </div>
                                      )}
                                      {person.occupation && (
                                        <div className="text-xs text-neutral-800 font-bold">
                                          • {person.occupation}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

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
                                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition break-words whitespace-normal">
                                        {formatFullName(person, lang)}
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-0.5 whitespace-normal">
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
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 ${
                theme === 'win98' ? 'win98-box bg-[#c0c0c0] text-black' : 'bg-slate-900/50 rounded-2xl border border-slate-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-lg ${
                    theme === 'win98' ? 'win98-sunken bg-white text-black' : 'rounded-xl bg-purple-500/20 text-purple-400'
                  }`}>
                    {cousins.length}
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                      {lang === 'zh' ? `${formatFullName(subject, lang)} 的堂亲与表亲` : `Cousins of ${formatFullName(subject, lang)}`}
                    </h2>
                    <p className={`text-xs ${theme === 'win98' ? 'text-gray-800 font-semibold' : 'text-slate-400'}`}>
                      {lang === 'zh'
                        ? '支持同辈堂表亲、一代差（父母辈堂叔/表舅/堂姑/表姨 vs 晚辈堂表侄甥）精确辨析'
                        : 'Identifies 1st cousins, 1st cousins once removed (Uncle/Aunt tier vs Niece/Nephew tier), and 2nd cousins'}
                    </p>
                  </div>
                </div>

                {/* Degree Filter */}
                <div className={`flex items-center space-x-1.5 p-1.5 ${
                  theme === 'win98' ? 'win98-box bg-[#c0c0c0]' : 'bg-slate-950/80 rounded-xl border border-slate-800'
                }`}>
                  <span className={`text-xs font-bold px-1.5 flex items-center ${
                    theme === 'win98' ? 'text-black' : 'text-slate-400'
                  }`}>
                    <Filter className="w-3 h-3 mr-1" /> {t.degree}:
                  </span>
                  <button
                    onClick={() => setCousinFilter('all')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${cousinFilter === 'all' ? 'win98-btn-active bg-[#d4d0c8]' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          cousinFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    {t.all} ({cousins.length})
                  </button>
                  <button
                    onClick={() => setCousinFilter('1')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${cousinFilter === '1' ? 'win98-btn-active bg-purple-100 text-purple-950' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          cousinFilter === '1' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    1st ({cousins.filter(c => c.degree === 1).length})
                  </button>
                  <button
                    onClick={() => setCousinFilter('2')}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${cousinFilter === '2' ? 'win98-btn-active bg-indigo-100 text-indigo-950' : ''}`
                      : `px-3 py-1 rounded-lg text-xs font-medium transition ${
                          cousinFilter === '2' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    2nd ({cousins.filter(c => c.degree === 2).length})
                  </button>
                </div>
              </div>

              {filteredCousins.length === 0 ? (
                <div className={`text-center py-16 p-8 ${
                  theme === 'win98' ? 'win98-box bg-[#c0c0c0] text-black' : 'bg-slate-900/30 rounded-2xl border border-slate-800/60'
                }`}>
                  <Users className={`w-12 h-12 mx-auto mb-3 ${theme === 'win98' ? 'text-gray-700' : 'text-slate-600'}`} />
                  <h3 className={`text-lg font-bold ${theme === 'win98' ? 'text-black' : 'text-slate-300'}`}>
                    {lang === 'zh' ? '暂未发现堂表亲' : 'No Cousins Found'}
                  </h3>
                  <p className={`text-xs mt-1 font-semibold ${theme === 'win98' ? 'text-gray-800' : 'text-slate-500'}`}>
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

                    if (theme === 'win98') {
                      return (
                        <div
                          key={p.id}
                          className="win98-box p-1 hover:scale-[1.01] transition-transform cursor-pointer select-none"
                          onClick={() => onSelectPerson(p)}
                        >
                          <div className="px-2.5 py-0.5 flex items-center justify-between text-xs font-bold text-white win98-title-navy">
                            <span>{cousin.label}</span>
                            <span className="text-[10px] font-mono opacity-85 uppercase">{cousin.degree === 1 ? '1st Cousin' : '2nd Cousin'}</span>
                          </div>
                          <div className="m-1 win98-sunken p-3 bg-white text-black">
                            <div className="flex items-start space-x-3">
                              {p.avatar ? (
                                <img
                                  src={p.avatar}
                                  alt={formatFullName(p, lang)}
                                  className="w-13 h-13 rounded object-cover border border-gray-400 shrink-0"
                                />
                              ) : (
                                <div className="w-13 h-13 bg-[#dfdfdf] border border-gray-400 rounded flex items-center justify-center text-gray-800 font-bold text-xl shrink-0">
                                  {p.gender === 'female' ? '♀' : '♂'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-black text-black break-words whitespace-normal leading-snug">
                                  {formatFullName(p, lang)}
                                </h4>
                                {cousin.chineseTerm && (
                                  <div className="text-xs font-black text-[#000080] mt-0.5">
                                    称谓: {cousin.chineseTerm}
                                  </div>
                                )}
                                <p className="text-xs font-extrabold text-neutral-900 mt-0.5 whitespace-normal">
                                  {getLifespan(p, lang)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-black font-bold bg-[#dfdfdf] p-2 border border-gray-400">
                              {cousin.subtitle}
                            </div>

                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-400 text-xs font-bold text-black">
                              <span className="text-blue-900 font-black">✦ {t.commonAncestor}: </span>
                              {cousin.commonAncestors.join(', ')}
                            </div>

                            <div className="mt-2 flex items-center justify-between pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetBId(p.id);
                                  setActiveTab('calculator');
                                }}
                                className="win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center"
                              >
                                <Compass className="w-3.5 h-3.5 mr-1 text-indigo-900" />
                                {lang === 'zh' ? '推算亲属脉络' : 'View Kinship Path'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

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
              <div className={theme === 'win98' ? 'win98-box p-4 bg-[#c0c0c0] text-black' : 'bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl'}>
                <h3 className={`text-base font-bold mb-4 flex items-center ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                  <Compass className={`w-5 h-5 mr-2 ${theme === 'win98' ? 'text-blue-900' : 'text-indigo-400'}`} />
                  {lang === 'zh' ? '选择任意两位族人推算亲属称谓与亲缘路径' : 'Select Any Two Family Members to Calculate Kinship'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Person A */}
                  <div className={theme === 'win98' ? 'win98-sunken p-3 bg-white text-black' : 'bg-slate-950 p-4 rounded-xl border border-slate-800'}>
                    <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'win98' ? 'text-blue-900' : 'text-indigo-400'}`}>
                      {lang === 'zh' ? '第一位族人 (本位)' : 'Person A (Origin)'}
                    </label>
                    <select
                      value={subjectId}
                      onChange={e => setSubjectId(e.target.value)}
                      className={theme === 'win98'
                        ? 'w-full win98-sunken bg-white text-black font-bold text-xs p-2 focus:outline-none cursor-pointer'
                        : 'w-full bg-slate-900 text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 transition'
                      }
                    >
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>
                          {formatFullName(p, lang)} ({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')})
                        </option>
                      ))}
                    </select>
                    {subject && (
                      <div className="mt-3 flex items-center space-x-3 text-xs">
                        {subject.avatar && <img src={subject.avatar} className="w-8 h-8 rounded object-cover border border-gray-400" />}
                        <div>
                          <div className={`font-black ${theme === 'win98' ? 'text-black' : 'text-slate-200'}`}>{formatFullName(subject, lang)}</div>
                          <div className={`font-semibold ${theme === 'win98' ? 'text-neutral-800' : 'text-slate-400'}`}>{getLifespan(subject, lang)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Person B */}
                  <div className={theme === 'win98' ? 'win98-sunken p-3 bg-white text-black' : 'bg-slate-950 p-4 rounded-xl border border-slate-800'}>
                    <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'win98' ? 'text-rose-900' : 'text-pink-400'}`}>
                      {lang === 'zh' ? '第二位族人 (目标)' : 'Person B (Target)'}
                    </label>
                    <select
                      value={targetBId}
                      onChange={e => setTargetBId(e.target.value)}
                      className={theme === 'win98'
                        ? 'w-full win98-sunken bg-white text-black font-bold text-xs p-2 focus:outline-none cursor-pointer'
                        : 'w-full bg-slate-900 text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-pink-500 transition'
                      }
                    >
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>
                          {formatFullName(p, lang)} ({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')})
                        </option>
                      ))}
                    </select>
                    {targetB && (
                      <div className="mt-3 flex items-center space-x-3 text-xs">
                        {targetB.avatar && <img src={targetB.avatar} className="w-8 h-8 rounded object-cover border border-gray-400" />}
                        <div>
                          <div className={`font-black ${theme === 'win98' ? 'text-black' : 'text-slate-200'}`}>{formatFullName(targetB, lang)}</div>
                          <div className={`font-semibold ${theme === 'win98' ? 'text-neutral-800' : 'text-slate-400'}`}>{getLifespan(targetB, lang)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Result Card */}
              {activeKinship && (
                <div className={theme === 'win98' ? 'win98-box p-4 bg-[#c0c0c0] text-black space-y-4' : 'bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6'}>
                  
                  {/* Multi-Relationship Selector when dual/multiple relationships exist */}
                  {kinship?.allRelationships && kinship.allRelationships.length > 1 && (
                    <div className={`p-3 space-y-2 ${theme === 'win98' ? 'win98-box bg-[#dfdfdf] text-black' : 'bg-indigo-950/40 border border-indigo-500/30 rounded-xl'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className={`text-xs font-bold flex items-center ${theme === 'win98' ? 'text-blue-900' : 'text-amber-300'}`}>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          {lang === 'zh' ? '检测到多重亲属关系 (兼具多条亲缘脉络)' : 'Dual / Multiple Kinship Detected'}
                        </span>
                        <span className={`text-[11px] font-bold ${theme === 'win98' ? 'text-neutral-700' : 'text-slate-400'}`}>
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
                              className={theme === 'win98'
                                ? `win98-btn px-3 py-1 text-xs font-bold text-black flex items-center space-x-1.5 ${isSelected ? 'win98-btn-active bg-[#d4d0c8]' : ''}`
                                : `px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                                  }`
                              }
                            >
                              <span className="opacity-70 text-[10px]">#{rIdx + 1}</span>
                              <span>{lang === 'zh' ? (r.chineseTitle || r.title) : r.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={theme === 'win98'
                    ? 'p-4 win98-sunken bg-white text-black border-2 border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
                    : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 rounded-xl border border-indigo-500/20'
                  }>
                    <div>
                      <span className={`text-xs uppercase tracking-wider font-extrabold ${theme === 'win98' ? 'text-black' : 'text-indigo-400'}`}>
                        {lang === 'zh' ? '推算亲属称谓' : 'Kinship Calculation'}
                      </span>
                      <h2 className={`text-xl sm:text-2xl font-black mt-1 break-words whitespace-normal leading-snug ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                        {formatFullName(targetB, lang)} {lang === 'zh' ? '是' : 'is'} {formatFullName(subject, lang)} {lang === 'zh' ? '的' : '’s'}{' '}
                        <span className={theme === 'win98' ? 'text-[#000080] font-black' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400'}>
                          {lang === 'zh' ? (activeKinship.chineseTitle || activeKinship.title) : activeKinship.title}
                        </span>
                      </h2>
                      {activeKinship.chineseTitle && lang !== 'zh' && (
                        <div className={`text-xs font-bold mt-1 ${theme === 'win98' ? 'text-blue-900' : 'text-amber-300'}`}>
                          Chinese Kinship Term (中文称谓): <span className="font-extrabold">{activeKinship.chineseTitle}</span>
                        </div>
                      )}
                      {(activeKinship.isAdoptive || activeKinship.isFoster) && (
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold mt-2 ${theme === 'win98' ? 'bg-yellow-100 text-black border border-yellow-500' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {activeKinship.isAdoptive 
                            ? (lang === 'zh' ? '领养亲缘关系' : 'Adoptive Lineage Relationship') 
                            : (lang === 'zh' ? '寄养亲缘关系' : 'Foster Lineage Relationship')}
                        </div>
                      )}
                      {activeKinship.notes && (
                        <p className={`text-xs mt-1 font-semibold ${theme === 'win98' ? 'text-neutral-800' : 'text-slate-300'}`}>{activeKinship.notes}</p>
                      )}
                    </div>

                    <div className={`px-4 py-2 text-center shrink-0 ${theme === 'win98' ? 'win98-btn text-black' : 'bg-indigo-500/20 border border-indigo-500/30 rounded-xl'}`}>
                      <div className={`text-[10px] uppercase tracking-wider font-bold ${theme === 'win98' ? 'text-gray-700' : 'text-slate-400'}`}>{t.relationshipType}</div>
                      <div className={`text-xs font-bold capitalize ${theme === 'win98' ? 'text-black' : 'text-indigo-300'}`}>{activeKinship.degreeType?.replace('_', ' ') || 'Family'}</div>
                    </div>
                  </div>

                  {/* Step-by-Step Connection Path Visualizer */}
                  {activeKinship.path && activeKinship.path.length > 0 && (
                    <div className="space-y-4">
                      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center ${theme === 'win98' ? 'text-black' : 'text-slate-400'}`}>
                        <GitFork className="w-4 h-4 mr-1.5" />
                        {t.lineagePath} ({activeKinship.path.length} {lang === 'zh' ? '个节点' : 'steps'})
                      </h4>

                      <div className={`flex flex-wrap items-center gap-2.5 p-4 ${theme === 'win98' ? 'win98-sunken bg-white' : 'bg-slate-950 rounded-xl border border-slate-800/80'}`}>
                        {activeKinship.path.map((node, i) => (
                          <React.Fragment key={node.id || i}>
                            <button
                              onClick={() => {
                                const p = personsMap.get(node.id);
                                if (p) onSelectPerson(p);
                              }}
                              className={theme === 'win98'
                                ? `win98-btn px-3 py-2 text-left flex items-center space-x-2 text-black ${i === 0 ? 'bg-blue-100 font-extrabold' : i === activeKinship.path.length - 1 ? 'bg-pink-100 font-extrabold' : ''}`
                                : `px-4 py-3 rounded-xl border text-left transition flex items-center space-x-3 ${
                                    i === 0 
                                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                                      : i === activeKinship.path.length - 1
                                      ? 'bg-pink-600/20 border-pink-500 text-pink-200'
                                      : 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                                  }`
                              }
                            >
                              <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${theme === 'win98' ? 'win98-box bg-[#dfdfdf] text-black rounded-none' : 'rounded-full bg-slate-800 text-white'}`}>
                                {i + 1}
                              </div>
                              <div>
                                <div className="text-sm font-bold">{node.name}</div>
                                {node.role && <div className={`text-xs capitalize ${theme === 'win98' ? 'text-neutral-700 font-bold' : 'text-slate-400'}`}>{node.role}</div>}
                              </div>
                            </button>

                            {i < activeKinship.path.length - 1 && (
                              <ArrowRight className={`w-4 h-4 shrink-0 ${theme === 'win98' ? 'text-black' : 'text-slate-600'}`} />
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
