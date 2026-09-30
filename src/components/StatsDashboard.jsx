import React from 'react';
import { 
  BarChart3, Users, Heart, Award, MapPin, Calendar, 
  ShieldCheck, TrendingUp, Sparkles, Church 
} from 'lucide-react';
import { computeGenealogyStats, formatFullName } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function StatsDashboard({ persons = [], lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const stats = computeGenealogyStats(persons);

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
                {stats.oldestPerson ? formatFullName(stats.oldestPerson) : 'N/A'}
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
