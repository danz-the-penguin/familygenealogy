import React, { useState, useMemo, useRef } from 'react';

/**
 * TabAutocompleteInput
 * A sleek input component providing inline ghost text and Tab / ArrowRight / Click-to-complete
 * autotyping functionality.
 */
export default function TabAutocompleteInput({
  value = '',
  onChange,
  suggestions = [],
  placeholder = '',
  className = '',
  list,
  type = 'text',
  onBlur,
  onFocus,
  onKeyDown,
  onAutocomplete,
  icon: Icon = null,
  disabled = false,
  autoComplete = 'off',
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const valStr = String(value ?? '');

  // Find best matching suggestion from candidate array
  const matchedSuggestion = useMemo(() => {
    if (!valStr.trim() || !suggestions || suggestions.length === 0) return '';
    const lowerVal = valStr.toLowerCase();

    // 1. Exact prefix match (case-insensitive) that is longer than typed value
    const exactPrefix = suggestions.find(s => 
      s && 
      typeof s === 'string' &&
      s.toLowerCase().startsWith(lowerVal) &&
      s.toLowerCase() !== lowerVal
    );
    if (exactPrefix) return exactPrefix;

    // 2. Exact match with casing difference (e.g., 'catholicism' vs 'Catholicism')
    const caseDiff = suggestions.find(s => 
      s && 
      typeof s === 'string' &&
      s.toLowerCase() === lowerVal && 
      s !== valStr
    );
    if (caseDiff) return caseDiff;

    return '';
  }, [valStr, suggestions]);

  // Calculate ghost suffix to render after user's typed string
  const ghostSuffix = useMemo(() => {
    if (!matchedSuggestion) return '';
    if (matchedSuggestion.toLowerCase().startsWith(valStr.toLowerCase())) {
      return matchedSuggestion.slice(valStr.length);
    }
    return '';
  }, [matchedSuggestion, valStr]);

  const applyAutocomplete = (newVal) => {
    if (!newVal) return;
    if (onChange) {
      // Dispatch synthetic event with target.value
      const syntheticEvent = {
        target: { value: newVal, name: rest.name },
        currentTarget: { value: newVal, name: rest.name },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent);
    }
    if (onAutocomplete) {
      onAutocomplete(newVal);
    }
    // Keep focus inside input after autocompleting
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;

    // Tab key: autocomplete to suggestion
    if (e.key === 'Tab') {
      if (matchedSuggestion && matchedSuggestion !== valStr) {
        e.preventDefault();
        applyAutocomplete(matchedSuggestion);
        return;
      }
    }

    // ArrowRight key: autocomplete if cursor is at the end of input
    if (e.key === 'ArrowRight' && inputRef.current) {
      const cursorAtEnd = inputRef.current.selectionStart === valStr.length;
      if (cursorAtEnd && matchedSuggestion && matchedSuggestion !== valStr) {
        e.preventDefault();
        applyAutocomplete(matchedSuggestion);
        return;
      }
    }

    // Enter key: complete suggestion if active
    if (e.key === 'Enter') {
      if (matchedSuggestion && matchedSuggestion !== valStr) {
        e.preventDefault();
        applyAutocomplete(matchedSuggestion);
        return;
      }
    }
  };

  // Match typography and padding
  const isXs = className.includes('text-xs');
  const isPx25 = className.includes('px-2.5');
  const textSizeClass = isXs ? 'text-xs' : 'text-sm';
  const paddingLeftClass = Icon ? 'pl-9' : (isPx25 ? 'pl-2.5' : 'pl-3');

  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}

      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        placeholder={placeholder}
        list={list}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`${className} ${Icon ? 'pl-9' : ''} ${ghostSuffix ? 'pr-16' : ''}`}
        {...rest}
      />

      {/* Ghost text display layer */}
      {isFocused && ghostSuffix && (
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 right-16 flex items-center pointer-events-none select-none overflow-hidden ${paddingLeftClass}`}
        >
          <span className={`opacity-0 whitespace-pre ${textSizeClass} font-sans tracking-normal leading-normal`}>
            {valStr}
          </span>
          <span className={`text-slate-500 whitespace-pre ${textSizeClass} font-sans font-normal opacity-85 tracking-normal leading-normal`}>
            {ghostSuffix}
          </span>
        </div>
      )}

      {/* Interactive Clickable 'Tab ⇥' Badge */}
      {isFocused && ghostSuffix && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault(); // keep input focus
            applyAutocomplete(matchedSuggestion);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-[10px] font-mono shadow-sm transition flex items-center space-x-1 cursor-pointer z-10 animate-in fade-in duration-100"
          title="Press Tab or click to autocomplete"
        >
          <span>Tab</span>
          <span className="text-[9px]">⇥</span>
        </button>
      )}
    </div>
  );
}
