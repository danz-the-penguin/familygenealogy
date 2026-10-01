import React from 'react';
import { 
  BarChart3, Users, Heart, Award, MapPin, Calendar, 
  ShieldCheck, TrendingUp, Sparkles, Church 
} from 'lucide-react';
import { computeGenealogyStats, formatFullName } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function StatsDashboard({ persons = [], lang = 'en', theme = 'win98' }) {
  const t = translations[lang] || translations.en;
  const stats = computeGenealogyStats(persons);

  if (theme === 'win98') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#c0c0c0] text-black overflow-hidden select-none">
        {/* Win98 Window Titlebar */}
        <div className="win98-title-navy px-3 py-1 flex items-center justify-between text-xs font-bold text-white shrink-0">
          <div className="flex items-center space-x-1.5">
            <span>📊</span>
            <span className="font-extrabold">
              {lang === 'zh' ? '家族人口统计与血脉分布看板 [Demographics 1998]' : 'Family Statistics & Demographics [System 1998]'}
            </span>
          </div>
          <span className="text-[11px] font-mono opacity-90 uppercase">
            {stats.total} {lang === 'zh' ? '条族人档案' : 'Records'}
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            
            {/* Top 4 Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              <div className="win98-box p-3 bg-[#c0c0c0]">
                <div className="win98-sunken p-3.5 bg-white text-black">
                  <div className="flex items-center justify-between text-black">
                    <span className="text-xs font-black uppercase tracking-wider">{lang === 'zh' ? '族人总数' : 'Total Members'}</span>
                    <Users className="w-5 h-5 text-[#000080]" />
                  </div>
                  <div className="text-3xl font-black text-black mt-2">{stats.total}</div>
                  <p className="text-xs font-extrabold text-neutral-800 mt-1">{lang === 'zh' ? '家谱收录建档族人' : 'Recorded in database'}</p>
                </div>
              </div>

              <div className="win98-box p-3 bg-[#c0c0c0]">
                <div className="win98-sunken p-3.5 bg-white text-black">
                  <div className="flex items-center justify-between text-black">
                    <span className="text-xs font-black uppercase tracking-wider">{lang === 'zh' ? '在世状态' : 'Living Status'}</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div className="text-3xl font-black text-black mt-2">
                    {stats.living} <span className="text-sm font-extrabold text-neutral-800">/ {stats.deceased} {lang === 'zh' ? '已故' : 'passed'}</span>
                  </div>
                  <p className="text-xs font-extrabold text-neutral-800 mt-1">
                    {stats.total > 0 ? Math.round((stats.living / stats.total) * 100) : 0}% {lang === 'zh' ? '当代在世' : 'living today'}
                  </p>
                </div>
              </div>

              <div className="win98-box p-3 bg-[#c0c0c0]">
                <div className="win98-sunken p-3.5 bg-white text-black">
                  <div className="flex items-center justify-between text-black">
                    <span className="text-xs font-black uppercase tracking-wider">{lang === 'zh' ? '平均寿龄' : 'Average Lifespan'}</span>
                    <TrendingUp className="w-5 h-5 text-amber-800" />
                  </div>
                  <div className="text-3xl font-black text-black mt-2">
                    {stats.avgLifespan ? `${stats.avgLifespan} ${lang === 'zh' ? '岁' : 'yrs'}` : 'N/A'}
                  </div>
                  <p className="text-xs font-extrabold text-neutral-800 mt-1">{lang === 'zh' ? '已故先祖寿命统计' : 'Across deceased ancestors'}</p>
                </div>
              </div>

              <div className="win98-box p-3 bg-[#c0c0c0]">
                <div className="win98-sunken p-3.5 bg-white text-black">
                  <div className="flex items-center justify-between text-black">
                    <span className="text-xs font-black uppercase tracking-wider">{lang === 'zh' ? '最高记录寿龄' : 'Oldest Recorded'}</span>
                    <Award className="w-5 h-5 text-purple-900" />
                  </div>
                  <div className="text-base font-black text-black mt-2 truncate">
                    {stats.oldestPerson ? formatFullName(stats.oldestPerson, lang) : 'N/A'}
                  </div>
                  <p className="text-xs font-extrabold text-purple-900 mt-1">
                    {stats.oldestPerson ? (lang === 'zh' ? `享年 ${stats.oldestPerson.age} 岁` : `Lived to age ${stats.oldestPerson.age}`) : (lang === 'zh' ? '暂无完整日期记录' : 'No date records')}
                  </p>
                </div>
              </div>

            </div>

            {/* Surnames, Geographic Origins & Religious Demographics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Top Surnames */}
              <div className="win98-box p-4 bg-[#c0c0c0] space-y-3">
                <div className="win98-title-navy px-2 py-0.5 text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span>✨</span>
                    <span>{lang === 'zh' ? '宗族姓氏与父称支派' : 'Most Common Surnames'}</span>
                  </div>
                  <span>{lang === 'zh' ? '频次' : 'Frequency'}</span>
                </div>

                <div className="win98-sunken bg-white p-3 space-y-2.5 max-h-96 overflow-y-auto">
                  {stats.topSurnames.map((item, i) => {
                    const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-extrabold text-black">
                          <div className="flex items-center space-x-1.5">
                            <span>{item.name}</span>
                            {item.isPatronymic && (
                              <span className="text-[10px] px-1 py-0.2 bg-amber-100 text-amber-950 border border-amber-500 rounded">
                                bin/binti
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-black">{item.count} {lang === 'zh' ? '人' : 'members'} ({percentage}%)</span>
                        </div>
                        <div className="w-full win98-sunken bg-[#dfdfdf] h-3 p-0.5">
                          <div 
                            className="bg-[#000080] h-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Religious Demographics */}
              <div className="win98-box p-4 bg-[#c0c0c0] space-y-3">
                <div className="win98-title-gold px-2 py-0.5 text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span>⛪</span>
                    <span>{t.religiousDemographics || (lang === 'zh' ? '宗教信仰与皈依分布' : 'Religious Demographics')}</span>
                  </div>
                  <span>
                    {stats.totalWithReligion} / {stats.total}
                  </span>
                </div>

                <div className="win98-sunken bg-white p-3 space-y-2.5 max-h-96 overflow-y-auto">
                  {stats.topReligions.length === 0 ? (
                    <div className="text-xs font-bold text-neutral-700 italic py-4 text-center">
                      {lang === 'zh' ? '暂无宗教信仰记录' : 'No religious affiliation records recorded yet.'}
                    </div>
                  ) : (
                    stats.topReligions.map((item, i) => {
                      const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-extrabold text-black">
                            <span>{item.religion}</span>
                            <span className="font-mono text-black">{item.count} {lang === 'zh' ? '人' : 'members'} ({percentage}%)</span>
                          </div>
                          <div className="w-full win98-sunken bg-[#dfdfdf] h-3 p-0.5">
                            <div 
                              className="bg-[#804000] h-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Geographic Origins */}
              <div className="win98-box p-4 bg-[#c0c0c0] space-y-3">
                <div className="win98-title-rose px-2 py-0.5 text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span>📍</span>
                    <span>{lang === 'zh' ? '原籍与出生发源地' : 'Geographic Origins'}</span>
                  </div>
                  <span>{lang === 'zh' ? '出生地' : 'Birthplaces'}</span>
                </div>

                <div className="win98-sunken bg-white p-3 space-y-2.5 max-h-96 overflow-y-auto">
                  {stats.topPlaces.length === 0 ? (
                    <div className="text-xs font-bold text-neutral-700 italic py-4 text-center">
                      {lang === 'zh' ? '暂无出生地记录' : 'No birthplace records.'}
                    </div>
                  ) : (
                    stats.topPlaces.map((item, i) => {
                      const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-extrabold text-black">
                            <span>{item.place}</span>
                            <span className="font-mono text-black">{item.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full win98-sunken bg-[#dfdfdf] h-3 p-0.5">
                            <div 
                              className="bg-[#800040] h-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-400" />
            Family Statistics & Demographics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Key metrics, longevity, surnames, and geographic origins across your genealogy records.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Top 4 Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Members</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">Recorded in database</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Living Status</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {stats.living} <span className="text-sm font-normal text-slate-400">/ {stats.deceased} passed</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.total > 0 ? Math.round((stats.living / stats.total) * 100) : 0}% living today
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Lifespan</span>
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {stats.avgLifespan ? `${stats.avgLifespan} yrs` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across deceased ancestors</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Oldest Recorded</span>
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-white mt-2 truncate">
                {stats.oldestPerson ? formatFullName(stats.oldestPerson, lang) : 'N/A'}
              </div>
              <p className="text-xs text-purple-300 mt-1">
                {stats.oldestPerson ? `Lived to age ${stats.oldestPerson.age}` : 'No date records'}
              </p>
            </div>

          </div>

          {/* Surnames, Geographic Origins & Religious Demographics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Top Surnames */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                  Most Common Surnames
                </h3>
                <span className="text-xs text-slate-500">Frequency</span>
              </div>

              <div className="space-y-3">
                {stats.topSurnames.map((item, i) => {
                  const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-200">{item.name}</span>
                          {item.isPatronymic && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              bin/binti
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400">{item.count} members ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Religious Demographics (Current / Final Practiced Faith) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                    <Church className="w-4 h-4 mr-2 text-amber-400" />
                    {t.religiousDemographics || 'Religious Demographics'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.finalReligionDesc || 'Counts current faith or final religion before death (including deathbed conversions)'}
                  </p>
                </div>
                <span className="text-xs text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {stats.totalWithReligion} / {stats.total} ({stats.total > 0 ? Math.round((stats.totalWithReligion / stats.total) * 100) : 0}%)
                </span>
              </div>

              <div className="space-y-3">
                {stats.topReligions.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-4 text-center">
                    {lang === 'zh' ? '暂无宗教信仰记录' : 'No religious affiliation records recorded yet.'}
                  </div>
                ) : (
                  stats.topReligions.map((item, i) => {
                    const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-amber-200">{item.religion}</span>
                          <span className="text-slate-400">{item.count} members ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Geographic Origins */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                  Geographic Origins
                </h3>
                <span className="text-xs text-slate-500">Birthplaces</span>
              </div>

              <div className="space-y-3">
                {stats.topPlaces.map((item, i) => {
                  const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">{item.place}</span>
                        <span className="text-slate-400">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-pink-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
