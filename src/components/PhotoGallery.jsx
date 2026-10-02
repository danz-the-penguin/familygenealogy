import React, { useState, useMemo } from 'react';
import { 
  Images, Plus, Search, Filter, Calendar, MapPin, Tag, User, 
  X, Check, Trash2, Edit, Upload, Link, Eye, CheckCircle2, 
  Sparkles, ArrowRight, Camera, ShieldAlert
} from 'lucide-react';
import { formatFullName, getLifespan } from '../utils/genealogy';
import { translations } from '../utils/i18n';

export default function PhotoGallery({
  photos = [],
  persons = [],
  personsMap,
  onSavePhoto,
  onDeletePhoto,
  onSetAvatarFromPhoto,
  onSelectPerson,
  isAdminMode = true,
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersonId, setFilterPersonId] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  // Lightbox Modal state
  const [activePhoto, setActivePhoto] = useState(null);

  // Upload / Edit Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

  // Form state for upload/edit
  const [formSourceType, setFormSourceType] = useState('upload'); // 'upload' | 'url'
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formTaggedIds, setFormTaggedIds] = useState([]);
  const [searchPersonQuery, setSearchPersonQuery] = useState('');

  // Extract all unique tags across photos
  const allTags = useMemo(() => {
    const set = new Set();
    photos.forEach(p => {
      (p.tags || []).forEach(tag => {
        if (tag && tag.trim()) set.add(tag.trim());
      });
    });
    return Array.from(set);
  }, [photos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      // 1. Filter by tagged person
      if (filterPersonId !== 'all') {
        if (!Array.isArray(photo.taggedPersonIds) || !photo.taggedPersonIds.includes(filterPersonId)) {
          return false;
        }
      }

      // 2. Filter by tag
      if (filterTag !== 'all') {
        if (!Array.isArray(photo.tags) || !photo.tags.includes(filterTag)) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (photo.title || '').toLowerCase().includes(q);
        const captionMatch = (photo.caption || '').toLowerCase().includes(q);
        const placeMatch = (photo.place || '').toLowerCase().includes(q);
        const dateMatch = (photo.date || '').toLowerCase().includes(q);

        // Match tagged member names
        const memberMatch = (photo.taggedPersonIds || []).some(id => {
          const p = personsMap.get(id);
          if (!p) return false;
          const full = `${p.firstName} ${p.lastName} ${p.chineseName || ''}`.toLowerCase();
          return full.includes(q);
        });

        if (!titleMatch && !captionMatch && !placeMatch && !dateMatch && !memberMatch) {
          return false;
        }
      }

      return true;
    });
  }, [photos, filterPersonId, filterTag, searchQuery, personsMap]);

  // Open upload modal
  const handleOpenUpload = (photoToEdit = null) => {
    if (photoToEdit) {
      setEditingPhoto(photoToEdit);
      setFormUrl(photoToEdit.url || '');
      setFormTitle(photoToEdit.title || '');
      setFormDate(photoToEdit.date || '');
      setFormPlace(photoToEdit.place || '');
      setFormCaption(photoToEdit.caption || '');
      setFormTagsStr((photoToEdit.tags || []).join(', '));
      setFormTaggedIds(Array.isArray(photoToEdit.taggedPersonIds) ? [...photoToEdit.taggedPersonIds] : []);
      setFormSourceType('url');
    } else {
      setEditingPhoto(null);
      setFormUrl('');
      setFormTitle('');
      setFormDate('');
      setFormPlace('');
      setFormCaption('');
      setFormTagsStr('');
      setFormTaggedIds([]);
      setFormSourceType('upload');
    }
    setSearchPersonQuery('');
    setIsUploadModalOpen(true);
  };

  // Handle local file selection -> read as base64 data URL
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert(lang === 'zh' ? '照片大小不能超过 15MB' : 'Image file must be under 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo Form
  const handleSavePhotoSubmit = (e) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      alert(lang === 'zh' ? '请上传照片或输入图片链接' : 'Please upload an image or provide a URL');
      return;
    }

    const tags = formTagsStr
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean);

    const photoObj = {
      id: editingPhoto ? editingPhoto.id : `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      url: formUrl.trim(),
      title: formTitle.trim() || (lang === 'zh' ? '家族照片' : 'Family Photo'),
      date: formDate.trim(),
      place: formPlace.trim(),
      caption: formCaption.trim(),
      tags,
      taggedPersonIds: formTaggedIds,
      createdAt: editingPhoto?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSavePhoto(photoObj);
    setIsUploadModalOpen(false);

    // If lightbox was open on this photo, update it
    if (activePhoto && activePhoto.id === photoObj.id) {
      setActivePhoto(photoObj);
    }
  };

  // Toggle tagged member in upload/edit form
  const handleToggleTagPerson = (personId) => {
    setFormTaggedIds(prev => {
      if (prev.includes(personId)) {
        return prev.filter(id => id !== personId);
      } else {
        return [...prev, personId];
      }
    });
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${
      theme === 'win98' ? 'bg-[#c0c0c0] text-black select-none' : 'bg-slate-950 text-white'
    }`}>
      {theme === 'win98' && (
        <div className="win98-title-navy px-3 py-1 flex items-center justify-between text-xs font-bold text-white shrink-0">
          <div className="flex items-center space-x-1.5">
            <span>🖼️</span>
            <span className="font-extrabold">{t.photoGallery} [Album 1998]</span>
          </div>
          <span className="text-[11px] font-mono opacity-90">{photos.length} {lang === 'zh' ? '张影像' : 'photos'}</span>
        </div>
      )}
      
      {/* Top Header & Search/Filter Controls */}
      <div className={`p-4 md:p-6 ${
        theme === 'win98' 
          ? 'bg-[#c0c0c0] border-b border-gray-400 text-black' 
          : 'border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 ${
                theme === 'win98' 
                  ? 'win98-sunken bg-white text-black' 
                  : 'rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30'
              }`}>
                <Images className="w-5 h-5" />
              </div>
              <h1 className={`text-xl font-bold flex items-center ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                <span>{t.photoGallery}</span>
                <span className={`ml-2 text-xs font-mono px-2 py-0.5 rounded-full ${
                  theme === 'win98' 
                    ? 'border border-gray-400 bg-white text-black font-bold' 
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {photos.length} {lang === 'zh' ? '张影像' : 'photos'}
                </span>
                {!isAdminMode && (
                  <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    theme === 'win98' 
                      ? 'border border-gray-400 bg-emerald-100 text-emerald-950 font-bold' 
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {t.viewerBadge}
                  </span>
                )}
              </h1>
            </div>
            <p className={`text-xs mt-1 max-w-2xl ${theme === 'win98' ? 'text-neutral-800 font-bold' : 'text-slate-400'}`}>
              {t.photoGalleryDesc}
            </p>
          </div>

          {/* Action: Upload Photo Button (Admin Only) */}
          {isAdminMode ? (
            <button
              onClick={() => handleOpenUpload()}
              className={theme === 'win98'
                ? 'win98-btn flex items-center space-x-1.5 px-4 py-1.5 text-xs font-black text-black shrink-0'
                : 'flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition self-start md:self-auto shrink-0'
              }
            >
              <Upload className="w-4 h-4" />
              <span>{t.uploadPhoto}</span>
            </button>
          ) : (
            <div className={theme === 'win98'
              ? 'win98-sunken px-3 py-1 bg-white text-black font-bold text-xs flex items-center space-x-1.5'
              : 'px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-1.5'
            }>
              <Eye className="w-3.5 h-3.5 text-indigo-700" />
              <span>{lang === 'zh' ? '查阅浏览模式' : 'Read-Only Viewer'}</span>
            </div>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Tagged Member Dropdown */}
            <div className={theme === 'win98' ? 'win98-box px-2.5 py-1 bg-[#c0c0c0] flex items-center space-x-2' : 'flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800'}>
              <User className={`w-3.5 h-3.5 shrink-0 ${theme === 'win98' ? 'text-blue-900' : 'text-purple-400'}`} />
              <span className={`text-xs shrink-0 ${theme === 'win98' ? 'text-black font-bold' : 'text-slate-400'}`}>{t.filterByPerson}:</span>
              <select
                value={filterPersonId}
                onChange={e => setFilterPersonId(e.target.value)}
                className={theme === 'win98'
                  ? 'win98-sunken bg-white text-black font-bold text-xs p-1 focus:outline-none cursor-pointer max-w-[160px] truncate'
                  : 'bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer max-w-[160px] truncate'
                }
              >
                <option value="all" className={theme === 'win98' ? 'bg-white text-black font-bold' : 'bg-slate-900 text-white'}>{t.all} ({photos.length})</option>
                {persons.map(p => {
                  const taggedCount = photos.filter(ph => (ph.taggedPersonIds || []).includes(p.id)).length;
                  if (taggedCount === 0) return null;
                  return (
                    <option key={p.id} value={p.id} className={theme === 'win98' ? 'bg-white text-black font-bold' : 'bg-slate-900 text-white'}>
                      {formatFullName(p, lang)} ({taggedCount})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter by Album Tag */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-1 overflow-x-auto py-1">
                <button
                  onClick={() => setFilterTag('all')}
                  className={theme === 'win98'
                    ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${filterTag === 'all' ? 'win98-btn-active bg-[#dfdfdf]' : ''}`
                    : `px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        filterTag === 'all'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`
                  }
                >
                  {t.all}
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={theme === 'win98'
                      ? `win98-btn px-2.5 py-1 text-xs font-bold text-black ${filterTag === tag ? 'win98-btn-active bg-[#dfdfdf]' : ''}`
                      : `px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          filterTag === tag
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`
                    }
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keyword Search */}
          <div className="relative w-full lg:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${theme === 'win98' ? 'text-gray-700' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'zh' ? '搜索照片、地点、族人...' : 'Search photo, place, member...'}
              className={theme === 'win98'
                ? 'w-full pl-8 pr-3 py-1 win98-sunken bg-white text-black font-bold text-xs focus:outline-none'
                : 'w-full pl-8 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition'
              }
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1.5 ${theme === 'win98' ? 'text-black font-bold' : 'text-slate-500 hover:text-white'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Gallery Photo Grid Content */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/60 p-8">
              <Camera className="w-14 h-14 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-slate-200">
                {photos.length === 0 ? t.noPhotosYet : t.noPhotosFound}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {photos.length === 0 
                  ? (lang === 'zh' ? '上传老照片或家庭合影，并在照片上标记族人，让历史面孔鲜活呈现。' : 'Upload vintage portraits or family gatherings, and tag members to link faces to the family tree.')
                  : (lang === 'zh' ? '尝试调整搜索条件或筛选族人。' : 'Try clearing your filters or search keywords.')}
              </p>
              {isAdminMode && photos.length === 0 && (
                <button
                  onClick={() => handleOpenUpload()}
                  className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-lg shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.uploadPhoto}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => {
                const taggedPersons = (photo.taggedPersonIds || [])
                  .map(id => personsMap.get(id))
                  .filter(Boolean);

                return (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhoto(photo)}
                    className={theme === 'win98'
                      ? 'win98-box p-2.5 bg-[#c0c0c0] hover:bg-[#d4d0c8] cursor-pointer flex flex-col'
                      : 'group relative bg-slate-900/80 rounded-2xl border border-slate-800/80 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden cursor-pointer transition flex flex-col'
                    }
                  >
                    {/* Thumbnail Image Container */}
                    <div className={`aspect-[4/3] w-full overflow-hidden relative ${
                      theme === 'win98' ? 'win98-sunken p-0.5 bg-white' : 'bg-slate-950'
                    }`}>
                      <img
                        src={photo.url}
                        alt={photo.title || 'Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-200 flex items-end p-3">
                        <span className="text-[11px] text-purple-300 flex items-center font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '点击查看高清大图' : 'Click to inspect photo'}
                        </span>
                      </div>

                      {/* Tagged count pill */}
                      {taggedPersons.length > 0 && (
                        <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-1 shadow-md ${
                          theme === 'win98'
                            ? 'bg-yellow-100 text-black border border-yellow-500 font-bold'
                            : 'bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-200'
                        }`}>
                          <User className="w-3 h-3 text-purple-600" />
                          <span>{taggedPersons.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content Footer */}
                    <div className={`p-3 flex-1 flex flex-col justify-between space-y-2 ${theme === 'win98' ? 'text-black' : ''}`}>
                      <div>
                        <h3 className={`text-sm font-black break-words whitespace-normal leading-snug ${
                          theme === 'win98' ? 'text-black' : 'text-white group-hover:text-purple-300'
                        }`}>
                          {photo.title}
                        </h3>

                        <div className={`flex flex-wrap items-center gap-2 mt-1 text-[11px] ${
                          theme === 'win98' ? 'text-neutral-900 font-bold' : 'text-slate-400'
                        }`}>
                          {photo.date && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-neutral-600" />
                              {photo.date}
                            </span>
                          )}
                          {photo.place && (
                            <span className="flex items-center truncate max-w-[120px]">
                              <MapPin className="w-3 h-3 mr-1 text-neutral-600 shrink-0" />
                              <span className="truncate">{photo.place}</span>
                            </span>
                          )}
                        </div>

                        {photo.caption && (
                          <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed italic ${
                            theme === 'win98' ? 'text-neutral-800 font-medium' : 'text-slate-300'
                          }`}>
                            "{photo.caption}"
                          </p>
                        )}
                      </div>

                      {/* Tagged Family Member Avatars */}
                      {taggedPersons.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {taggedPersons.slice(0, 4).map(p => (
                              <div
                                key={p.id}
                                title={formatFullName(p, lang)}
                                className="relative w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden shrink-0 shadow-sm"
                              >
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.firstName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-300 bg-indigo-900/60">
                                    {p.firstName?.[0] || 'M'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {taggedPersons.map(p => p.firstName).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX PHOTO MODAL */}
      {activePhoto && (
        <div
          className={`fixed inset-0 z-[110] flex items-center justify-center p-3 select-none ${
            theme === 'win98' 
              ? 'bg-black/60' 
              : 'bg-slate-950/95 backdrop-blur-md flex-col lg:flex-row items-stretch justify-between animate-in fade-in duration-150'
          }`}
          onClick={() => setActivePhoto(null)}
        >
          {theme === 'win98' ? (
            <div 
              className="win98-box w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] bg-[#c0c0c0] text-black overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Title bar */}
              <div className="px-3 py-1 flex items-center justify-between text-xs font-bold text-white win98-title-navy shrink-0 select-none">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Images className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lang === 'zh' ? '照片档案查阅' : 'Photo Archive Viewer'} - {activePhoto.title}</span>
                </div>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="win98-btn px-1.5 py-0.5 text-xs font-black text-black leading-none ml-2"
                  title={lang === 'zh' ? '关闭' : 'Close'}
                >
                  ✕
                </button>
              </div>

              {/* Main content grid: Photo on left, Details on right */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Photo canvas */}
                <div className="flex-1 p-3 win98-sunken bg-black flex items-center justify-center m-2 overflow-hidden min-h-[300px]">
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.title}
                    className="max-h-[65vh] max-w-full object-contain select-none"
                  />
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-88 bg-[#c0c0c0] p-3 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-400 text-black shrink-0">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                        {lang === 'zh' ? '照片档案信息' : 'Photo Details'}
                      </span>
                      <h2 className="text-lg font-black text-black mt-0.5 leading-snug">
                        {activePhoto.title}
                      </h2>
                    </div>

                    {/* Vitals */}
                    <div className="win98-sunken p-2.5 bg-white text-black space-y-1.5 text-xs font-bold">
                      {activePhoto.date && (
                        <div className="flex items-center text-black">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-900" />
                          <span>{t.photoDate}: <strong>{activePhoto.date}</strong></span>
                        </div>
                      )}
                      {activePhoto.place && (
                        <div className="flex items-center text-black">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-800" />
                          <span>{t.photoPlace}: <strong>{activePhoto.place}</strong></span>
                        </div>
                      )}
                      {activePhoto.tags && activePhoto.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {activePhoto.tags.map((tag, idx) => (
                            <span key={idx} className="win98-box px-1.5 py-0.5 bg-[#dfdfdf] text-black text-[10px] font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Caption */}
                    {activePhoto.caption && (
                      <div>
                        <h4 className="text-xs font-bold text-black mb-1">
                          {t.photoCaption}
                        </h4>
                        <p className="win98-sunken bg-white p-2.5 text-xs text-black italic">
                          "{activePhoto.caption}"
                        </p>
                      </div>
                    )}

                    {/* Tagged members */}
                    <div>
                      <h4 className="text-xs font-bold text-black mb-1.5 flex items-center justify-between">
                        <span className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-blue-900" />
                          {t.taggedPersons} ({activePhoto.taggedPersonIds?.length || 0})
                        </span>
                      </h4>

                      {(!activePhoto.taggedPersonIds || activePhoto.taggedPersonIds.length === 0) ? (
                        <p className="win98-sunken bg-white p-2 text-xs text-gray-700 italic">
                          {lang === 'zh' ? '暂未标记族人。' : 'No family members tagged yet.'}
                        </p>
                      ) : (
                        <div className="win98-sunken bg-white p-1.5 space-y-1 max-h-48 overflow-y-auto">
                          {activePhoto.taggedPersonIds.map(personId => {
                            const person = personsMap.get(personId);
                            if (!person) return null;

                            return (
                              <div
                                key={person.id}
                                className="p-1.5 flex items-center justify-between hover:bg-blue-50 transition border-b border-gray-100 last:border-none"
                              >
                                <div 
                                  className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0"
                                  onClick={() => {
                                    onSelectPerson(person);
                                    setActivePhoto(null);
                                  }}
                                >
                                  <div className="w-7 h-7 win98-box bg-[#dfdfdf] overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs">
                                    {person.avatar ? (
                                      <img src={person.avatar} alt={person.firstName} className="w-full h-full object-cover" />
                                    ) : (
                                      person.gender === 'female' ? '♀' : '♂'
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-black text-black truncate hover:underline">
                                      {formatFullName(person, lang)}
                                    </div>
                                    <div className="text-[10px] text-gray-700 font-semibold truncate">
                                      {getLifespan(person, lang)}
                                    </div>
                                  </div>
                                </div>

                                {isAdminMode && (
                                  <button
                                    onClick={() => onSetAvatarFromPhoto(person.id, activePhoto.url)}
                                    title={t.setAsAvatar}
                                    className="win98-btn px-2 py-0.5 text-[10px] font-bold text-black flex items-center space-x-1 shrink-0 ml-1.5"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-700" />
                                    <span>{lang === 'zh' ? '设为头像' : 'Set Avatar'}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-400 flex items-center justify-between gap-2 mt-3">
                    {isAdminMode && (
                      <>
                        <button
                          onClick={() => {
                            const toEdit = { ...activePhoto };
                            setActivePhoto(null);
                            handleOpenUpload(toEdit);
                          }}
                          className="win98-btn flex-1 py-1 px-2 text-xs font-bold text-black flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-900" />
                          <span>{lang === 'zh' ? '编辑照片与标记' : 'Edit & Tag'}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'zh' ? '确认删除此照片吗？此操作不可撤销。' : 'Are you sure you want to delete this photo?')) {
                              onDeletePhoto(activePhoto.id);
                              setActivePhoto(null);
                            }
                          }}
                          className="win98-btn py-1 px-2 text-xs font-bold text-rose-800"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setActivePhoto(null)}
                      className="win98-btn px-3 py-1 text-xs font-bold text-black"
                    >
                      {lang === 'zh' ? '关闭' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Main Large Image Display */}
              <div 
                className="flex-1 relative p-4 lg:p-8 flex items-center justify-center overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <img
                  src={activePhoto.url}
                  alt={activePhoto.title}
                  className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/80 select-none"
                />

                {/* Quick Top Bar Close Button */}
                <button
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Details Sidebar */}
              <div 
                className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="space-y-6">
                  
                  {/* Sidebar Header & Close */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                        {lang === 'zh' ? '照片档案' : 'Photo Archive'}
                      </span>
                      <h2 className="text-xl font-bold text-white mt-0.5">
                        {activePhoto.title}
                      </h2>
                    </div>
                    <button
                      onClick={() => setActivePhoto(null)}
                      className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Vitals: Date & Place */}
                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
                    {activePhoto.date && (
                      <div className="flex items-center text-slate-300">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-purple-400" />
                        <span>{t.photoDate}: <strong className="text-white">{activePhoto.date}</strong></span>
                      </div>
                    )}
                    {activePhoto.place && (
                      <div className="flex items-center text-slate-300">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-purple-400" />
                        <span>{t.photoPlace}: <strong className="text-white">{activePhoto.place}</strong></span>
                      </div>
                    )}
                    {activePhoto.tags && activePhoto.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activePhoto.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Caption / Story */}
                  {activePhoto.caption && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1.5">
                        {t.photoCaption}
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 italic">
                        "{activePhoto.caption}"
                      </p>
                    </div>
                  )}

                  {/* Tagged Family Members */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                        {t.taggedPersons} ({activePhoto.taggedPersonIds?.length || 0})
                      </span>
                    </h4>

                    {(!activePhoto.taggedPersonIds || activePhoto.taggedPersonIds.length === 0) ? (
                      <p className="text-xs text-slate-500 italic bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                        {lang === 'zh' ? '暂未标记族人。管理员可点击“编辑”添加标记。' : 'No family members tagged yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activePhoto.taggedPersonIds.map(personId => {
                          const person = personsMap.get(personId);
                          if (!person) return null;

                          return (
                            <div
                              key={person.id}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between group hover:border-purple-500/40 transition"
                            >
                              <div 
                                className="flex items-center space-x-2.5 cursor-pointer flex-1"
                                onClick={() => {
                                  onSelectPerson(person);
                                  setActivePhoto(null);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                  {person.avatar ? (
                                    <img src={person.avatar} alt={person.firstName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                                      {person.firstName?.[0]}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                                    {formatFullName(person, lang)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {getLifespan(person, lang)}
                                  </div>
                                </div>
                              </div>

                              {/* Action: Set this photo as member avatar (Admin Only) */}
                              {isAdminMode && (
                                <button
                                  onClick={() => onSetAvatarFromPhoto(person.id, activePhoto.url)}
                                  title={t.setAsAvatar}
                                  className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-medium transition flex items-center space-x-1 shrink-0 ml-2"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-400" />
                                  <span>{lang === 'zh' ? '设为头像' : 'Set Avatar'}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Admin Footer Actions (Edit & Delete) */}
                {isAdminMode && (
                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3 mt-6">
                    <button
                      onClick={() => {
                        const toEdit = { ...activePhoto };
                        setActivePhoto(null);
                        handleOpenUpload(toEdit);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition border border-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '编辑照片与标记' : 'Edit & Tag'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(lang === 'zh' ? '确认删除此照片吗？此操作不可撤销。' : 'Are you sure you want to delete this photo?')) {
                          onDeletePhoto(activePhoto.id);
                          setActivePhoto(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* UPLOAD / EDIT PHOTO MODAL */}
      {isUploadModalOpen && (
        <div 
          className={`fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center p-3 sm:p-4 select-none ${
            theme === 'win98' ? 'bg-black/60' : 'bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150'
          }`}
          onClick={() => setIsUploadModalOpen(false)}
        >
          {theme === 'win98' ? (
            <div 
              className="relative w-full max-w-2xl win98-box shadow-2xl bg-[#c0c0c0] text-black overflow-hidden flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Title Bar */}
              <div className="px-3 py-1 flex items-center justify-between text-xs font-bold text-white win98-title-navy shrink-0 select-none">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {editingPhoto ? (lang === 'zh' ? '编辑照片与标记族人' : 'Edit Photo & Tag Members') : t.uploadPhoto}
                  </span>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="win98-btn px-1.5 py-0.5 text-xs font-black text-black leading-none ml-2"
                  title={lang === 'zh' ? '关闭' : 'Close'}
                >
                  ✕
                </button>
              </div>

              {/* Subheader banner */}
              <div className="px-3 py-1.5 bg-[#d4d0c8] border-b border-gray-400 text-xs font-bold text-black flex items-center justify-between shrink-0">
                <span>{lang === 'zh' ? '支持电脑本地文件上传或网络图片链接' : 'Upload from your computer or paste an image link'}</span>
                <span className="text-[11px] font-mono text-blue-900">MAX 15MB</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePhotoSubmit} className="p-4 space-y-3.5 overflow-y-auto max-h-[75vh]">
                
                {/* Photo Source Switcher: Upload vs URL */}
                <div>
                  <div className="flex items-center space-x-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setFormSourceType('upload')}
                      className={`win98-btn px-3 py-1.5 text-xs font-bold text-black flex items-center space-x-1.5 ${
                        formSourceType === 'upload' ? 'win98-btn-active bg-[#dfdfdf]' : ''
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-900" />
                      <span>{t.chooseFromComputer}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormSourceType('url')}
                      className={`win98-btn px-3 py-1.5 text-xs font-bold text-black flex items-center space-x-1.5 ${
                        formSourceType === 'url' ? 'win98-btn-active bg-[#dfdfdf]' : ''
                      }`}
                    >
                      <Link className="w-3.5 h-3.5 text-purple-900" />
                      <span>{t.orPasteUrl}</span>
                    </button>
                  </div>

                  {formSourceType === 'upload' ? (
                    <div className="win98-sunken p-5 bg-white text-black text-center border-2 border-gray-400 hover:border-blue-900 transition relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center pointer-events-none">
                        <Camera className="w-9 h-9 text-blue-900 mb-1.5" />
                        <span className="text-xs font-black text-black">{t.dropPhotoHere}</span>
                        <span className="text-[11px] text-gray-700 font-bold mt-0.5">PNG, JPG, WEBP, GIF (Max 15MB)</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={formUrl}
                        onChange={e => setFormUrl(e.target.value)}
                        placeholder="https://example.com/family-photo.jpg"
                        className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Image Preview */}
                  {formUrl && (
                    <div className="mt-2.5 relative win98-sunken bg-white p-2 border border-gray-400 max-h-48 flex items-center justify-center">
                      <img src={formUrl} alt="Preview" className="max-h-44 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormUrl('')}
                        className="win98-btn absolute top-2 right-2 px-1.5 py-0.5 text-xs font-black text-rose-800"
                        title={lang === 'zh' ? '移除照片' : 'Remove Image'}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo Title */}
                <div>
                  <label className="block text-xs font-bold text-black mb-1">{t.photoTitle} *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={lang === 'zh' ? '例如：1965年全家大合影 / 祖宅留念' : 'e.g. 1965 Family Reunion / Wedding Day'}
                    className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-bold text-xs focus:outline-none"
                  />
                </div>

                {/* Date & Place Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">{t.photoDate}</label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      placeholder="e.g. 1965 or 1965-06-15"
                      className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-bold text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">{t.photoPlace}</label>
                    <input
                      type="text"
                      value={formPlace}
                      onChange={e => setFormPlace(e.target.value)}
                      placeholder="e.g. Penampang, Sabah"
                      className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-bold text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-black mb-1">{t.photoTags}</label>
                  <input
                    type="text"
                    value={formTagsStr}
                    onChange={e => setFormTagsStr(e.target.value)}
                    placeholder={lang === 'zh' ? '用逗号隔开：婚礼, 老照片, 团聚' : 'Comma separated: Wedding, Vintage, Reunion'}
                    className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-bold text-xs focus:outline-none"
                  />
                </div>

                {/* Caption / Story */}
                <div>
                  <label className="block text-xs font-bold text-black mb-1">{t.photoCaption}</label>
                  <textarea
                    rows={3}
                    value={formCaption}
                    onChange={e => setFormCaption(e.target.value)}
                    placeholder={lang === 'zh' ? '记录照片背后的故事、拍摄背景或口述历史...' : 'Historical context, anecdotes, who took the photo...'}
                    className="w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-medium text-xs focus:outline-none"
                  />
                </div>

                {/* Tag Family Members Section */}
                <div className="pt-2 border-t border-gray-400">
                  <label className="block text-xs font-bold text-black mb-1.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-blue-900" />
                    <span>{t.tagMember} ({formTaggedIds.length} {lang === 'zh' ? '人已标记' : 'tagged'})</span>
                  </label>

                  {/* Selected Tagged Chips */}
                  {formTaggedIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {formTaggedIds.map(id => {
                        const p = personsMap.get(id);
                        if (!p) return null;
                        return (
                          <span 
                            key={id} 
                            className="win98-box px-2 py-0.5 bg-[#dfdfdf] text-black text-xs font-bold inline-flex items-center space-x-1 border border-gray-400"
                          >
                            <span>{formatFullName(p, lang)}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTagPerson(id)}
                              className="ml-1 text-rose-800 font-bold hover:text-black"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search member to tag */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-700 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchPersonQuery}
                        onChange={e => setSearchPersonQuery(e.target.value)}
                        placeholder={lang === 'zh' ? '搜索要标记的族人名字...' : 'Search member name to tag...'}
                        className="w-full pl-8 pr-2.5 py-1 win98-sunken bg-white text-black font-bold text-xs focus:outline-none"
                      />
                    </div>

                    {/* Autocomplete member candidates */}
                    <div className="max-h-36 overflow-y-auto win98-sunken bg-white text-black divide-y divide-gray-200 border border-gray-400">
                      {persons
                        .filter(p => {
                          if (!searchPersonQuery.trim()) return true;
                          const full = `${p.firstName} ${p.lastName} ${p.chineseName || ''}`.toLowerCase();
                          return full.includes(searchPersonQuery.toLowerCase());
                        })
                        .slice(0, 8)
                        .map(p => {
                          const isTagged = formTaggedIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleToggleTagPerson(p.id)}
                              className={`w-full text-left p-1.5 flex items-center justify-between text-xs transition ${
                                isTagged ? 'bg-blue-100 text-blue-950 font-bold' : 'hover:bg-[#000080] hover:text-white text-black'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 win98-box bg-[#dfdfdf] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                                  {p.firstName?.[0]}
                                </div>
                                <span className="font-bold">{formatFullName(p, lang)}</span>
                                <span className="text-[10px] opacity-75">({getLifespan(p, lang)})</span>
                              </div>
                              {isTagged ? (
                                <span className="text-[10px] text-blue-900 flex items-center font-black">
                                  ✓ {lang === 'zh' ? '已标记' : 'Tagged'}
                                </span>
                              ) : (
                                <span className="text-[10px] opacity-75">+ {lang === 'zh' ? '标记' : 'Tag'}</span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-3 border-t border-gray-400 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="win98-btn px-4 py-1.5 text-xs font-bold text-black"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="win98-btn px-5 py-1.5 text-xs font-bold text-black bg-blue-100 flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-900" />
                    <span>{editingPhoto ? (lang === 'zh' ? '保存修改' : 'Save Changes') : (lang === 'zh' ? '保存照片' : 'Save Photo')}</span>
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div 
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {editingPhoto ? (lang === 'zh' ? '编辑照片与标记族人' : 'Edit Photo & Tag Members') : t.uploadPhoto}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {lang === 'zh' ? '支持电脑本地文件上传或网络图片链接' : 'Upload from your computer or paste an image link'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePhotoSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                
                {/* Photo Source Switcher: Upload vs URL */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setFormSourceType('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                        formSourceType === 'upload'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.chooseFromComputer}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormSourceType('url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                        formSourceType === 'url'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>{t.orPasteUrl}</span>
                    </button>
                  </div>

                  {formSourceType === 'upload' ? (
                    <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-6 text-center transition bg-slate-950/40 relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center pointer-events-none">
                        <Camera className="w-10 h-10 text-purple-400 mb-2" />
                        <span className="text-xs font-semibold text-white">{t.dropPhotoHere}</span>
                        <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP, GIF (Max 15MB)</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={formUrl}
                        onChange={e => setFormUrl(e.target.value)}
                        placeholder="https://example.com/family-photo.jpg"
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  )}

                  {/* Image Preview */}
                  {formUrl && (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-slate-950 flex items-center justify-center">
                      <img src={formUrl} alt="Preview" className="max-h-48 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormUrl('')}
                        className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-rose-400 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.photoTitle} *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={lang === 'zh' ? '例如：1965年全家大合影 / 祖宅留念' : 'e.g. 1965 Family Reunion / Wedding Day'}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Date & Place Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t.photoDate}</label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      placeholder="e.g. 1965 or 1965-06-15"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t.photoPlace}</label>
                    <input
                      type="text"
                      value={formPlace}
                      onChange={e => setFormPlace(e.target.value)}
                      placeholder="e.g. Penampang, Sabah"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.photoTags}</label>
                  <input
                    type="text"
                    value={formTagsStr}
                    onChange={e => setFormTagsStr(e.target.value)}
                    placeholder={lang === 'zh' ? '用逗号隔开：婚礼, 老照片, 团聚' : 'Comma separated: Wedding, Vintage, Reunion'}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Caption / Story */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.photoCaption}</label>
                  <textarea
                    rows={3}
                    value={formCaption}
                    onChange={e => setFormCaption(e.target.value)}
                    placeholder={lang === 'zh' ? '记录照片背后的故事、拍摄背景或口述历史...' : 'Historical context, anecdotes, who took the photo...'}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Tag Family Members Section */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-purple-300 mb-1.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t.tagMember} ({formTaggedIds.length} {lang === 'zh' ? '人已标记' : 'tagged'})</span>
                  </label>

                  {/* Selected Tagged Chips */}
                  {formTaggedIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formTaggedIds.map(id => {
                        const p = personsMap.get(id);
                        if (!p) return null;
                        return (
                          <span 
                            key={id} 
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 text-xs border border-purple-500/30"
                          >
                            <span className="font-semibold">{formatFullName(p, lang)}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleTagPerson(id)}
                              className="ml-1.5 text-purple-300 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search member to tag */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchPersonQuery}
                        onChange={e => setSearchPersonQuery(e.target.value)}
                        placeholder={lang === 'zh' ? '搜索要标记的族人名字...' : 'Search member name to tag...'}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Autocomplete member candidates */}
                    <div className="max-h-36 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/60 divide-y divide-slate-800/60">
                      {persons
                        .filter(p => {
                          if (!searchPersonQuery.trim()) return true;
                          const full = `${p.firstName} ${p.lastName} ${p.chineseName || ''}`.toLowerCase();
                          return full.includes(searchPersonQuery.toLowerCase());
                        })
                        .slice(0, 8)
                        .map(p => {
                          const isTagged = formTaggedIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleToggleTagPerson(p.id)}
                              className={`w-full text-left p-2 flex items-center justify-between text-xs transition ${
                                isTagged ? 'bg-purple-950/40 text-purple-300' : 'hover:bg-slate-800/50 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  {p.firstName?.[0]}
                                </div>
                                <span className="font-medium text-white">{formatFullName(p, lang)}</span>
                                <span className="text-[10px] text-slate-500">({getLifespan(p, lang)})</span>
                              </div>
                              {isTagged ? (
                                <span className="text-[10px] text-purple-400 flex items-center font-bold">
                                  <Check className="w-3.5 h-3.5 mr-0.5" />
                                  {lang === 'zh' ? '已标记' : 'Tagged'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">+ {lang === 'zh' ? '标记' : 'Tag'}</span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-lg shadow-purple-600/30"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingPhoto ? (lang === 'zh' ? '保存修改' : 'Save Changes') : (lang === 'zh' ? '保存照片' : 'Save Photo')}</span>
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
