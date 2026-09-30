import React, { useState, useMemo } from 'react';
import { Calendar, User, Heart, Sparkles, MapPin, Filter } from 'lucide-react';
import { formatFullName, extractYear } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function TimelineView({ 
  persons = [], 
  relationships = [], 
  onSelectPerson,
  lang = 'en' 
}) {
  const t = translations[lang] || translations.en;
  const [filterType, setFilterType] = useState('all');

  const allEvents = useMemo(() => {
    const list = [];
    const processedMarriages = new Set();

    // 1. Birth events
    persons.forEach(p => {
      if (p.birthDate) {
        const year = extractYear(p.birthDate);
        if (year !== null) {
          list.push({
            id: `birth-${p.id}`,
            type: 'birth',
            year,
            date: p.birthDate,
            person: p,
            place: p.birthPlace,
            title: lang === 'zh' 
              ? `${formatFullName(p, lang)} 诞生 / 出生` 
              : `Birth of ${formatFullName(p, lang)}`
          });
        }
      }
    });

    // Helper to add marriage
    const addMarriageEvent = (p1, p2, rawDate, place, notes) => {
      if (!p1 || !p2 || !rawDate) return;
      const pairKey = [p1.id, p2.id].sort().join('___');
      if (processedMarriages.has(pairKey)) return;
      processedMarriages.add(pairKey);

      const year = extractYear(rawDate);
      if (year === null) return;

      const title = lang === 'zh'
        ? `${formatFullName(p1, lang)} 与 ${formatFullName(p2, lang)} 喜结连理 / 结婚`
        : `Marriage of ${formatFullName(p1, lang)} & ${formatFullName(p2, lang)}`;

      list.push({
        id: `marriage-${pairKey}`,
        type: 'marriage',
        year,
        date: rawDate,
        person: p1,
        partner: p2,
        place: place || '',
        notes: notes || '',
        title
      });
    };

    // 2. Marriage events from relationships array
    relationships.forEach(rel => {
      const date = rel.startDate || rel.marriageDate || rel.date;
      if (date && (rel.type === 'marriage' || !rel.type || rel.type === 'partner')) {
        const p1 = persons.find(p => p.id === rel.person1);
        const p2 = persons.find(p => p.id === rel.person2);
        if (p1 && p2) {
          addMarriageEvent(p1, p2, date, rel.place, rel.notes);
        }
      }
    });

    // 3. Marriage events from persons.partnerDetails
    persons.forEach(p1 => {
      (p1.spouses || []).forEach(spouseId => {
        const p2 = persons.find(p => p.id === spouseId);
        if (!p2) return;
        const details1 = p1.partnerDetails?.[spouseId] || {};
        const details2 = p2.partnerDetails?.[p1.id] || {};
        const date = details1.marriageDate || details1.marriageYear || details2.marriageDate || details2.marriageYear;
        const place = details1.marriagePlace || details2.marriagePlace;
        const notes = details1.notes || details2.notes;
        if (date) {
          addMarriageEvent(p1, p2, date, place, notes);
        }
      });
    });

    // 4. Death events
    persons.forEach(p => {
      if (p.deathDate) {
        const year = extractYear(p.deathDate);
        if (year !== null) {
          list.push({
            id: `death-${p.id}`,
            type: 'death',
            year,
            date: p.deathDate,
            person: p,
            place: p.deathPlace,
            title: lang === 'zh' 
              ? `${formatFullName(p, lang)} 仙逝 / 离世` 
              : `Passing of ${formatFullName(p, lang)}`
          });
        }
      }
    });

    list.sort((a, b) => a.year - b.year || (a.date || '').localeCompare(b.date || ''));
    return list;
  }, [persons, relationships, lang]);

  // Counts by type
  const counts = useMemo(() => {
    let births = 0, marriages = 0, deaths = 0;
    allEvents.forEach(e => {
      if (e.type === 'birth') births++;
      else if (e.type === 'marriage') marriages++;
      else if (e.type === 'death') deaths++;
    });
    return { all: allEvents.length, births, marriages, deaths };
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return allEvents;
    return allEvents.filter(e => e.type === filterType);
  }, [allEvents, filterType]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header & Filter Toolbar */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-indigo-400" />
                {lang === 'zh' ? '家族历史大事编年史' : 'Family Historical Timeline'} ({filteredEvents.length} {lang === 'zh' ? '件大事' : 'Events'})
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'zh' ? '按时间顺序记录家族出生、喜结连理婚配与世代交替里程碑' : 'Chronological milestones of births, marriages, and generational passing across decades.'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {lang === 'zh' ? '全部大事' : 'All'} ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('marriage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                  filterType === 'marriage'
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/20'
                    : 'bg-slate-800 text-pink-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '婚配连理' : 'Marriages'} ({counts.marriages})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('birth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                  filterType === 'birth'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800 text-emerald-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '出生诞生' : 'Births'} ({counts.births})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('death')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                  filterType === 'death'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                    : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                <span>†</span>
                <span>{lang === 'zh' ? '归息离世' : 'Passings'} ({counts.deaths})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto relative pl-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/60 p-8">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-300">
                {lang === 'zh' ? '未找到符合条件的时间线事件' : 'No Events Found for this Category'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'zh' ? '可以在族人编辑中为配偶添加结婚年份或日期。' : 'You can add marriage years or dates in the member editor.'}
              </p>
            </div>
          ) : (
            filteredEvents.map(event => {
              const isBirth = event.type === 'birth';
              const isMarriage = event.type === 'marriage';
              const isDeath = event.type === 'death';

              const dotBg = isBirth 
                ? 'bg-emerald-500 shadow-emerald-500/30' 
                : isMarriage 
                ? 'bg-pink-500 shadow-pink-500/30' 
                : 'bg-rose-500 shadow-rose-500/30';

              return (
                <div key={event.id} className="relative mb-6 pl-8 group">
                  {/* Timeline node circle */}
                  <div className={`absolute left-0 top-2.5 w-6 h-6 rounded-full ${dotBg} -translate-x-[21px] flex items-center justify-center text-slate-950 shadow-lg`}>
                    {isBirth && <Sparkles className="w-3 h-3 text-white" />}
                    {isMarriage && <Heart className="w-3 h-3 text-white fill-white" />}
                    {isDeath && <span className="text-[10px] font-bold text-white leading-none">†</span>}
                  </div>

                  <div 
                    onClick={() => onSelectPerson(event.person)}
                    className={`bg-slate-900 border rounded-2xl p-4 transition cursor-pointer shadow-lg hover:shadow-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isMarriage 
                        ? 'border-pink-500/30 hover:border-pink-400 bg-gradient-to-r from-slate-900 via-pink-950/10 to-slate-900' 
                        : 'border-slate-800 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Avatar(s) */}
                      {isMarriage && event.partner ? (
                        <div className="flex items-center -space-x-3 shrink-0">
                          {event.person.avatar ? (
                            <img 
                              src={event.person.avatar} 
                              alt={formatFullName(event.person, lang)} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 relative z-10" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 relative z-10">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          {event.partner.avatar ? (
                            <img 
                              src={event.partner.avatar} 
                              alt={formatFullName(event.partner, lang)} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-pink-500/60 shadow relative z-20" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-950/50 border-2 border-pink-500/60 flex items-center justify-center text-pink-300 relative z-20">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      ) : (
                        event.person.avatar ? (
                          <img 
                            src={event.person.avatar} 
                            alt={formatFullName(event.person, lang)} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )
                      )}

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className={`text-sm font-bold text-white transition ${isMarriage ? 'group-hover:text-pink-300' : 'group-hover:text-indigo-300'}`}>
                            {event.title}
                          </span>
                          {isMarriage && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                              {t.marriageEvent || 'Marriage'}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="font-medium text-slate-300">{event.date}</span>
                          {event.place && (
                            <span className="flex items-center text-slate-400">
                              <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                              <span>{event.place}</span>
                            </span>
                          )}
                          {event.notes && (
                            <span className="text-pink-300/80 italic">
                              "{event.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                      <span className={`text-sm font-mono font-bold px-3 py-1 rounded-xl border ${
                        isMarriage 
                          ? 'text-pink-300 bg-pink-950/30 border-pink-500/30' 
                          : 'text-slate-300 bg-slate-950 border-slate-800'
                      }`}>
                        {event.year}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
