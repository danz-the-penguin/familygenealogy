import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop, Move } from 'lucide-react';
import { translations } from '../utils/i18n';

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;
  const isRetro = theme === 'win98';

  const containerRef = useRef(null);

  const [imageObj, setImageObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState(false);

  // Crop dimensions in the UI (square crop box)
  const CROP_SIZE = 280;

  // Load the image when imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setLoadError(false);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
    };
    img.onerror = () => {
      // If CORS fails for external image, try loading without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setImageObj(fallbackImg);
      };
      fallbackImg.onerror = () => {
        setLoadError(true);
      };
      fallbackImg.src = imageSrc;
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Handle Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform crop on canvas and return base64
  const handleApplyCrop = () => {
    if (!imageObj) return;

    // Create high-res output canvas (400x400)
    const OUTPUT_SIZE = 400;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE;
    const ctx = outCanvas.getContext('2d');

    ctx.fillStyle = isRetro ? '#ffffff' : '#0f172a';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Scaling ratio from UI preview to high-res canvas
    const scaleRatio = OUTPUT_SIZE / CROP_SIZE;

    ctx.save();
    // Center of canvas
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    // Apply pan translated to output scale
    ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply zoom
    ctx.scale(zoom, zoom);

    // Calculate dimensions to fit nicely
    const aspect = imageObj.width / imageObj.height;
    let drawWidth = OUTPUT_SIZE;
    let drawHeight = OUTPUT_SIZE;
    if (aspect > 1) {
      drawHeight = OUTPUT_SIZE;
      drawWidth = OUTPUT_SIZE * aspect;
    } else {
      drawWidth = OUTPUT_SIZE;
      drawHeight = OUTPUT_SIZE / aspect;
    }

    ctx.drawImage(
      imageObj,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();

    try {
      const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (e) {
      console.warn('Canvas export error (possibly cross-origin tainted):', e);
      // Fallback: pass original image
      onCropComplete(imageSrc);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[140] overflow-y-auto flex items-center justify-center p-3 sm:p-4 ${
      isRetro 
        ? 'bg-black/50 select-none' 
        : 'bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150'
    }`}>
      <div 
        className={isRetro 
          ? 'relative w-full max-w-lg win98-box shadow-2xl bg-[#c0c0c0] text-black overflow-hidden' 
          : 'relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150'
        }
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Title Bar */}
        {isRetro ? (
          <div className="px-3 py-1 flex items-center justify-between text-xs font-bold text-white win98-title-navy shrink-0 select-none">
            <div className="flex items-center space-x-1.5 min-w-0">
              <Crop className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'zh' ? '裁剪与调整族人肖像' : 'Crop & Adjust Portrait'}</span>
            </div>
            <button
              onClick={onClose}
              className="win98-btn px-1.5 py-0.5 text-xs font-black text-black leading-none ml-2"
              title={lang === 'zh' ? '关闭' : 'Close'}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Crop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {lang === 'zh' ? '裁剪与调整族人肖像' : 'Crop & Adjust Portrait'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {lang === 'zh' ? '拖拽移动位置，使用滑块缩放对准头像' : 'Drag to reposition, adjust zoom to frame headshot'}
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
        )}

        {/* Subheader info in retro */}
        {isRetro && (
          <div className="px-3 py-1.5 bg-[#d4d0c8] border-b border-gray-400 text-xs font-bold text-black flex items-center justify-between">
            <span>{lang === 'zh' ? '拖拽圆框内移动，使用下方滑块缩放' : 'Drag inside circle to move, adjust zoom slider below'}</span>
            <span className="text-[11px] font-mono text-blue-900">400×400px</span>
          </div>
        )}

        {/* Crop Viewport */}
        <div className={isRetro 
          ? 'p-4 flex flex-col items-center justify-center win98-sunken bg-[#dfdfdf] m-2 select-none' 
          : 'p-6 flex flex-col items-center justify-center bg-slate-950'
        }>
          {loadError ? (
            <div className="text-center py-12 text-rose-700 text-xs font-bold">
              {lang === 'zh' ? '无法载入图片，请检查网络链接或格式。' : 'Failed to load image. Please verify URL or file format.'}
            </div>
          ) : (
            <div 
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
              className={isRetro 
                ? 'relative overflow-hidden rounded-full border-4 border-[#000080] shadow-xl bg-white cursor-move select-none' 
                : 'relative overflow-hidden rounded-full border-4 border-indigo-500/80 shadow-2xl bg-slate-900 cursor-move select-none'
              }
            >
              {/* Image Preview with transform */}
              {imageObj && (
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Crop preview"
                    className="max-w-none select-none"
                    style={{
                      width: imageObj.width >= imageObj.height ? 'auto' : `${CROP_SIZE}px`,
                      height: imageObj.width < imageObj.height ? 'auto' : `${CROP_SIZE}px`
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Crosshair guide overlay */}
              <div className="absolute inset-0 pointer-events-none border border-black/20 rounded-full flex items-center justify-center">
                <div className="w-full h-px bg-black/15 absolute" />
                <div className="h-full w-px bg-black/15 absolute" />
              </div>
            </div>
          )}

          <div className={isRetro 
            ? 'mt-2.5 flex items-center space-x-1.5 text-xs font-bold text-gray-800' 
            : 'mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400'
          }>
            <Move className={`w-3.5 h-3.5 ${isRetro ? 'text-blue-900' : 'text-indigo-400'}`} />
            <span>{lang === 'zh' ? '按住并拖动图片调整头像居中' : 'Click & drag inside circle to pan position'}</span>
          </div>
        </div>

        {/* Controls: Zoom slider & Rotate */}
        <div className={isRetro 
          ? 'p-3 bg-[#c0c0c0] border-t border-gray-400 space-y-2.5' 
          : 'p-4 bg-slate-900 border-t border-slate-800 space-y-3'
        }>
          <div className="flex items-center justify-between space-x-3">
            <span className={isRetro ? "text-xs font-bold text-black flex items-center" : "text-xs text-slate-400 flex items-center"}>
              <ZoomOut className="w-3.5 h-3.5 mr-1" />
              1x
            </span>
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className={isRetro 
                ? 'flex-1 accent-[#000080] h-2 cursor-pointer' 
                : 'flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer'
              }
            />
            <span className={isRetro ? "text-xs font-bold text-black flex items-center" : "text-xs text-slate-400 flex items-center"}>
              <ZoomIn className="w-3.5 h-3.5 mr-1" />
              3x
            </span>

            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className={isRetro 
                ? 'win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center space-x-1' 
                : 'p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs border border-slate-700'
              }
              title={lang === 'zh' ? '旋转 90°' : 'Rotate 90°'}
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-900" />
              <span>90°</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-1.5 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={isRetro 
                ? 'win98-btn px-4 py-1.5 text-xs font-bold text-black' 
                : 'px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition'
              }
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={loadError || !imageObj}
              className={isRetro 
                ? 'win98-btn px-5 py-1.5 text-xs font-bold text-black bg-blue-100 flex items-center space-x-1.5 disabled:opacity-40' 
                : 'flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed'
              }
            >
              <Check className="w-4 h-4 text-emerald-900" />
              <span>{lang === 'zh' ? '应用裁剪并保存' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
