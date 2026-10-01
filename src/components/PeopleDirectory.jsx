import React, { useState, useMemo } from 'react';
import { 
  Search, User, MapPin, Calendar, Briefcase, Tag, GitFork, 
  Users, Eye, Plus, Filter, ShieldCheck, Heart, Globe, Award, Church, Edit, Layers
} from 'lucide-react';
import { formatFullName, getLifespan, normalizeSurname, groupPersonsBySurname } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function PeopleDirectory({ 
  persons = [], 
  onSelectPerson, 
  onSetRootPerson,
  onExploreAncestors,
  onExploreCousins,
  onAddNewPerson,
  onEditPerson,
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;

  const [query, setQuery] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('all');
  const [isGroupedBySurname, setIsGroupedBySurname] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [livingFilter, setLivingFilter] = useState('all');
  const [ethnicityFilter, setEthnicityFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');

  // Group persons by canonical surname / patronymic lineage
  const allSurnameGroups = useMemo(() => {
    return groupPersonsBySurname(persons);
  }, [persons]);

  // Collect unique tags & ethnicities
  const allTags = useMemo(() => {
    const tags = new Set();
    persons.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [persons]);

  const allEthnicities = useMemo(() => {
    const set = new Set();
    persons.forEach(p => {
      if (p.ethnicity && p.ethnicity.trim()) set.add(p.ethnicity.trim());
    });
    return Array.from(set).sort();
  }, [persons]);

  // Filtered persons
  const filtered = useMemo(() => {
    return persons.filter(p => {
      const rawSurname = (p.lastName && p.lastName.trim()) 
        ? p.lastName.trim() 
        : (p.patronymic && p.patronymic.trim() ? p.patronymic.trim() : '');
      const norm = normalizeSurname(rawSurname);

      if (query.trim()) {
        const q = query.toLowerCase();
        const fullName = `${p.firstName || ''} ${p.lastName || ''} ${p.maidenName || ''} ${p.chineseName || ''} ${p.patronymic || ''} ${p.christianName || ''}`.toLowerCase();
        const place = (p.birthPlace || '').toLowerCase();
        const burial = (p.burialPlace || p.burialSite || '').toLowerCase();
        const job = (p.occupation || '').toLowerCase();
        const ethnicity = (p.ethnicity || '').toLowerCase();
        const religions = (p.religions || []).map(r => r.name).join(' ').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const rootMatch = (norm.root || '').toLowerCase().includes(q) || (norm.displayGroup || '').toLowerCase().includes(q);

        if (!fullName.includes(q) && !place.includes(q) && !burial.includes(q) && !job.includes(q) && !ethnicity.includes(q) && !religions.includes(q) && !tags.includes(q) && !rootMatch) {
          return false;
        }
      }

      if (surnameFilter !== 'all' && norm.groupKey !== surnameFilter) return false;
      if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
      if (livingFilter === 'living' && !p.isLiving) return false;
      if (livingFilter === 'deceased' && p.isLiving) return false;
      if (ethnicityFilter !== 'all' && p.ethnicity !== ethnicityFilter) return false;
      if (selectedTag !== 'all' && !(p.tags || []).includes(selectedTag)) return false;

      return true;
    });
  }, [persons, query, surnameFilter, genderFilter, livingFilter, ethnicityFilter, selectedTag]);

  // Group filtered results if grouped view is enabled
  const groupedFiltered = useMemo(() => {
    if (!isGroupedBySurname) return null;
    return groupPersonsBySurname(filtered);
  }, [filtered, isGroupedBySurname]);

  // Render single person card
  const renderPersonCard = (person) => {
    const isFemale = person.gender === 'female';

    if (theme === 'win98') {
      const titleClass = isFemale ? 'win98-title-rose' : 'win98-title-navy';
      return (
        <div
          key={person.id}
          onClick={() => onSelectPerson(person)}
          className="win98-box cursor-pointer select-none p-1 transition-transform hover:scale-[1.02] flex flex-col justify-between"
        >
          <div>
            {/* Title bar */}
            <div className={`px-2 py-0.5 flex items-center justify-between text-xs font-bold text-white ${titleClass}`}>
              <span className="truncate">{person.gender === 'female' ? '♀ 女' : '♂ 男'} • {formatFullName(person, lang)}</span>
              <div className="flex items-center space-x-0.5" onClick={e => e.stopPropagation()}>
                <span className="win98-icon-btn">_</span>
                <span className="win98-icon-btn">✕</span>
              </div>
            </div>

            {/* Inset content */}
            <div className="m-1 win98-sunken p-2.5 bg-white text-black flex items-start space-x-3">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={formatFullName(person, lang)}
                  className="w-12 h-12 rounded object-cover border border-gray-400 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-[#dfdfdf] border border-gray-400 rounded flex items-center justify-center text-gray-700 font-bold text-base shrink-0">
                  {person.gender === 'female' ? '♀' : '♂'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-black text-sm md:text-base leading-snug truncate">
                  {formatFullName(person, lang)}
                </h3>
                {person.chineseName && (
                  <div className="text-xs font-bold text-[#000080] truncate">
                    {person.chineseName}
                  </div>
                )}
                <p className="text-xs font-bold text-gray-800 mt-1">
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
                    <span className="text-[10px] text-gray-600 truncate">
                      • {person.occupation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-1 pt-0 flex items-center justify-between gap-1 text-xs" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onSetRootPerson(person.id)}
              className="win98-btn flex-1 py-1 px-1.5 text-xs font-bold flex items-center justify-center text-black"
            >
              <Eye className="w-3 h-3 mr-1 text-blue-900" />
              <span>{lang === 'zh' ? '世系树' : 'Tree'}</span>
            </button>
            <button
              onClick={() => onExploreAncestors(person.id)}
              className="win98-btn flex-1 py-1 px-1.5 text-xs font-bold flex items-center justify-center text-black"
            >
              <GitFork className="w-3 h-3 mr-1 rotate-180" />
              <span>{lang === 'zh' ? '祖先' : 'Ancestors'}</span>
            </button>
            {onEditPerson && (
              <button
                onClick={() => onEditPerson(person)}
                className="win98-btn py-1 px-2 text-xs font-bold flex items-center text-black"
              >
                <Edit className="w-3 h-3 mr-1" />
                <span>{lang === 'zh' ? '编辑' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    const genderBadge = isFemale 
      ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' 
      : 'bg-blue-500/10 text-blue-300 border-blue-500/20';

    const rawSurname = (person.lastName && person.lastName.trim()) 
      ? person.lastName.trim() 
      : (person.patronymic && person.patronymic.trim() ? person.patronymic.trim() : '');
    const norm = normalizeSurname(rawSurname);

    return (
      <div
        key={person.id}
        onClick={() => onSelectPerson(person)}
        className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={formatFullName(person, lang)}
                  className="w-13 h-13 rounded-full object-cover border-2 border-slate-700 group-hover:border-indigo-400 transition"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${genderBadge}`}>
                    {person.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')}
                  </span>
                  {norm.isPatronymic && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      bin/binti
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                  {formatFullName(person, lang)}
                  {person.christianName && (
                    <span className="text-[11px] font-normal text-indigo-300/80 ml-1.5">
                      ({person.christianName})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {getLifespan(person, lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Vital stats, Religion & Ethnicity */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            {person.ethnicity && (
              <div className="flex items-center truncate text-emerald-400">
                <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>{person.ethnicity}</span>
              </div>
            )}
            {person.religions && person.religions.length > 0 && (
              <div className="flex items-center truncate text-amber-300">
                <Church className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>{person.religions.map(r => r.name).join(', ')}</span>
              </div>
            )}
            {person.birthPlace && (
              <div className="flex items-center truncate">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                <span className="truncate">{person.birthPlace}</span>
              </div>
            )}
            {(person.burialPlace || person.burialSite) && (
              <div className="flex items-center truncate text-slate-400">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-400 shrink-0" />
                <span className="truncate">{person.burialPlace || person.burialSite}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {person.tags && person.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {person.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onExploreAncestors(person.id)}
            className="text-[11px] font-medium py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition flex items-center"
          >
            <GitFork className="w-3 h-3 mr-1 rotate-180" /> {lang === 'zh' ? '祖先' : 'Ancestors'}
          </button>
          <button
            onClick={() => onExploreCousins(person.id)}
            className="text-[11px] font-medium py-1 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition flex items-center"
          >
            <Users className="w-3 h-3 mr-1" /> {lang === 'zh' ? '堂表亲' : 'Cousins'}
          </button>
          <button
            onClick={() => onSetRootPerson(person.id)}
            className="text-[11px] font-medium py-1 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition flex items-center"
          >
            <Eye className="w-3 h-3 mr-1" /> {lang === 'zh' ? '树' : 'Tree'}
          </button>
          {onEditPerson && (
            <button
              onClick={() => onEditPerson(person)}
              className="text-[11px] font-medium py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition flex items-center"
              title={t.editMember}
            >
              <Edit className="w-3 h-3 mr-1" /> {lang === 'zh' ? '编辑' : 'Edit'}
            </button>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${
      theme === 'win98' ? 'bg-[#c0c0c0] text-black font-semibold' : 'bg-slate-950 text-white'
    }`}>
      
      {/* Top Search & Filter Bar */}
      <div className={`p-4 md:p-6 ${
        theme === 'win98' ? 'bg-[#c0c0c0] border-b border-gray-400' : 'border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md'
      }`}>
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`text-xl md:text-2xl font-black tracking-tight flex items-center ${
                theme === 'win98' ? 'text-black' : 'text-white'
              }`}>
                <Users className={`w-6 h-6 mr-2 ${theme === 'win98' ? 'text-blue-900' : 'text-indigo-400'}`} />
                {lang === 'zh' ? '族人名录总表' : 'Family Directory'} ({filtered.length} / {persons.length})
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'zh' ? '支持搜索中英文姓名、族裔、宗教信仰、出生地与标签' : 'Search by Western & Chinese names, ethnicity, faith, birthplace, or tags'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsGroupedBySurname(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  isGroupedBySurname
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                }`}
                title={lang === 'zh' ? '按姓氏与父称世系分组展示' : 'Group members by surname & patronymic lineage'}
              >
                <Layers className="w-4 h-4 text-indigo-300" />
                <span>{t.groupBySurname}</span>
              </button>

              <button
                onClick={onAddNewPerson}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addMember}</span>
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === 'zh' ? '搜索姓名、中文汉字、民族、职业、宗教...' : 'Search name, Chinese characters, ethnicity, job...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <select
                value={surnameFilter}
                onChange={e => setSurnameFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">{t.allSurnames || (lang === 'zh' ? '全部姓氏 / 世系' : 'All Surnames / Lineages')} ({allSurnameGroups.length})</option>
                {allSurnameGroups.map(grp => (
                  <option key={grp.groupKey} value={grp.groupKey}>
                    {grp.displayName} ({grp.members.length})
                  </option>
                ))}
              </select>
            </div>


            <div>
              <select
                value={ethnicityFilter}
                onChange={e => setEthnicityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">{lang === 'zh' ? '全部族裔' : 'All Ethnicities'} ({allEthnicities.length})</option>
                {allEthnicities.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">{lang === 'zh' ? '全部性别' : 'All Genders'}</option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Persons */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/60 p-8">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-300">
                {lang === 'zh' ? '未找到符合条件的族人' : 'No Family Members Found'}
              </h3>
            </div>
          ) : isGroupedBySurname && groupedFiltered ? (
            <div className="space-y-8">
              {groupedFiltered.map(grp => (
                <div key={grp.groupKey} className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                      <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                        <span>{grp.displayName}</span>
                        {grp.isPatronymic && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            {t.patronymicLineage || (lang === 'zh' ? '父称世系 (bin/binti)' : 'Patronymic Lineage (bin/binti)')}
                          </span>
                        )}
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">
                        ({grp.members.length} {grp.members.length === 1 ? (lang === 'zh' ? '人' : 'person') : (lang === 'zh' ? '人' : 'members')})
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grp.members.map(person => renderPersonCard(person))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(person => renderPersonCard(person))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
