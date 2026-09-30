import React from 'react';
import { 
  X, User, Calendar, MapPin, Briefcase, Heart, Users, 
  GitFork, Compass, Edit, Trash2, ArrowUpRight, ShieldCheck, Tag,
  Globe, Church, Award, Sparkles, HeartCrack, Plus,
  Images, ExternalLink, FileText, Eye, Camera, Link as LinkIcon
} from 'lucide-react';
import { formatFullName, getLifespan, getFinalReligion } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function PersonDetailDrawer({ 
  person, 
  onClose, 
  onEdit, 
  onDelete, 
  onSelectPerson, 
  onExploreAncestors,
  onExploreCousins,
  onOpenKinship,
  onAddSpouse,
  onAddChild,
  personsMap,
  relationships = [],
  photos = [],
  isAdminMode = true,
  onOpenGalleryWithPerson,
  onAddPhotoForPerson,
  lang = 'en'
}) {
  if (!person) return null;
  const t = translations[lang] || translations.en;

  const parents = (person.parents || []).map(id => personsMap.get(id)).filter(Boolean);
  const spouses = (person.spouses || []).map(id => personsMap.get(id)).filter(Boolean);
  const children = (person.children || []).map(id => personsMap.get(id)).filter(Boolean);

  // Find siblings
  const siblingIds = new Set();
  parents.forEach(p => {
    (p.children || []).forEach(cId => {
      if (cId !== person.id) siblingIds.add(cId);
    });
  });
  const siblings = Array.from(siblingIds).map(id => personsMap.get(id)).filter(Boolean);

  // Photos where this person is tagged
  const taggedPhotos = (photos || []).filter(p => Array.isArray(p.taggedPersonIds) && p.taggedPersonIds.includes(person.id));

  const isFemale = person.gender === 'female';
  const badgeColor = isFemale 
    ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' 
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

  // Helper to determine partner relationship status label
  const getPartnerDetails = (spouse) => {
    const spouseId = spouse.id;
    const isFemale = spouse.gender === 'female';
    const detail = person.partnerDetails?.[spouseId] || {};
    const status = detail.status || relationships?.find(r => 
      (r.person1 === person.id && r.person2 === spouseId) || 
      (r.person1 === spouseId && r.person2 === person.id)
    )?.status || 'spouse';

    const isSpouseDeceased = detail.marriageState === 'death' || !spouse.isLiving;
    const statusTag = isSpouseDeceased 
      ? (lang === 'zh' ? '(已故)' : '(Deceased)') 
      : (lang === 'zh' ? '(现任/健在)' : '(Current)');

    let roleLabel = '';
    if (status === 'first_spouse' || status === 'first_wife') {
      roleLabel = isFemale 
        ? (lang === 'zh' ? '原配发妻' : 'First Wife') 
        : (lang === 'zh' ? '第一任丈夫' : 'First Husband');
    } else if (status === 'second_spouse' || status === 'second_wife') {
      roleLabel = isFemale 
        ? (lang === 'zh' ? '继室 / 续弦' : 'Second Wife') 
        : (lang === 'zh' ? '第二任丈夫' : 'Second Husband');
    } else if (status === 'third_spouse') {
      roleLabel = isFemale 
        ? (lang === 'zh' ? '第三任妻子' : 'Third Wife') 
        : (lang === 'zh' ? '第三任丈夫' : 'Third Husband');
    } else if (status === 'remarriage' || status === 'remarriage_after_death') {
      roleLabel = isFemale 
        ? (lang === 'zh' ? '丧偶续弦妻子' : 'Remarried Wife (After Spouse Passed)') 
        : (lang === 'zh' ? '丧偶再婚丈夫' : 'Remarried Husband (After Spouse Passed)');
    } else if (status === 'polygamous') {
      roleLabel = lang === 'zh' ? '多配偶 / 侧室 / 平妻' : 'Plural Spouse (Polygamous)';
    } else if (status === 'ex_spouse' || status === 'divorce') {
      roleLabel = isFemale ? (lang === 'zh' ? '前妻 (离异)' : 'Ex-Wife') : (lang === 'zh' ? '前夫 (离异)' : 'Ex-Husband');
    } else if (status === 'partner') {
      roleLabel = lang === 'zh' ? '同居伴侣' : 'Domestic Partner';
    } else if (status === 'ex_partner') {
      roleLabel = lang === 'zh' ? '前伴侣' : 'Ex-Partner';
    } else {
      roleLabel = isFemale 
        ? (lang === 'zh' ? '妻子' : 'Wife') 
        : (lang === 'zh' ? '丈夫' : 'Husband');
    }

    const fullBadge = (status === 'ex_spouse' || status === 'ex_partner')
      ? roleLabel
      : `${roleLabel} ${statusTag}`;

    return {
      roleLabel,
      statusTag,
      fullBadge,
      isSpouseDeceased,
      marriageDate: detail.marriageDate || detail.marriageYear || '',
      marriagePlace: detail.marriagePlace || detail.place || '',
      notes: detail.notes || ''
    };
  };

  const getPartnerLabel = (spouse) => {
    return getPartnerDetails(spouse).fullBadge;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-950/40">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {person.avatar ? (
              <img 
                src={person.avatar} 
                alt={formatFullName(person, lang)} 
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {person.gender === 'female' ? '♀' : '♂'}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {formatFullName(person, lang)}
            </h2>
            {person.christianName && (
              <p className="text-xs text-indigo-300 mt-0.5 flex items-center">
                <Church className="w-3 h-3 mr-1 text-indigo-400" />
                {lang === 'zh' ? '圣名/教名: ' : 'Christian Name: '}{person.christianName}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {getLifespan(person, lang)}
            </p>
            {person.occupation && (
              <p className="text-xs text-indigo-400 flex items-center mt-1">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                {person.occupation}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onEdit(person)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            title={`${t.editMember} (E)`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{t.editMember}</span>
            <kbd className="hidden sm:inline px-1 py-0.2 text-[9px] font-mono bg-indigo-700/80 rounded border border-indigo-400/40 text-indigo-100">E</kbd>
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Badges: Ethnicity */}
        <div className="flex flex-wrap gap-2">
          {person.ethnicity && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center">
              <Globe className="w-3.5 h-3.5 mr-1" />
              {person.ethnicity}
            </span>
          )}
        </div>

        {/* Quick action buttons for genealogy exploration */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onExploreAncestors(person.id)}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition"
          >
            <GitFork className="w-4 h-4 rotate-180" />
            <span>{t.searchAncestors}</span>
          </button>
          <button
            onClick={() => onExploreCousins(person.id)}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition"
          >
            <Users className="w-4 h-4" />
            <span>{t.searchCousins}</span>
          </button>
          <button
            onClick={() => onOpenKinship(person.id)}
            className="col-span-2 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition"
          >
            <Compass className="w-4 h-4" />
            <span>{t.calculateKinship}</span>
          </button>
        </div>

        {/* Life details & Burial site */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.vitalEvents}</h3>
          
          <div className="flex items-start space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400">{t.birthDate}: </span>
              <span className="text-slate-200">{person.birthDate || (lang === 'zh' ? '日期不详' : 'Unknown date')}</span>
              {person.birthPlace && <div className="text-xs text-slate-400 flex items-center mt-0.5"><MapPin className="w-3 h-3 mr-1" />{person.birthPlace}</div>}
            </div>
          </div>

          {!person.isLiving && (
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <div className="flex items-start space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400">{t.deathDate}: </span>
                  <span className="text-slate-200">{person.deathDate || (lang === 'zh' ? '日期不详' : 'Unknown date')}</span>
                  {person.deathPlace && <div className="text-xs text-slate-400 flex items-center mt-0.5"><MapPin className="w-3 h-3 mr-1" />{person.deathPlace}</div>}
                </div>
              </div>

              {(person.burialPlace || person.burialSite) && (
                <div className="flex items-start space-x-3 text-sm pt-1">
                  <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400">{t.burialSite}: </span>
                    <span className="text-amber-200 font-medium">{person.burialPlace || person.burialSite}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {person.isLiving && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.livingMember}</span>
            </div>
          )}
        </div>

        {/* Religions & Faith History */}
        {person.religions && person.religions.length > 0 && (
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center">
              <Church className="w-3.5 h-3.5 mr-1.5" />
              {t.religions}
            </h3>

            <div className="space-y-2">
              {(() => {
                const finalRel = getFinalReligion(person);
                return person.religions.map((r, i) => {
                  const isThisFinal = r.isFinal || (finalRel && finalRel.name === r.name && (finalRel.startDate === r.startDate || person.religions.length === 1));
                  return (
                    <div key={r.id || i} className="text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-amber-200">{r.name}</span>
                          {isThisFinal && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              {t.finalReligionBadge || 'Final / Current Faith'}
                            </span>
                          )}
                        </div>
                        {r.isDeathbedConversion && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {t.deathbedConversion}
                          </span>
                        )}
                      </div>
                      {(r.startDate || r.endDate) && (
                        <div className="text-slate-400 text-[11px]">
                          {r.startDate || 'Birth'} – {r.endDate || (person.isLiving ? 'Present' : 'Death')}
                        </div>
                      )}
                      {r.notes && <div className="text-slate-400 italic text-[11px]">"{r.notes}"</div>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Biography */}
        {person.bio && (
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.biography}</h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">"{person.bio}"</p>
          </div>
        )}

        {/* Tags */}
        {person.tags && person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center">
                <Tag className="w-3 h-3 mr-1 text-indigo-400" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tagged Photos & Media Section */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center">
              <Images className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.taggedPersons} ({taggedPhotos.length})</span>
            </h3>
            {onOpenGalleryWithPerson && (
              <button
                onClick={() => onOpenGalleryWithPerson(person.id)}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition font-medium"
              >
                <span>{lang === 'zh' ? '查看全部画廊' : 'View in Gallery'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {taggedPhotos.length === 0 ? (
            <div className="text-center py-3.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <Camera className="w-6 h-6 text-slate-600 mx-auto mb-1" />
              <p className="text-xs text-slate-400">{lang === 'zh' ? '暂无此族人的标记照片' : 'No photos tagged for this member yet'}</p>
              {isAdminMode && onOpenGalleryWithPerson && (
                <button
                  onClick={() => onOpenGalleryWithPerson(person.id)}
                  className="mt-2.5 inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'zh' ? '去画廊标记/上传照片' : 'Upload or Tag in Gallery'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {taggedPhotos.slice(0, 6).map(photo => (
                <div
                  key={photo.id}
                  onClick={() => onOpenGalleryWithPerson && onOpenGalleryWithPerson(person.id)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900 cursor-pointer hover:border-purple-500/60 transition shadow-sm"
                  title={photo.title || 'Photo'}
                >
                  <img
                    src={photo.url}
                    alt={photo.title || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-1">
                    <span className="text-[10px] text-white truncate font-medium">
                      {photo.title || photo.date || 'Photo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historical References & Links */}
        {person.references && person.references.length > 0 && (
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.references} ({person.references.length})</span>
            </h3>

            <div className="space-y-2">
              {person.references.map((ref, idx) => {
                const typeLabels = {
                  doc: t.refDoc,
                  census: t.refCensus,
                  cemetery: t.refCemetery,
                  article: t.refArticle,
                  audio: t.refAudio,
                  other: t.refOther
                };
                const typeLabel = typeLabels[ref.type] || ref.type || t.refDoc;

                return (
                  <div key={ref.id || idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-200 truncate">{ref.title || 'Reference Citation'}</div>
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                          {typeLabel}
                        </span>
                      </div>
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition"
                          title={t.openLink}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {ref.notes && (
                      <p className="text-[11px] text-slate-400 italic">"{ref.notes}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Immediate Family Sections */}
        <div className="space-y-4">
          
          {/* Parents */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t.parents} ({parents.length})
            </h4>
            {parents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No parents recorded</p>
            ) : (
              <div className="space-y-1.5">
                {parents.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPerson(p)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                        {formatFullName(p, lang)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.gender === 'female' ? (lang === 'zh' ? '母亲' : 'Mother') : (lang === 'zh' ? '父亲' : 'Father')} • {getLifespan(p, lang)}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spouses & Partners with Remarriage & Plural Marriage badges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                <Heart className="w-3.5 h-3.5 text-rose-400 mr-1.5" />
                <span>{t.spousesAndPartners} ({spouses.length})</span>
              </h4>
              {isAdminMode && onAddSpouse && (
                <button
                  onClick={() => onAddSpouse(person.id)}
                  className="px-2 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 text-[11px] font-medium flex items-center space-x-1 transition"
                  title={lang === 'zh' ? '添加/关联配偶' : 'Add/Link Spouse'}
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'zh' ? '添加配偶' : 'Add Spouse'}</span>
                </button>
              )}
            </div>
            {spouses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No spouse or partner recorded</p>
            ) : (
              <div className="space-y-1.5">
                {spouses.map(s => {
                  const partnerInfo = getPartnerDetails(s);
                  const isEx = partnerInfo.roleLabel.includes('Ex-') || partnerInfo.roleLabel.includes('前');
                  const isRemarriage = partnerInfo.roleLabel.includes('Remarriage') || partnerInfo.roleLabel.includes('Remarried') || partnerInfo.roleLabel.includes('继室') || partnerInfo.roleLabel.includes('续弦') || partnerInfo.roleLabel.includes('Second');
                  const isPlural = partnerInfo.roleLabel.includes('Plural') || partnerInfo.roleLabel.includes('多配偶') || partnerInfo.roleLabel.includes('侧室');

                  let badgeStyle = 'bg-pink-500/20 text-pink-300 border-pink-500/30';
                  if (isEx) badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                  else if (isRemarriage) badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  else if (isPlural) badgeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectPerson(s)}
                      className={`w-full text-left p-2.5 rounded-lg border transition group flex items-center justify-between ${
                        isEx 
                          ? 'bg-slate-900/60 border-dashed border-rose-500/30 hover:border-rose-400' 
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-200 group-hover:text-pink-300">
                            {formatFullName(s, lang)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {partnerInfo.fullBadge}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{getLifespan(s, lang)}</div>
                        {(partnerInfo.marriageDate || partnerInfo.marriagePlace) && (
                          <div className="text-[11px] text-pink-300 font-medium mt-0.5 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-pink-400 shrink-0" />
                            <span>
                              {t.marriedOn || 'Married'}: {partnerInfo.marriageDate}
                              {partnerInfo.marriagePlace ? ` (${partnerInfo.marriagePlace})` : ''}
                            </span>
                          </div>
                        )}
                        {partnerInfo.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">
                            "{partnerInfo.notes}"
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Siblings */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t.siblings} ({siblings.length})
            </h4>
            {siblings.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No siblings recorded</p>
            ) : (
              <div className="space-y-1.5">
                {siblings.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSelectPerson(s)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300">
                        {formatFullName(s, lang)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.gender === 'female' ? (lang === 'zh' ? '姐妹' : 'Sister') : (lang === 'zh' ? '兄弟' : 'Brother')} • {getLifespan(s, lang)}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Children */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.children} ({children.length})
              </h4>
              {isAdminMode && onAddChild && (
                <button
                  onClick={() => onAddChild(person.id)}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium flex items-center space-x-1 transition"
                  title={lang === 'zh' ? '添加子女' : 'Add Child'}
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'zh' ? '添加子女' : 'Add Child'}</span>
                </button>
              )}
            </div>
            {children.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No children recorded</p>
            ) : (
              <div className="space-y-1.5">
                {children.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onSelectPerson(c)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-300">
                          {formatFullName(c, lang)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {c.gender === 'female' ? (lang === 'zh' ? '女儿' : 'Daughter') : (lang === 'zh' ? '儿子' : 'Son')} • {getLifespan(c, lang)}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer controls: Edit & Delete (Admin Mode) vs Member Read-only Info (Viewer Mode) */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
        {isAdminMode ? (
          <>
            <button
              onClick={() => onEdit(person)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/20"
              title={`${t.editMember} (E)`}
            >
              <Edit className="w-4 h-4" />
              <span>{t.editMember}</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-indigo-700/80 rounded border border-indigo-400/40 text-indigo-100">E</kbd>
            </button>
            <button
              onClick={() => onDelete(person)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition"
              title="Delete (Del / Backspace)"
            >
              <Trash2 className="w-4 h-4" />
              <span>{lang === 'zh' ? '删除' : 'Delete'}</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-rose-950/60 border border-rose-500/30 rounded text-rose-300">Del</kbd>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center space-x-2 py-1 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-300">{t.viewerBadge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
