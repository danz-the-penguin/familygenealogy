import React, { useState, useMemo } from 'react';
import { X, Images, Search, Check, Crop, Upload, Tag, Calendar, UserCheck } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function GalleryPhotoPickerModal({
  isOpen,
  onClose,
  photos = [],
  currentPersonId,
  onSelectPhoto,
  onSelectAndCrop,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filterMode, setFilterMode] = useState('tagged'); // 'tagged' | 'all'

  // Photos tagged for this specific person
  const taggedPhotos = useMemo(() => {
    if (!currentPersonId) return [];
    return photos.filter(p => Array.isArray(p.taggedPersonIds) && p.taggedPersonIds.includes(currentPersonId));
  }, [photos, currentPersonId]);

  // Set initial filter mode: if member has tagged photos, show tagged by default; else 'all'
  useMemo(() => {
    if (taggedPhotos.length > 0) {
      setFilterMode('tagged');
    } else {
      setFilterMode('all');
    }
  }, [taggedPhotos.length]);

  const displayPhotos = useMemo(() => {
    let list = filterMode === 'tagged' ? taggedPhotos : photos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => {
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const captionMatch = (p.caption || '').toLowerCase().includes(q);
        const placeMatch = (p.place || '').toLowerCase().includes(q);
        const dateMatch = (p.date || '').toLowerCase().includes(q);
        const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
        return titleMatch || captionMatch || placeMatch || dateMatch || tagMatch;
      });
    }
    return list;
  }, [photos, taggedPhotos, filterMode, searchQuery]);

  // Local file upload & crop
  const handleLocalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (base64Url && typeof base64Url === 'string') {
        onSelectAndCrop(base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'zh' ? '从家族画廊选择族人肖像' : 'Select Portrait from Photo Gallery'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'zh' ? '选择照片后可直接应用或进入裁剪框对准头像' : 'Choose a photo from the gallery to use or crop as profile avatar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Tagged/All Tabs + Search + Upload */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('tagged')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterMode === 'tagged'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '已标记此族人' : 'Tagged for Member'} ({taggedPhotos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterMode === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '全部画廊照片' : 'All Gallery Photos'} ({photos.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'zh' ? '搜索标题、地点、标签...' : 'Search title, place, tag...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <label className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'zh' ? '上传并裁剪' : 'Upload & Crop'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLocalFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="p-4 flex-1 overflow-y-auto min-h-[300px]">
          {displayPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
              <Images className="w-12 h-12 text-slate-600" />
              <p className="text-sm font-medium">
                {filterMode === 'tagged' 
                  ? (lang === 'zh' ? '画廊中暂无标记此族人的照片' : 'No photos tagged with this member yet') 
                  : (lang === 'zh' ? '未找到符合条件的画廊照片' : 'No matching photos found in gallery')}
              </p>
              {filterMode === 'tagged' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-xs text-purple-400 hover:underline"
                >
                  {lang === 'zh' ? '查看全部画廊照片选择 →' : 'Browse all gallery photos →'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayPhotos.map(photo => {
                const isSelected = selectedPhoto?.id === photo.id;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`group relative rounded-xl overflow-hidden border-2 bg-slate-950 cursor-pointer transition duration-150 flex flex-col ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                      <img
                        src={photo.url}
                        alt={photo.title || 'Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-slate-900/90 border-t border-slate-800/80">
                      <div className="text-xs font-semibold text-white truncate">
                        {photo.title || (lang === 'zh' ? '未命名照片' : 'Untitled Photo')}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5 truncate">
                        {photo.date && (
                          <span className="flex items-center">
                            <Calendar className="w-2.5 h-2.5 mr-0.5" />
                            {photo.date}
                          </span>
                        )}
                        {photo.place && <span className="truncate">• {photo.place}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {selectedPhoto ? (
              <span className="text-purple-300 font-medium">
                {lang === 'zh' ? `已选中：${selectedPhoto.title || '照片'}` : `Selected: ${selectedPhoto.title || 'Photo'}`}
              </span>
            ) : (
              <span>{lang === 'zh' ? '请点击照片进行选择' : 'Click a photo to select'}</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              disabled={!selectedPhoto}
              onClick={() => {
                if (selectedPhoto) {
                  onSelectPhoto(selectedPhoto.url);
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {lang === 'zh' ? '直接作为头像' : 'Use As-Is'}
            </button>

            <button
              type="button"
              disabled={!selectedPhoto}
              onClick={() => {
                if (selectedPhoto) {
                  onSelectAndCrop(selectedPhoto.url);
                }
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '裁剪并设为头像' : 'Crop & Set Avatar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
