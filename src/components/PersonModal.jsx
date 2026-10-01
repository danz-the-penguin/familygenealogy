import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, User, Save, Plus, Trash2, Heart, Tag, Calendar, 
  MapPin, Briefcase, Church, Globe, Sparkles, Cross, Check,
  FileText, ExternalLink, Images, Crop, Upload, Camera,
  Search, Zap
} from 'lucide-react';
import { formatFullName, extractYear, getLifespan } from '../utils/genealogy';
import { translations } from '../utils/i18n';
import GalleryPhotoPickerModal from './GalleryPhotoPickerModal';
import ImageCropperModal from './ImageCropperModal';
import TabAutocompleteInput from './TabAutocompleteInput';

export default function PersonModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  allPersons = [], 
  defaultParentId = null,
  defaultSpouseId = null,
  photos = [],
  lang = 'en',
  theme = 'win98'
}) {
  const t = translations[lang] || translations.en;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    maidenName: '',
    patronymic: '',
    christianName: '',
    chineseName: '',
    gender: 'male',
    ethnicity: '',
    adoptionStatus: 'biological',
    birthDate: '',
    birthYearOnly: false,
    birthPlace: '',
    deathDate: '',
    deathYearOnly: false,
    deathPlace: '',
    burialPlace: '',
    isLiving: true,
    occupation: '',
    bio: '',
    avatar: '',
    religions: [],
    parents: [],
    spouses: [],
    partnerDetails: {},
    children: [],
    tags: [],
    references: []
  });

  const [tagInput, setTagInput] = useState('');
  const [newRef, setNewRef] = useState({
    title: '',
    url: '',
    type: 'doc',
    notes: ''
  });

  // Photo Picker & Cropper modal states
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');

  // Inline spouse creation sub-form state
  const [isCreatingSpouseInline, setIsCreatingSpouseInline] = useState(false);
  const [inlineSpouse, setInlineSpouse] = useState({
    firstName: '',
    lastName: '',
    chineseName: '',
    gender: 'female',
    isLiving: true,
    birthDate: '',
    deathDate: '',
    burialPlace: '',
    status: 'spouse',
    marriageState: 'current',
    notes: ''
  });
  const [newSpousesToCreate, setNewSpousesToCreate] = useState([]);

  // Search queries for auto-typing & finding existing members to attach
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [spouseSearchQuery, setSpouseSearchQuery] = useState('');
  const [childSearchQuery, setChildSearchQuery] = useState('');

  useEffect(() => {
    setIsCreatingSpouseInline(false);
    setNewSpousesToCreate([]);
    setParentSearchQuery('');
    setSpouseSearchQuery('');
    setChildSearchQuery('');

    if (initialData) {
      const bDate = initialData.birthDate || '';
      const dDate = initialData.deathDate || '';
      const isBYearOnly = String(bDate).length === 4 && /^\d{4}$/.test(String(bDate));
      const isDYearOnly = String(dDate).length === 4 && /^\d{4}$/.test(String(dDate));

      setFormData({
        ...initialData,
        firstName: initialData.firstName ?? '',
        lastName: initialData.lastName ?? '',
        maidenName: initialData.maidenName ?? '',
        patronymic: initialData.patronymic ?? '',
        christianName: initialData.christianName ?? '',
        chineseName: initialData.chineseName ?? '',
        gender: initialData.gender || 'male',
        ethnicity: initialData.ethnicity ?? '',
        burialPlace: initialData.burialPlace ?? initialData.burialSite ?? '',
        adoptionStatus: initialData.adoptionStatus || 'biological',
        birthDate: initialData.birthDate ?? '',
        birthPlace: initialData.birthPlace ?? '',
        deathDate: initialData.deathDate ?? '',
        deathPlace: initialData.deathPlace ?? '',
        occupation: initialData.occupation ?? '',
        bio: initialData.bio ?? '',
        avatar: initialData.avatar ?? '',
        birthYearOnly: isBYearOnly,
        deathYearOnly: isDYearOnly,
        religions: Array.isArray(initialData.religions) ? initialData.religions : [],
        parents: Array.isArray(initialData.parents) ? initialData.parents : [],
        spouses: Array.isArray(initialData.spouses) ? initialData.spouses : [],
        partnerDetails: (initialData.partnerDetails && typeof initialData.partnerDetails === 'object') ? initialData.partnerDetails : {},
        children: Array.isArray(initialData.children) ? initialData.children : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        references: Array.isArray(initialData.references) ? initialData.references : [],
        isLiving: initialData.isLiving ?? (initialData.deathDate ? false : true)
      });
    } else {
      const spouseObj = defaultSpouseId ? allPersons.find(p => p.id === defaultSpouseId) : null;
      const defaultOppositeGender = spouseObj ? (spouseObj.gender === 'female' ? 'male' : 'female') : 'male';
      const isSpouseDeceased = spouseObj ? !spouseObj.isLiving : false;
      const newParents = defaultParentId ? [defaultParentId] : [];
      const newSpouses = defaultSpouseId ? [defaultSpouseId] : [];
      const initPartnerDetails = defaultSpouseId ? {
        [defaultSpouseId]: {
          status: 'spouse',
          marriageState: isSpouseDeceased ? 'death' : 'current',
          notes: ''
        }
      } : {};

      setFormData({
        firstName: '',
        lastName: '',
        maidenName: '',
        patronymic: '',
        christianName: '',
        chineseName: '',
        gender: defaultOppositeGender,
        ethnicity: spouseObj?.ethnicity || '',
        adoptionStatus: 'biological',
        birthDate: '',
        birthYearOnly: false,
        birthPlace: '',
        deathDate: '',
        deathYearOnly: false,
        deathPlace: '',
        burialPlace: '',
        isLiving: true,
        occupation: '',
        bio: '',
        avatar: '',
        religions: [],
        parents: newParents,
        spouses: newSpouses,
        partnerDetails: initPartnerDetails,
        children: [],
        tags: [],
        references: []
      });
    }
  }, [initialData, defaultParentId, defaultSpouseId, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const firstName = String(formData.firstName || '').trim();
    let lastName = String(formData.lastName || '').trim();
    const patronymic = String(formData.patronymic || '').trim();
    const chineseName = String(formData.chineseName || '').trim();

    // If a patronymic is added, while the surname is empty, make the patronymic the surname
    if (!lastName && patronymic) {
      lastName = patronymic;
    }

    if (!firstName && !lastName && !chineseName) {
      alert(lang === 'zh' ? '请至少填写姓、名或中文姓名。' : 'Please provide at least a first name, last name, or Chinese name.');
      return;
    }

    const currentPersonId = initialData?.id || `p-${Date.now()}`;

    // Ensure all linked spouses have complete partnerDetails entries
    const sanitizedPartnerDetails = { ...(formData.partnerDetails || {}) };
    (formData.spouses || []).forEach((spouseId, index) => {
      const spouseObj = allPersons.find(p => p.id === spouseId) || newSpousesToCreate.find(p => p.id === spouseId);
      const isDeceased = spouseObj ? !spouseObj.isLiving : false;
      const defaultOrder = 'spouse';
      
      if (!sanitizedPartnerDetails[spouseId]) {
        sanitizedPartnerDetails[spouseId] = {
          status: defaultOrder,
          marriageState: isDeceased ? 'death' : 'current',
          notes: ''
        };
      } else {
        if (!sanitizedPartnerDetails[spouseId].status) {
          sanitizedPartnerDetails[spouseId].status = defaultOrder;
        }
        if (!sanitizedPartnerDetails[spouseId].marriageState) {
          sanitizedPartnerDetails[spouseId].marriageState = isDeceased ? 'death' : 'current';
        }
      }
    });

    const payload = {
      ...formData,
      firstName: firstName,
      lastName: lastName,
      maidenName: formData.maidenName || '',
      patronymic: patronymic,
      christianName: formData.christianName || '',
      chineseName: formData.chineseName || '',
      gender: formData.gender || 'male',
      ethnicity: formData.ethnicity || '',
      burialPlace: formData.burialPlace || '',
      adoptionStatus: formData.adoptionStatus || 'biological',
      birthDate: formData.birthDate || '',
      birthPlace: formData.birthPlace || '',
      deathDate: formData.deathDate || '',
      deathPlace: formData.deathPlace || '',
      occupation: formData.occupation || '',
      bio: formData.bio || '',
      avatar: formData.avatar || '',
      religions: formData.religions || [],
      parents: formData.parents || [],
      spouses: formData.spouses || [],
      partnerDetails: sanitizedPartnerDetails,
      children: formData.children || [],
      tags: formData.tags || [],
      references: formData.references || [],
      isLiving: formData.isLiving ?? true,
      id: currentPersonId,
      newSpousesToCreate: newSpousesToCreate.map(ns => ({
        ...ns,
        spouses: Array.from(new Set([...(ns.spouses || []), currentPersonId])),
        partnerDetails: {
          ...(ns.partnerDetails || {}),
          [currentPersonId]: {
            status: 'spouse',
            marriageState: !(formData.isLiving ?? true) ? 'death' : 'current',
            notes: ''
          }
        }
      }))
    };

    onSave(payload);
  };

  const handleAddReference = () => {
    if (!newRef.title.trim() && !newRef.url.trim()) return;
    const item = {
      id: `ref-${Date.now()}`,
      title: newRef.title.trim(),
      url: newRef.url.trim(),
      type: newRef.type || 'doc',
      notes: newRef.notes.trim()
    };
    setFormData(prev => ({
      ...prev,
      references: [...(prev.references || []), item]
    }));
    setNewRef({ title: '', url: '', type: 'doc', notes: '' });
  };

  const handleRemoveReference = (idToRemove) => {
    setFormData(prev => ({
      ...prev,
      references: (prev.references || []).filter(r => r.id !== idToRemove)
    }));
  };

  // Avatar picker and cropping handlers
  const handleOpenCropperForCurrentAvatar = () => {
    if (formData.avatar) {
      setImageToCrop(formData.avatar);
      setIsCropperOpen(true);
    }
  };

  const handleSelectFromGallery = (photoUrl) => {
    setFormData(prev => ({ ...prev, avatar: photoUrl }));
  };

  const handleSelectAndCropFromGallery = (photoUrl) => {
    setImageToCrop(photoUrl);
    setIsGalleryPickerOpen(false);
    setIsCropperOpen(true);
  };

  const handleCropComplete = (croppedBase64) => {
    setFormData(prev => ({ ...prev, avatar: croppedBase64 }));
  };

  const handleLocalAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64 && typeof base64 === 'string') {
        setImageToCrop(base64);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tagToRemove) }));
  };

  // Religion handlers
  const handleAddReligion = () => {
    const isFirst = (!formData.religions || formData.religions.length === 0);
    const newEntry = {
      id: `relig-${Date.now()}`,
      name: '',
      startDate: '',
      endDate: '',
      isFinal: isFirst,
      isDeathbedConversion: false,
      notes: ''
    };
    setFormData(prev => ({ ...prev, religions: [...(prev.religions || []), newEntry] }));
  };

  const handleAddReligionWithName = (name) => {
    const isFirst = (!formData.religions || formData.religions.length === 0);
    const existing = [...(formData.religions || [])];
    // If the last item is empty, fill it instead of appending
    if (existing.length > 0 && !existing[existing.length - 1].name.trim()) {
      existing[existing.length - 1].name = name;
      setFormData(prev => ({ ...prev, religions: existing }));
      return;
    }
    const newEntry = {
      id: `relig-${Date.now()}`,
      name: name,
      startDate: '',
      endDate: '',
      isFinal: isFirst,
      isDeathbedConversion: false,
      notes: ''
    };
    setFormData(prev => ({ ...prev, religions: [...existing, newEntry] }));
  };

  const handleSetFinalReligion = (index) => {
    setFormData(prev => {
      const updated = (prev.religions || []).map((r, i) => ({
        ...r,
        isFinal: i === index ? !r.isFinal : false
      }));
      return { ...prev, religions: updated };
    });
  };

  const handleUpdateReligion = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.religions || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, religions: updated };
    });
  };

  const handleRemoveReligion = (index) => {
    setFormData(prev => ({
      ...prev,
      religions: (prev.religions || []).filter((_, i) => i !== index)
    }));
  };

  // Partner details handler (order/role, status death/current, notes)
  const handlePartnerFieldChange = (spouseId, field, value) => {
    setFormData(prev => {
      const prevDetails = (prev.partnerDetails && typeof prev.partnerDetails === 'object') ? prev.partnerDetails : {};
      const currentSpouseDetails = prevDetails[spouseId] || {};
      return {
        ...prev,
        partnerDetails: {
          ...prevDetails,
          [spouseId]: {
            ...currentSpouseDetails,
            [field]: value
          }
        }
      };
    });
  };

  const handlePartnerStatusChange = (spouseId, status) => {
    handlePartnerFieldChange(spouseId, 'status', status);
  };

  const handleRemoveSpouse = (spouseId) => {
    setFormData(prev => {
      const nextDetails = { ...(prev.partnerDetails || {}) };
      delete nextDetails[spouseId];
      return {
        ...prev,
        spouses: (prev.spouses || []).filter(id => id !== spouseId),
        partnerDetails: nextDetails
      };
    });
    setNewSpousesToCreate(prev => prev.filter(p => p.id !== spouseId));
  };

  const handleConfirmCreateInlineSpouse = () => {
    const fn = (inlineSpouse.firstName || '').trim();
    const ln = (inlineSpouse.lastName || '').trim();
    const cn = (inlineSpouse.chineseName || '').trim();
    if (!fn && !ln && !cn) {
      alert(lang === 'zh' ? '请至少填写配偶的姓、名或中文名。' : 'Please enter at least a first name, last name, or Chinese name for the spouse.');
      return;
    }
    const newSpouseId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSpouseRecord = {
      id: newSpouseId,
      firstName: fn,
      lastName: ln,
      chineseName: cn,
      gender: inlineSpouse.gender || 'female',
      isLiving: inlineSpouse.isLiving ?? true,
      birthDate: inlineSpouse.birthDate || '',
      deathDate: inlineSpouse.deathDate || '',
      burialPlace: inlineSpouse.burialPlace || '',
      spouses: initialData?.id ? [initialData.id] : [],
      partnerDetails: initialData?.id ? {
        [initialData.id]: {
          status: inlineSpouse.status === 'second_spouse' ? 'spouse' : (inlineSpouse.status === 'remarriage_after_death' ? 'spouse' : (inlineSpouse.status || 'spouse')),
          marriageState: !(formData.isLiving ?? true) ? 'death' : (inlineSpouse.isLiving ? 'current' : 'death'),
          marriageDate: inlineSpouse.marriageDate || '',
          marriagePlace: inlineSpouse.marriagePlace || '',
          notes: inlineSpouse.notes || ''
        }
      } : {},
      parents: [],
      children: [],
      tags: [],
      religions: []
    };

    setNewSpousesToCreate(prev => [...prev, newSpouseRecord]);
    setFormData(prev => ({
      ...prev,
      spouses: [...(prev.spouses || []), newSpouseId],
      partnerDetails: {
        ...(prev.partnerDetails || {}),
        [newSpouseId]: {
          status: inlineSpouse.status || 'spouse',
          marriageState: inlineSpouse.marriageState || (!inlineSpouse.isLiving ? 'death' : 'current'),
          marriageDate: inlineSpouse.marriageDate || '',
          marriagePlace: inlineSpouse.marriagePlace || '',
          notes: inlineSpouse.notes || ''
        }
      }
    }));
    setIsCreatingSpouseInline(false);
  };

  const availablePersons = allPersons.filter(p => !initialData || p.id !== initialData.id);

  // 1. Filtered candidates for Autotyping Parents / Spouses / Children
  const filteredParentCandidates = useMemo(() => {
    if (!parentSearchQuery.trim()) return [];
    const q = parentSearchQuery.trim().toLowerCase();
    return availablePersons
      .filter(p => !(formData.parents || []).includes(p.id))
      .filter(p => {
        const formatted = formatFullName(p, lang).toLowerCase();
        const full = `${p.firstName || ''} ${p.lastName || ''} ${p.chineseName || ''} ${p.christianName || ''} ${p.patronymic || ''} ${p.maidenName || ''}`.toLowerCase();
        return formatted.includes(q) || full.includes(q) || q.includes(formatted);
      })
      .slice(0, 8);
  }, [availablePersons, parentSearchQuery, formData.parents, lang]);

  const filteredSpouseCandidates = useMemo(() => {
    if (!spouseSearchQuery.trim()) return [];
    const q = spouseSearchQuery.trim().toLowerCase();
    return availablePersons
      .filter(p => !(formData.spouses || []).includes(p.id))
      .filter(p => {
        const formatted = formatFullName(p, lang).toLowerCase();
        const full = `${p.firstName || ''} ${p.lastName || ''} ${p.chineseName || ''} ${p.christianName || ''} ${p.patronymic || ''} ${p.maidenName || ''}`.toLowerCase();
        return formatted.includes(q) || full.includes(q) || q.includes(formatted);
      })
      .slice(0, 8);
  }, [availablePersons, spouseSearchQuery, formData.spouses, lang]);

  const filteredChildCandidates = useMemo(() => {
    if (!childSearchQuery.trim()) return [];
    const q = childSearchQuery.trim().toLowerCase();
    return availablePersons
      .filter(p => !(formData.children || []).includes(p.id))
      .filter(p => {
        const formatted = formatFullName(p, lang).toLowerCase();
        const full = `${p.firstName || ''} ${p.lastName || ''} ${p.chineseName || ''} ${p.christianName || ''} ${p.patronymic || ''} ${p.maidenName || ''}`.toLowerCase();
        return formatted.includes(q) || full.includes(q) || q.includes(formatted);
      })
      .slice(0, 8);
  }, [availablePersons, childSearchQuery, formData.children, lang]);

  // Helpers to register / attach matching person on Enter or Tab selection
  const handleAttachParentFromQuery = () => {
    if (!parentSearchQuery.trim()) return;
    const q = parentSearchQuery.trim().toLowerCase();
    const candidate = filteredParentCandidates[0] || availablePersons.find(p => 
      !(formData.parents || []).includes(p.id) && (
        formatFullName(p, lang).toLowerCase() === q ||
        formatFullName(p, lang).toLowerCase().includes(q) ||
        `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase() === q
      )
    );
    if (candidate) {
      setFormData(prev => ({
        ...prev,
        parents: Array.from(new Set([...(prev.parents || []), candidate.id]))
      }));
      setParentSearchQuery('');
    }
  };

  const handleAttachSpouseFromQuery = () => {
    if (!spouseSearchQuery.trim()) return;
    const q = spouseSearchQuery.trim().toLowerCase();
    const candidate = filteredSpouseCandidates[0] || availablePersons.find(p => 
      !(formData.spouses || []).includes(p.id) && (
        formatFullName(p, lang).toLowerCase() === q ||
        formatFullName(p, lang).toLowerCase().includes(q) ||
        `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase() === q
      )
    );
    if (candidate) {
      const isDeceased = !candidate.isLiving;
      setFormData(prev => ({
        ...prev,
        spouses: Array.from(new Set([...(prev.spouses || []), candidate.id])),
        partnerDetails: {
          ...(prev.partnerDetails || {}),
          [candidate.id]: {
            status: 'spouse',
            marriageState: isDeceased ? 'death' : 'current',
            notes: ''
          }
        }
      }));
      setSpouseSearchQuery('');
    }
  };

  const handleAttachChildFromQuery = () => {
    if (!childSearchQuery.trim()) return;
    const q = childSearchQuery.trim().toLowerCase();
    const candidate = filteredChildCandidates[0] || availablePersons.find(p => 
      !(formData.children || []).includes(p.id) && (
        formatFullName(p, lang).toLowerCase() === q ||
        formatFullName(p, lang).toLowerCase().includes(q) ||
        `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase() === q
      )
    );
    if (candidate) {
      setFormData(prev => ({
        ...prev,
        children: Array.from(new Set([...(prev.children || []), candidate.id]))
      }));
      setChildSearchQuery('');
    }
  };

  // 2. Comprehensive Auto-Complete Datalist Collections from Database
  const religionPresets = useMemo(() => [
    'Catholicism',
    'Catholic',
    'Momolianism',
    'Christianity',
    'Protestantism',
    'Islam',
    'Methodist',
    'Anglican',
    'Seventh-day Adventist',
    'Buddhism',
    'Taoism'
  ], []);

  const allReligionsList = useMemo(() => {
    const set = new Set(religionPresets);
    allPersons.forEach(p => {
      (p.religions || []).forEach(r => {
        if (r.name && r.name.trim()) set.add(r.name.trim());
      });
    });
    return Array.from(set).sort();
  }, [allPersons, religionPresets]);

  const detectedFather = useMemo(() => {
    const parentPersons = (formData.parents || []).map(id => allPersons.find(p => p.id === id)).filter(Boolean);
    return parentPersons.find(p => p.gender === 'male');
  }, [formData.parents, allPersons]);

  const nameSuggestions = useMemo(() => {
    const firstNames = new Set();
    const lastNames = new Set();
    const christianNames = new Set([
      'Martha', 'Mary', 'Maria Magdalena', 'Mary Rosalind', 'Lazarus', 'Josue', 
      'Leo', 'Joseph', 'David', 'John', 'Michael', 'Peter', 'Paul', 'Francis', 'Anthony'
    ]);
    const patronymics = new Set();
    const chineseNames = new Set();

    if (detectedFather) {
      const fatherName = detectedFather.firstName || detectedFather.chineseName || '';
      if (fatherName) {
        const prefix = formData.gender === 'female' ? 'binti' : 'bin';
        patronymics.add(`${prefix} ${fatherName}`.trim());
      }
    }

    allPersons.forEach(p => {
      if (p.firstName?.trim()) firstNames.add(p.firstName.trim());
      if (p.lastName?.trim()) lastNames.add(p.lastName.trim());
      if (p.christianName?.trim()) christianNames.add(p.christianName.trim());
      if (p.patronymic?.trim()) patronymics.add(p.patronymic.trim());
      if (p.chineseName?.trim()) chineseNames.add(p.chineseName.trim());
    });

    return {
      firstNames: Array.from(firstNames).sort(),
      lastNames: Array.from(lastNames).sort(),
      christianNames: Array.from(christianNames).sort(),
      patronymics: Array.from(patronymics).sort(),
      chineseNames: Array.from(chineseNames).sort()
    };
  }, [allPersons, detectedFather, formData.gender]);

  const placeSuggestions = useMemo(() => {
    const places = new Set();
    allPersons.forEach(p => {
      if (p.birthPlace?.trim()) places.add(p.birthPlace.trim());
      if (p.deathPlace?.trim()) places.add(p.deathPlace.trim());
      if (p.burialPlace?.trim()) places.add(p.burialPlace.trim());
    });
    return Array.from(places).sort();
  }, [allPersons]);

  const ethnicitySuggestions = useMemo(() => {
    const set = new Set(['Kadazan', 'Dusun', 'Chinese', 'Hakka', 'Cantonese', 'Malay', 'Bajau', 'Murut', 'Rungus', 'Eurasian']);
    allPersons.forEach(p => {
      if (p.ethnicity?.trim()) set.add(p.ethnicity.trim());
    });
    return Array.from(set).sort();
  }, [allPersons]);

  const occupationSuggestions = useMemo(() => {
    const set = new Set();
    allPersons.forEach(p => {
      if (p.occupation?.trim()) set.add(p.occupation.trim());
    });
    return Array.from(set).sort();
  }, [allPersons]);

  const allTagsList = useMemo(() => {
    const set = new Set(['Immigrant', 'Veteran', 'Scholar', 'Merchant', 'Matriarch', 'Patriarch', 'Pioneer', 'Teacher']);
    allPersons.forEach(p => {
      (p.tags || []).forEach(tg => {
        if (tg && tg.trim()) set.add(tg.trim());
      });
    });
    return Array.from(set).sort();
  }, [allPersons]);

  if (!isOpen) return null;

  const isRetro = theme === 'win98';
  const inpClass = isRetro 
    ? 'w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-semibold text-xs sm:text-sm focus:outline-none' 
    : 'w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition';
  const selClass = isRetro 
    ? 'w-full px-2 py-1.5 win98-sunken bg-white text-black font-semibold text-xs sm:text-sm focus:outline-none' 
    : 'w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition';
  const lblClass = isRetro 
    ? 'block text-xs font-bold text-black mb-1' 
    : 'block text-xs font-medium text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`relative w-full max-w-3xl overflow-hidden shadow-2xl ${
        theme === 'win98' 
          ? 'win98-box' 
          : 'bg-slate-900 border border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 duration-200'
      }`}>
        
        {/* Win98 Window Titlebar */}
        {theme === 'win98' && (
          <div className="win98-title-navy px-2 py-0.5 flex items-center justify-between text-xs font-bold text-white select-none">
            <div className="flex items-center space-x-1.5 truncate">
              <span>{initialData ? '✎' : '➕'}</span>
              <span>
                {initialData ? (lang === 'zh' ? '族人属性编辑' : 'Properties') : (lang === 'zh' ? '新增登记族人' : 'Add Family Member')} — [Registry 1998]
              </span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="win98-btn px-2 py-0.5 text-xs font-bold text-black hover:bg-red-100"
                title="Close (Esc)"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`p-4 md:p-5 flex items-center justify-between ${
          theme === 'win98' 
            ? 'bg-[#c0c0c0] border-b border-gray-400' 
            : 'border-b border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 flex items-center justify-center font-bold ${
              theme === 'win98' 
                ? 'win98-sunken rounded bg-white text-black' 
                : 'rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg md:text-xl font-black ${theme === 'win98' ? 'text-black' : 'text-white'}`}>
                {initialData ? t.editMember : t.addMember}
              </h2>
              <p className={`text-xs ${theme === 'win98' ? 'text-gray-800 font-semibold' : 'text-slate-400'}`}>
                {lang === 'zh' ? '支持续弦再婚、多配偶、墓园地穴、圣名教名与父称' : 'Supports remarriage, plural marriage, burial sites, Christian names, & patronymics'}
              </p>
            </div>
          </div>
          {theme !== 'win98' && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form 
          onSubmit={handleSubmit}
          onKeyDown={e => {
            // Prevent premature full-profile submission on Enter in single-line inputs,
            // while allowing explicit Cmd+Enter / Ctrl+Enter shortcut to save
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
              if (e.metaKey || e.ctrlKey) {
                return;
              }
              e.preventDefault();
            }
          }}
          className={`p-6 space-y-6 max-h-[78vh] overflow-y-auto ${
            theme === 'win98' ? 'bg-[#c0c0c0] text-black font-semibold' : ''
          }`}
        >
          
          {/* Identity & Names */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4"}>
            <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center"}>
              <User className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.personalInfo}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lblClass}>{t.firstName} *</label>
                <TabAutocompleteInput
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  suggestions={nameSuggestions.firstNames}
                  list="firstnames-datalist"
                  placeholder="e.g. David"
                  className={inpClass}
                />
              </div>

              <div>
                <label className={lblClass}>{t.lastName}</label>
                <TabAutocompleteInput
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  suggestions={nameSuggestions.lastNames}
                  list="lastnames-datalist"
                  placeholder="e.g. Chen"
                  className={inpClass}
                />
              </div>

              <div>
                <label className={lblClass}>{t.maidenName}</label>
                <TabAutocompleteInput
                  value={formData.maidenName}
                  onChange={e => setFormData({ ...formData, maidenName: e.target.value })}
                  suggestions={nameSuggestions.lastNames}
                  list="lastnames-datalist"
                  placeholder="Optional birth surname"
                  className={inpClass}
                />
              </div>
            </div>

            {/* Christian/Baptism Name & Patronymic/Matronymic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`${lblClass} flex items-center`}>
                  <Church className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  <span>{t.christianName}</span>
                </label>
                <TabAutocompleteInput
                  value={formData.christianName}
                  onChange={e => setFormData({ ...formData, christianName: e.target.value })}
                  suggestions={nameSuggestions.christianNames}
                  list="christiannames-datalist"
                  placeholder={t.christianNamePlaceholder}
                  className={inpClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lblClass}>
                    {t.patronymic}
                  </label>
                  {detectedFather && (
                    <button
                      type="button"
                      onClick={() => {
                        const fatherName = detectedFather.firstName || detectedFather.chineseName || '';
                        const prefix = formData.gender === 'female' ? 'binti' : 'bin';
                        const patVal = `${prefix} ${fatherName}`.trim();
                        setFormData(prev => ({
                          ...prev,
                          patronymic: patVal,
                          ...(!prev.lastName?.trim() || prev.lastName === prev.patronymic ? { lastName: patVal } : {})
                        }));
                      }}
                      className={isRetro ? "win98-btn px-2 py-0.5 text-[10px] font-bold text-black flex items-center space-x-1" : "text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"}
                      title={lang === 'zh' ? '根据已关联父亲自动生成父称' : 'Auto-generate patronymic from connected father'}
                    >
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>{formData.gender === 'female' ? 'binti' : 'bin'} {detectedFather.firstName || detectedFather.chineseName}</span>
                    </button>
                  )}
                </div>
                <TabAutocompleteInput
                  value={formData.patronymic}
                  onChange={e => {
                    const newPatronymic = e.target.value;
                    setFormData(prev => {
                      const isSurnameEmptyOrDerived = !prev.lastName?.trim() || prev.lastName === prev.patronymic;
                      return {
                        ...prev,
                        patronymic: newPatronymic,
                        ...(isSurnameEmptyOrDerived ? { lastName: newPatronymic } : {})
                      };
                    });
                  }}
                  onBlur={() => {
                    if (formData.patronymic?.trim() && !formData.lastName?.trim()) {
                      setFormData(prev => ({ ...prev, lastName: prev.patronymic.trim() }));
                    }
                  }}
                  suggestions={nameSuggestions.patronymics}
                  list="patronymics-datalist"
                  placeholder={t.patronymicPlaceholder}
                  className={inpClass}
                />
              </div>
            </div>

            {/* Chinese Name (Optional) & Ethnicity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`${lblClass} flex items-center`}>
                  <Globe className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  <span>{t.chineseName}</span>
                </label>
                <TabAutocompleteInput
                  value={formData.chineseName}
                  onChange={e => setFormData({ ...formData, chineseName: e.target.value })}
                  suggestions={nameSuggestions.chineseNames}
                  placeholder={lang === 'zh' ? '如：陈大卫、李美华 (选填)' : 'e.g. 陈大卫 (Optional)'}
                  className={isRetro ? "w-full px-2.5 py-1.5 win98-sunken bg-white text-blue-950 font-bold text-xs sm:text-sm focus:outline-none" : "w-full px-3 py-2 bg-slate-800/80 border border-amber-500/40 rounded-xl text-amber-100 text-sm focus:outline-none focus:border-amber-400 transition"}
                />
              </div>

              <div>
                <label className={lblClass}>{t.ethnicity}</label>
                <TabAutocompleteInput
                  value={formData.ethnicity}
                  onChange={e => setFormData({ ...formData, ethnicity: e.target.value })}
                  suggestions={ethnicitySuggestions}
                  list="ethnicities-datalist"
                  placeholder={t.ethnicityPlaceholder}
                  className={inpClass}
                />
              </div>
            </div>

            {/* Gender, Adoption Status, Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lblClass}>{t.gender}</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className={selClass}
                >
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                  <option value="other">{t.otherGender}</option>
                </select>
              </div>

              <div>
                <label className={lblClass}>{t.adoptionStatus}</label>
                <select
                  value={formData.adoptionStatus}
                  onChange={e => setFormData({ ...formData, adoptionStatus: e.target.value })}
                  className={selClass}
                >
                  <option value="biological">{t.biological}</option>
                  <option value="adopted">{t.adopted}</option>
                  <option value="foster">{t.foster}</option>
                  <option value="step">{t.step}</option>
                </select>
              </div>

              <div>
                <label className={lblClass}>{t.occupation}</label>
                <TabAutocompleteInput
                  value={formData.occupation}
                  onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                  suggestions={occupationSuggestions}
                  list="occupations-datalist"
                  placeholder="e.g. Architect, Professor"
                  className={inpClass}
                />
              </div>
            </div>

            {/* Avatar / Portrait Selection & Crop */}
            <div className={isRetro ? "win98-box p-3 bg-[#d4d0c8] text-black space-y-2.5" : "p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3"}>
              <div className="flex items-center justify-between">
                <span className={isRetro ? "text-xs font-bold text-black flex items-center" : "text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center"}>
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  <span>{lang === 'zh' ? '族人照片与肖像头像' : 'Member Avatar & Portrait'}</span>
                </span>
                {formData.avatar && (
                  <span className={isRetro ? "text-[11px] text-emerald-900 font-bold" : "text-[10px] text-emerald-400 font-normal"}>
                    {lang === 'zh' ? '✓ 已设定头像' : '✓ Avatar active'}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className={`w-20 h-20 overflow-hidden flex items-center justify-center ${
                    isRetro 
                      ? 'win98-sunken bg-white border border-gray-400 rounded' 
                      : 'rounded-full border-2 border-indigo-500/60 bg-slate-900 shadow-md'
                  }`}>
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className={`w-9 h-9 ${isRetro ? 'text-gray-500' : 'text-slate-600'}`} />
                    )}
                  </div>
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className={isRetro ? "win98-btn absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 bg-white" : "absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-md transition"}
                      title={lang === 'zh' ? '移除头像' : 'Remove Avatar'}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Action Buttons for Gallery, Crop, Local Upload */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGalleryPickerOpen(true)}
                      className={isRetro ? "win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center space-x-1" : "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition"}
                    >
                      <Images className="w-3.5 h-3.5 text-purple-700" />
                      <span>{lang === 'zh' ? '从画廊选择' : 'Choose from Gallery'}</span>
                    </button>

                    <label className={isRetro ? "win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center space-x-1 cursor-pointer" : "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition"}>
                      <Upload className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{lang === 'zh' ? '本地上传并裁剪' : 'Upload & Crop'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalAvatarUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={handleOpenCropperForCurrentAvatar}
                        className={isRetro ? "win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center space-x-1" : "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"}
                      >
                        <Crop className="w-3.5 h-3.5 text-indigo-700" />
                        <span>{lang === 'zh' ? '裁剪/缩放' : 'Crop / Adjust'}</span>
                      </button>
                    )}
                  </div>

                  {/* Manual URL input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://... (or choose from gallery / upload above)"
                      className={isRetro ? "w-full px-2 py-1 win98-sunken bg-white text-black text-xs font-mono focus:outline-none" : "w-full px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 transition font-mono"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vital Dates, Places & Burial Site (with Year-Only toggle) */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4 pt-4 border-t border-slate-800/80"}>
            <div className="flex items-center justify-between">
              <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center"}>
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <span>{t.vitalEvents}</span>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isLiving}
                  onChange={e => setFormData({ 
                    ...formData, 
                    isLiving: e.target.checked,
                    deathDate: e.target.checked ? '' : formData.deathDate,
                    deathPlace: e.target.checked ? '' : formData.deathPlace,
                    burialPlace: e.target.checked ? '' : formData.burialPlace
                  })}
                  className={isRetro ? "cursor-pointer" : "rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"}
                />
                <span className={isRetro ? "text-xs font-bold text-black" : "text-xs text-slate-300 font-medium"}>{t.isLiving}</span>
              </label>
            </div>

            {/* Birth Date / Year & Place */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lblClass}>{t.birthDate}</label>
                  <label className={isRetro ? "text-[11px] font-bold text-black hover:underline flex items-center space-x-1 cursor-pointer" : "text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"}>
                    <input
                      type="checkbox"
                      checked={formData.birthYearOnly}
                      onChange={e => {
                        const yearOnly = e.target.checked;
                        const currYear = extractYear(formData.birthDate);
                        setFormData({
                          ...formData,
                          birthYearOnly: yearOnly,
                          birthDate: yearOnly ? (currYear ? String(currYear) : '') : formData.birthDate
                        });
                      }}
                      className={isRetro ? "cursor-pointer" : "rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 text-xs"}
                    />
                    <span>{t.yearOnly}</span>
                  </label>
                </div>

                {formData.birthYearOnly ? (
                  <input
                    type="number"
                    min="1000"
                    max="2100"
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    placeholder="e.g. 1918 (Year only)"
                    className={inpClass}
                  />
                ) : (
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className={inpClass}
                  />
                )}
              </div>

              <div>
                <label className={lblClass}>{t.birthPlace}</label>
                <TabAutocompleteInput
                  value={formData.birthPlace}
                  onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                  suggestions={placeSuggestions}
                  list="places-datalist"
                  placeholder="e.g. Edinburgh, Scotland or Boston, MA"
                  className={inpClass}
                />
              </div>
            </div>

            {/* Death Date, Death Place, and Burial Site */}
            {!formData.isLiving && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={lblClass}>{t.deathDate}</label>
                      <label className={isRetro ? "text-[11px] font-bold text-rose-900 hover:underline flex items-center space-x-1 cursor-pointer" : "text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"}>
                        <input
                          type="checkbox"
                          checked={formData.deathYearOnly}
                          onChange={e => {
                            const yearOnly = e.target.checked;
                            const currYear = extractYear(formData.deathDate);
                            setFormData({
                              ...formData,
                              deathYearOnly: yearOnly,
                              deathDate: yearOnly ? (currYear ? String(currYear) : '') : formData.deathDate
                            });
                          }}
                          className={isRetro ? "cursor-pointer" : "rounded border-slate-700 text-rose-600 focus:ring-rose-500 text-xs"}
                        />
                        <span>{t.yearOnly}</span>
                      </label>
                    </div>

                    {formData.deathYearOnly ? (
                      <input
                        type="number"
                        min="1000"
                        max="2100"
                        value={formData.deathDate}
                        onChange={e => setFormData({ ...formData, deathDate: e.target.value })}
                        placeholder="e.g. 1994 (Year only)"
                        className={inpClass}
                      />
                    ) : (
                      <input
                        type="date"
                        value={formData.deathDate}
                        onChange={e => setFormData({ ...formData, deathDate: e.target.value })}
                        className={inpClass}
                      />
                    )}
                  </div>

                  <div>
                    <label className={lblClass}>{t.deathPlace}</label>
                    <TabAutocompleteInput
                      value={formData.deathPlace}
                      onChange={e => setFormData({ ...formData, deathPlace: e.target.value })}
                      suggestions={placeSuggestions}
                      list="places-datalist"
                      placeholder="e.g. Seattle, WA, USA"
                      className={inpClass}
                    />
                  </div>
                </div>

                {/* Burial Site / Cemetery */}
                <div>
                  <label className={`${lblClass} flex items-center`}>
                    <MapPin className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    <span>{t.burialSite}</span>
                  </label>
                  <TabAutocompleteInput
                    value={formData.burialPlace}
                    onChange={e => setFormData({ ...formData, burialPlace: e.target.value })}
                    suggestions={placeSuggestions}
                    list="places-datalist"
                    placeholder={t.burialSitePlaceholder}
                    className={inpClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Religions & Faith History */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4 pt-4 border-t border-slate-800/80"}>
            <div className="flex items-center justify-between">
              <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center"}>
                <Church className="w-3.5 h-3.5 mr-1.5" />
                <span>{t.religions}</span>
              </div>
              <button
                type="button"
                onClick={handleAddReligion}
                className={isRetro ? "win98-btn px-2.5 py-0.5 text-xs font-bold text-black flex items-center space-x-1" : "text-xs text-amber-400 hover:text-amber-300 flex items-center font-medium"}
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-800" />
                <span>{t.addReligion}</span>
              </button>
            </div>

            {/* Quick Auto-Type Religion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
              <span className={isRetro ? "text-[11px] font-bold text-black mr-1 flex items-center" : "text-[11px] text-slate-400 mr-1 flex items-center"}>
                <Zap className="w-3 h-3 mr-0.5 text-amber-600" />
                <span>{lang === 'zh' ? '快速填选:' : 'Quick Select:'}</span>
              </span>
              {['Catholicism', 'Momolianism', 'Islam', 'Christianity', 'Protestantism', 'Buddhism', 'Taoism', 'Seventh-day Adventist'].map(rel => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => handleAddReligionWithName(rel)}
                  className={isRetro ? "win98-btn px-2 py-0.5 text-[11px] font-bold text-black flex items-center space-x-1" : "px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center space-x-1"}
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{rel}</span>
                </button>
              ))}
            </div>

            {formData.religions.length === 0 ? (
              <p className={isRetro ? "text-xs text-gray-800 italic font-semibold p-2 win98-sunken bg-white" : "text-xs text-slate-500 italic"}>
                {lang === 'zh' ? '暂未添加宗教信仰记录。点击上方快捷按钮或右上角“添加宗教信仰”可记录信仰起止年与临终皈依。' : 'No religious records yet. Click a quick pill above or "+ Add Religion Record" to specify faith dates or deathbed conversion.'}
              </p>
            ) : (
              <div className="space-y-3">
                {formData.religions.map((relig, idx) => (
                  <div 
                    key={relig.id || idx} 
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                    className={isRetro ? "p-3 win98-sunken bg-white text-black space-y-2 border-2 border-gray-400" : "p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-2">
                        <TabAutocompleteInput
                          value={relig.name}
                          onChange={e => handleUpdateReligion(idx, 'name', e.target.value)}
                          suggestions={allReligionsList}
                          list="religions-global-datalist"
                          placeholder="Religion (e.g. Catholicism, Momolianism, Islam, Protestantism...)"
                          className={inpClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReligion(idx)}
                        className={isRetro ? "win98-btn px-2 py-1 text-xs font-bold text-rose-800 shrink-0" : "text-slate-500 hover:text-rose-400 p-1 shrink-0"}
                        title={lang === 'zh' ? '删除' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className={isRetro ? "text-[11px] font-bold text-black block mb-0.5" : "text-[11px] text-slate-400 block mb-0.5"}>{t.fromYearOrDate}</label>
                        <input
                          type="text"
                          value={relig.startDate}
                          onChange={e => handleUpdateReligion(idx, 'startDate', e.target.value)}
                          placeholder="e.g. 1950 or 1950-05-12 or Birth"
                          className={inpClass}
                        />
                      </div>
                      <div>
                        <label className={isRetro ? "text-[11px] font-bold text-black block mb-0.5" : "text-[11px] text-slate-400 block mb-0.5"}>{t.toYearOrDate}</label>
                        <input
                          type="text"
                          value={relig.endDate}
                          onChange={e => handleUpdateReligion(idx, 'endDate', e.target.value)}
                          placeholder="e.g. 1985 or Death or Present"
                          className={inpClass}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSetFinalReligion(idx)}
                        className={isRetro 
                          ? (relig.isFinal ? "win98-btn px-2.5 py-1 text-xs font-black text-blue-900 bg-blue-100 flex items-center space-x-1" : "win98-btn px-2.5 py-1 text-xs font-bold text-black flex items-center space-x-1")
                          : `flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            relig.isFinal
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`
                        }
                        title={lang === 'zh' ? '点击切换：标记为此族人当前或终生最终信奉的宗教（统计时计入）' : 'Click to toggle: set as final or current practiced faith for statistics'}
                      >
                        <Check className={`w-3.5 h-3.5 ${isRetro ? (relig.isFinal ? 'text-blue-900' : 'text-gray-600') : (relig.isFinal ? 'text-amber-400' : 'text-slate-500')}`} />
                        <span>{t.setAsFinalReligion || 'Final Practiced Religion'}</span>
                      </button>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={relig.isDeathbedConversion}
                          onChange={e => handleUpdateReligion(idx, 'isDeathbedConversion', e.target.checked)}
                          className={isRetro ? "cursor-pointer" : "rounded border-slate-700 text-amber-500 focus:ring-amber-400"}
                        />
                        <span className={isRetro ? "text-xs text-black font-bold" : "text-xs text-amber-300 font-medium"}>
                          {t.deathbedConversion}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Family Connections: Remarriage, Plural Marriage, Ex-Partners */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4 pt-4 border-t border-slate-800/80"}>
            <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-pink-400 flex items-center"}>
              <Heart className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.familyConnections}</span>
            </div>

            {/* Parents Multi-Select */}
            <div>
              <label className={lblClass}>{t.parents}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.parents || []).map(parentId => {
                  const p = allPersons.find(item => item.id === parentId);
                  return (
                    <span key={parentId} className={isRetro ? "win98-box px-2.5 py-1 bg-[#d4d0c8] text-black text-xs font-bold inline-flex items-center space-x-1" : "inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30"}>
                      <span>{formatFullName(p, lang)}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, parents: (prev.parents || []).filter(id => id !== parentId) }))}
                        className={isRetro ? "win98-btn px-1 ml-1 text-[10px] font-bold text-rose-800" : "ml-1.5 hover:text-white"}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Typeahead Search for Parents */}
              <div className="relative mb-2">
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 pointer-events-none z-10 ${isRetro ? 'text-gray-600' : 'text-slate-400'}`} />
                  <TabAutocompleteInput
                    value={parentSearchQuery}
                    onChange={e => setParentSearchQuery(e.target.value)}
                    suggestions={filteredParentCandidates.map(p => formatFullName(p, lang))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAttachParentFromQuery();
                      }
                    }}
                    placeholder={lang === 'zh' ? '输入姓名快速搜索并添加父母...' : 'Type name to search & attach parent...'}
                    className={isRetro ? "w-full pl-8 pr-7 py-1.5 win98-sunken bg-white text-black text-xs font-semibold focus:outline-none" : "w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"}
                  />
                  {parentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setParentSearchQuery('')}
                      className={isRetro ? "absolute right-2.5 top-1.5 text-xs font-bold text-gray-700 hover:text-black z-20" : "absolute right-2.5 top-2 text-slate-400 hover:text-white z-20"}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {filteredParentCandidates.length > 0 && (
                  <div className={isRetro ? "absolute top-full left-0 right-0 mt-1 win98-box bg-white text-black z-20 overflow-hidden divide-y divide-gray-300 shadow-xl" : "absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-800"}>
                    {filteredParentCandidates.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, parents: [...(prev.parents || []), p.id] }));
                          setParentSearchQuery('');
                        }}
                        className={isRetro ? "w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white text-xs text-black flex items-center justify-between transition" : "w-full text-left px-3 py-2 hover:bg-indigo-600/20 text-xs text-slate-200 hover:text-white flex items-center justify-between transition"}
                      >
                        <span className="font-bold">{formatFullName(p, lang)}</span>
                        <span className={isRetro ? "text-[11px] opacity-80" : "text-[11px] text-slate-400"}>({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')}, {getLifespan(p, lang)})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value=""
                onChange={e => {
                  if (e.target.value && !(formData.parents || []).includes(e.target.value)) {
                    setFormData(prev => ({ ...prev, parents: [...(prev.parents || []), e.target.value] }));
                  }
                }}
                className={selClass}
              >
                <option value="">+ {lang === 'zh' ? '或从下拉列表中选择父母...' : 'Or select parent from dropdown...'}</option>
                {availablePersons.filter(p => !(formData.parents || []).includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{formatFullName(p, lang)} ({p.gender || '?'})</option>
                ))}
              </select>
            </div>

            {/* Spouses & Partners with Remarriage & Plural Marriage support */}
            <div>
              <label className={lblClass}>{t.spousesAndPartners}</label>
              
              {(formData.spouses || []).length > 0 && (
                <div className="space-y-2 mb-3">
                  {(formData.spouses || []).map(spouseId => {
                    const s = allPersons.find(item => item.id === spouseId) || newSpousesToCreate.find(item => item.id === spouseId);
                    const partnerDetails = (formData.partnerDetails && typeof formData.partnerDetails === 'object') ? formData.partnerDetails : {};
                    const partnerDetail = partnerDetails[spouseId] || {};
                    const currentStatus = partnerDetail.status || 'spouse';
                    const isDeceased = s ? !s.isLiving : (partnerDetail.marriageState === 'death');
                    const marriageState = partnerDetail.marriageState || (isDeceased ? 'death' : 'current');
                    const partnerNotes = partnerDetail.notes || '';

                    return (
                      <div key={spouseId} className={isRetro ? "p-3 win98-sunken bg-white text-black space-y-2 border-2 border-gray-400" : "p-3.5 rounded-xl bg-slate-950/70 border border-pink-500/30 space-y-2.5"}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-pink-600 shrink-0" />
                            <div>
                              <span className={isRetro ? "text-xs font-black text-black" : "text-xs font-bold text-white"}>{formatFullName(s, lang)}</span>
                              <span className={isRetro ? "text-[11px] text-gray-700 ml-2 font-semibold" : "text-[11px] text-slate-400 ml-2"}>({getLifespan(s, lang)})</span>
                              {marriageState === 'death' ? (
                                <span className={isRetro ? "ml-2 text-[10px] px-1.5 py-0.2 bg-neutral-200 text-black border border-neutral-400 rounded font-bold" : "ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"}>
                                  {lang === 'zh' ? '已故' : 'Deceased'}
                                </span>
                              ) : (
                                <span className={isRetro ? "ml-2 text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-950 border border-emerald-500 rounded font-bold" : "ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}>
                                  {lang === 'zh' ? '健在/现任' : 'Current / Living'}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSpouse(spouseId)}
                            className={isRetro ? "win98-btn px-2 py-0.5 text-xs font-bold text-rose-800" : "p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"}
                            title={t.cancel}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Spouse controls grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>
                              {t.marriageOrderForPerson}
                            </label>
                            <select
                              value={currentStatus}
                              onChange={e => handlePartnerFieldChange(spouseId, 'status', e.target.value)}
                              className={selClass}
                            >
                              <option value="spouse">{t.currentSpouse}</option>
                              <option value="first_spouse">{t.firstSpouse}</option>
                              <option value="second_spouse">{t.secondSpouse}</option>
                              <option value="third_spouse">{t.thirdSpouse}</option>
                              <option value="remarriage_after_death">{t.remarriageAfterDeath || t.remarriage}</option>
                              <option value="polygamous">{t.polygamous}</option>
                              <option value="ex_spouse">{t.exSpouse}</option>
                              <option value="partner">{t.currentPartner}</option>
                              <option value="ex_partner">{t.exPartner}</option>
                            </select>
                          </div>

                          <div>
                            <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>
                              {t.spouseStatus} (Death / Current)
                            </label>
                            <select
                              value={marriageState}
                              onChange={e => handlePartnerFieldChange(spouseId, 'marriageState', e.target.value)}
                              className={selClass}
                            >
                              <option value="current">{t.statusCurrent}</option>
                              <option value="death">{t.statusDeath}</option>
                              <option value="divorce">{t.statusDivorce}</option>
                            </select>
                          </div>
                        </div>

                        {/* Marriage Date / Year & Place */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5 flex items-center" : "block text-[11px] text-slate-400 mb-1 flex items-center"}>
                              <Calendar className="w-3 h-3 mr-1 text-pink-600" />
                              <span>{t.marriageDateOrYear || 'Marriage Date / Year'}</span>
                            </label>
                            <input
                              type="text"
                              value={partnerDetail.marriageDate || partnerDetail.marriageYear || ''}
                              onChange={e => {
                                handlePartnerFieldChange(spouseId, 'marriageDate', e.target.value);
                                handlePartnerFieldChange(spouseId, 'marriageYear', e.target.value);
                              }}
                              placeholder={t.marriageDatePlaceholder || 'e.g. 1965 or 1965-06-12'}
                              className={inpClass}
                            />
                          </div>

                          <div>
                            <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5 flex items-center" : "block text-[11px] text-slate-400 mb-1 flex items-center"}>
                              <MapPin className="w-3 h-3 mr-1 text-slate-600" />
                              <span>{t.marriagePlace || 'Marriage Place'}</span>
                            </label>
                            <TabAutocompleteInput
                              value={partnerDetail.marriagePlace || partnerDetail.place || ''}
                              onChange={e => handlePartnerFieldChange(spouseId, 'marriagePlace', e.target.value)}
                              suggestions={placeSuggestions}
                              list="places-datalist"
                              placeholder={lang === 'zh' ? '如：圣米迦勒教堂 / 兵南邦' : 'e.g. St. Michael Church / Penampang'}
                              className={inpClass}
                            />
                          </div>
                        </div>

                        {/* Optional notes */}
                        <div>
                          <input
                            type="text"
                            value={partnerNotes}
                            onChange={e => handlePartnerFieldChange(spouseId, 'notes', e.target.value)}
                            placeholder={lang === 'zh' ? '婚姻备注（例如：前妻Annie去世后于1965年续弦再婚；白头偕老至其去世）' : 'Marriage notes (e.g. Married after Annie passed away; first husband until death)'}
                            className={inpClass}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons: Create New Spouse Profile OR Link Existing Member */}
              {!isCreatingSpouseInline ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const oppositeGender = formData.gender === 'female' ? 'male' : 'female';
                        const defaultOrder = 'spouse';
                        setInlineSpouse({
                          firstName: '',
                          lastName: formData.lastName || '',
                          chineseName: '',
                          gender: oppositeGender,
                          isLiving: true,
                          birthDate: '',
                          deathDate: '',
                          burialPlace: '',
                          status: defaultOrder,
                          marriageState: 'current',
                          marriageDate: '',
                          marriagePlace: '',
                          notes: ''
                        });
                        setIsCreatingSpouseInline(true);
                      }}
                      className={isRetro ? "win98-btn py-1.5 px-3 text-xs font-bold text-black flex items-center justify-center space-x-1.5 w-full bg-[#d4d0c8]" : "flex-1 py-2 px-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"}
                    >
                      <Plus className="w-4 h-4 text-pink-600" />
                      <span>{lang === 'zh' ? '+ 新建配偶档案并关联 (如Annie/Darmih)' : '+ Create New Spouse & Link'}</span>
                    </button>
                  </div>

                  {/* Typeahead Search for Spouses */}
                  <div className="relative">
                    <div className="relative">
                      <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 pointer-events-none z-10 ${isRetro ? 'text-gray-600' : 'text-slate-400'}`} />
                      <TabAutocompleteInput
                        value={spouseSearchQuery}
                        onChange={e => setSpouseSearchQuery(e.target.value)}
                        suggestions={filteredSpouseCandidates.map(p => formatFullName(p, lang))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAttachSpouseFromQuery();
                          }
                        }}
                        placeholder={lang === 'zh' ? '输入姓名快速搜索已有族人并关联为配偶...' : 'Type name to search & attach existing spouse...'}
                        className={isRetro ? "w-full pl-8 pr-7 py-1.5 win98-sunken bg-white text-black text-xs font-semibold focus:outline-none" : "w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-pink-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500 transition"}
                      />
                      {spouseSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSpouseSearchQuery('')}
                          className={isRetro ? "absolute right-2.5 top-1.5 text-xs font-bold text-gray-700 hover:text-black z-20" : "absolute right-2.5 top-2 text-slate-400 hover:text-white z-20"}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {filteredSpouseCandidates.length > 0 && (
                      <div className={isRetro ? "absolute top-full left-0 right-0 mt-1 win98-box bg-white text-black z-20 overflow-hidden divide-y divide-gray-300 shadow-xl" : "absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-800"}>
                        {filteredSpouseCandidates.map(p => {
                          const defaultOrder = 'spouse';
                          const isDeceased = !p.isLiving;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  spouses: [...(prev.spouses || []), p.id],
                                  partnerDetails: {
                                    ...(prev.partnerDetails || {}),
                                    [p.id]: {
                                      status: defaultOrder,
                                      marriageState: isDeceased ? 'death' : 'current',
                                      notes: ''
                                    }
                                  }
                                }));
                                setSpouseSearchQuery('');
                              }}
                              className={isRetro ? "w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white text-xs text-black flex items-center justify-between transition" : "w-full text-left px-3 py-2 hover:bg-pink-600/20 text-xs text-slate-200 hover:text-white flex items-center justify-between transition"}
                            >
                              <span className="font-bold">{formatFullName(p, lang)}</span>
                              <span className={isRetro ? "text-[11px] opacity-80" : "text-[11px] text-slate-400"}>({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')}, {getLifespan(p, lang)})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value && !(formData.spouses || []).includes(e.target.value)) {
                        const newSpouseId = e.target.value;
                        const spouseObj = allPersons.find(p => p.id === newSpouseId);
                        const isDeceased = spouseObj ? !spouseObj.isLiving : false;
                        const defaultOrder = 'spouse';
                        setFormData(prev => ({
                          ...prev,
                          spouses: [...(prev.spouses || []), newSpouseId],
                          partnerDetails: {
                            ...(prev.partnerDetails || {}),
                            [newSpouseId]: {
                              status: defaultOrder,
                              marriageState: isDeceased ? 'death' : 'current',
                              notes: ''
                            }
                          }
                        }));
                      }
                    }}
                    className={selClass}
                  >
                    <option value="">+ {lang === 'zh' ? '或从已有族人下拉列表中选择...' : 'Or select existing member from dropdown...'}</option>
                    {availablePersons.filter(p => !(formData.spouses || []).includes(p.id)).map(p => (
                      <option key={p.id} value={p.id}>{formatFullName(p, lang)} ({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')})</option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Inline Create Spouse Card */
                <div 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmCreateInlineSpouse();
                    }
                  }}
                  className={isRetro ? "p-3.5 win98-box bg-[#c0c0c0] text-black space-y-3" : "p-3.5 rounded-xl bg-slate-900 border border-pink-500/40 space-y-3 animate-in fade-in-50 duration-150"}
                >
                  <div className={`flex items-center justify-between pb-2 border-b ${isRetro ? 'border-gray-400' : 'border-slate-800'}`}>
                    <span className={isRetro ? "text-xs font-bold text-black flex items-center" : "text-xs font-bold text-pink-300 flex items-center"}>
                      <Heart className="w-3.5 h-3.5 mr-1.5 text-pink-600" />
                      <span>{lang === 'zh' ? '新建配偶档案并建立关联' : 'Create & Link New Spouse'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpouseInline(false)}
                      className={isRetro ? "win98-btn px-2 py-0.5 text-xs font-bold text-black" : "text-slate-400 hover:text-white"}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.firstName} *</label>
                      <TabAutocompleteInput
                        value={inlineSpouse.firstName}
                        onChange={e => setInlineSpouse(s => ({ ...s, firstName: e.target.value }))}
                        suggestions={nameSuggestions.firstNames}
                        list="firstnames-datalist"
                        placeholder={lang === 'zh' ? '例如：Annie 或 Darmih' : 'e.g. Annie or Darmih'}
                        className={inpClass}
                      />
                    </div>
                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.lastName}</label>
                      <TabAutocompleteInput
                        value={inlineSpouse.lastName}
                        onChange={e => setInlineSpouse(s => ({ ...s, lastName: e.target.value }))}
                        suggestions={nameSuggestions.lastNames}
                        list="lastnames-datalist"
                        className={inpClass}
                      />
                    </div>
                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.chineseName}</label>
                      <TabAutocompleteInput
                        value={inlineSpouse.chineseName}
                        onChange={e => setInlineSpouse(s => ({ ...s, chineseName: e.target.value }))}
                        suggestions={nameSuggestions.chineseNames}
                        placeholder="中文全名"
                        className={inpClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.gender}</label>
                      <select
                        value={inlineSpouse.gender}
                        onChange={e => setInlineSpouse(s => ({ ...s, gender: e.target.value }))}
                        className={selClass}
                      >
                        <option value="female">{t.female}</option>
                        <option value="male">{t.male}</option>
                      </select>
                    </div>

                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.isLiving}</label>
                      <select
                        value={inlineSpouse.isLiving ? 'true' : 'false'}
                        onChange={e => {
                          const isLiving = e.target.value === 'true';
                          setInlineSpouse(s => ({
                            ...s,
                            isLiving,
                            marriageState: isLiving ? 'current' : 'death'
                          }));
                        }}
                        className={selClass}
                      >
                        <option value="true">{t.livingMember}</option>
                        <option value="false">{t.passedMember}</option>
                      </select>
                    </div>

                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.marriageOrderForPerson}</label>
                      <select
                        value={inlineSpouse.status || 'spouse'}
                        onChange={e => setInlineSpouse(s => ({ ...s, status: e.target.value }))}
                        className={selClass}
                      >
                        <option value="spouse">{t.currentSpouse}</option>
                        <option value="first_spouse">{t.firstSpouse}</option>
                        <option value="second_spouse">{t.secondSpouse}</option>
                        <option value="third_spouse">{t.thirdSpouse}</option>
                        <option value="remarriage_after_death">{t.remarriageAfterDeath || t.remarriage}</option>
                        <option value="polygamous">{t.polygamous}</option>
                        <option value="ex_spouse">{t.exSpouse}</option>
                        <option value="partner">{t.currentPartner}</option>
                        <option value="ex_partner">{t.exPartner}</option>
                      </select>
                    </div>

                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.spouseStatus}</label>
                      <select
                        value={inlineSpouse.marriageState}
                        onChange={e => setInlineSpouse(s => ({ ...s, marriageState: e.target.value }))}
                        className={selClass}
                      >
                        <option value="current">{t.statusCurrent}</option>
                        <option value="death">{t.statusDeath}</option>
                        <option value="divorce">{t.statusDivorce}</option>
                      </select>
                    </div>
                  </div>

                  {!inlineSpouse.isLiving && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.deathDate}</label>
                        <input
                          type="text"
                          value={inlineSpouse.deathDate}
                          onChange={e => setInlineSpouse(s => ({ ...s, deathDate: e.target.value }))}
                          placeholder="YYYY 或 YYYY-MM-DD"
                          className={inpClass}
                        />
                      </div>
                      <div>
                        <label className={isRetro ? "block text-[11px] font-bold text-black mb-1" : "block text-[11px] text-slate-400 mb-1"}>{t.burialSite}</label>
                        <TabAutocompleteInput
                          value={inlineSpouse.burialPlace}
                          onChange={e => setInlineSpouse(s => ({ ...s, burialPlace: e.target.value }))}
                          suggestions={placeSuggestions}
                          list="places-datalist"
                          placeholder={lang === 'zh' ? '墓地 / 墓园地穴' : 'Cemetery / Burial site'}
                          className={inpClass}
                        />
                      </div>
                    </div>
                  )}

                  {/* Marriage Date / Year & Place */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1 flex items-center" : "block text-[11px] text-slate-400 mb-1 flex items-center"}>
                        <Calendar className="w-3 h-3 mr-1 text-pink-600" />
                        <span>{t.marriageDateOrYear || 'Marriage Date / Year'}</span>
                      </label>
                      <input
                        type="text"
                        value={inlineSpouse.marriageDate || ''}
                        onChange={e => setInlineSpouse(s => ({ ...s, marriageDate: e.target.value }))}
                        placeholder={t.marriageDatePlaceholder || 'e.g. 1965 or 1965-06-12'}
                        className={inpClass}
                      />
                    </div>

                    <div>
                      <label className={isRetro ? "block text-[11px] font-bold text-black mb-1 flex items-center" : "block text-[11px] text-slate-400 mb-1 flex items-center"}>
                        <MapPin className="w-3 h-3 mr-1 text-slate-600" />
                        <span>{t.marriagePlace || 'Marriage Place'}</span>
                      </label>
                      <TabAutocompleteInput
                        value={inlineSpouse.marriagePlace || ''}
                        onChange={e => setInlineSpouse(s => ({ ...s, marriagePlace: e.target.value }))}
                        suggestions={placeSuggestions}
                        list="places-datalist"
                        placeholder={lang === 'zh' ? '如：圣米迦勒教堂 / 兵南邦' : 'e.g. St. Michael Church / Penampang'}
                        className={inpClass}
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={inlineSpouse.notes}
                      onChange={e => setInlineSpouse(s => ({ ...s, notes: e.target.value }))}
                      placeholder={lang === 'zh' ? '婚姻备注（例如：前妻去世后于1965年续弦再娶；或第一任丈夫）' : 'Marriage notes (e.g. Married after first wife passed away)'}
                      className={inpClass}
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpouseInline(false)}
                      className={isRetro ? "win98-btn px-3 py-1 text-xs font-bold text-black" : "px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"}
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCreateInlineSpouse}
                      className={isRetro ? "win98-btn px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] flex items-center space-x-1" : "px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white transition flex items-center space-x-1"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '确认并关联' : 'Confirm & Link'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Children Multi-Select */}
            <div>
              <label className={lblClass}>{t.children}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.children || []).map(childId => {
                  const c = allPersons.find(item => item.id === childId);
                  return (
                    <span key={childId} className={isRetro ? "win98-box px-2.5 py-1 bg-[#d4d0c8] text-black text-xs font-bold inline-flex items-center space-x-1" : "inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30"}>
                      <span>{formatFullName(c, lang)}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, children: (prev.children || []).filter(id => id !== childId) }))}
                        className={isRetro ? "win98-btn px-1 ml-1 text-[10px] font-bold text-rose-800" : "ml-1.5 hover:text-white"}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Typeahead Search for Children */}
              <div className="relative mb-2">
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 pointer-events-none z-10 ${isRetro ? 'text-gray-600' : 'text-slate-400'}`} />
                  <TabAutocompleteInput
                    value={childSearchQuery}
                    onChange={e => setChildSearchQuery(e.target.value)}
                    suggestions={filteredChildCandidates.map(p => formatFullName(p, lang))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAttachChildFromQuery();
                      }
                    }}
                    placeholder={lang === 'zh' ? '输入姓名快速搜索并添加子女...' : 'Type name to search & attach child...'}
                    className={isRetro ? "w-full pl-8 pr-7 py-1.5 win98-sunken bg-white text-black text-xs font-semibold focus:outline-none" : "w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"}
                  />
                  {childSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setChildSearchQuery('')}
                      className={isRetro ? "absolute right-2.5 top-1.5 text-xs font-bold text-gray-700 hover:text-black z-20" : "absolute right-2.5 top-2 text-slate-400 hover:text-white z-20"}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {filteredChildCandidates.length > 0 && (
                  <div className={isRetro ? "absolute top-full left-0 right-0 mt-1 win98-box bg-white text-black z-20 overflow-hidden divide-y divide-gray-300 shadow-xl" : "absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-800"}>
                    {filteredChildCandidates.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, children: [...(prev.children || []), p.id] }));
                          setChildSearchQuery('');
                        }}
                        className={isRetro ? "w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white text-xs text-black flex items-center justify-between transition" : "w-full text-left px-3 py-2 hover:bg-emerald-600/20 text-xs text-slate-200 hover:text-white flex items-center justify-between transition"}
                      >
                        <span className="font-bold">{formatFullName(p, lang)}</span>
                        <span className={isRetro ? "text-[11px] opacity-80" : "text-[11px] text-slate-400"}>({p.gender === 'female' ? (lang === 'zh' ? '女' : 'Female') : (lang === 'zh' ? '男' : 'Male')}, {getLifespan(p, lang)})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value=""
                onChange={e => {
                  if (e.target.value && !(formData.children || []).includes(e.target.value)) {
                    setFormData(prev => ({ ...prev, children: [...(prev.children || []), e.target.value] }));
                  }
                }}
                className={selClass}
              >
                <option value="">+ {lang === 'zh' ? '或从子女下拉列表中选择...' : 'Or select child from dropdown...'}</option>
                {availablePersons.filter(p => !(formData.children || []).includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{formatFullName(p, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Biography & Tags */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4 pt-4 border-t border-slate-800/80"}>
            <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center"}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>{t.notesAndTags}</span>
            </div>

            <div>
              <label className={lblClass}>{t.biography}</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Key biographical highlights, immigration story, military service, achievements..."
                className={isRetro ? "w-full px-2.5 py-1.5 win98-sunken bg-white text-black font-medium text-xs sm:text-sm focus:outline-none" : "w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition"}
              />
            </div>

            <div>
              <label className={lblClass}>Tags / 标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className={isRetro ? "win98-box px-2.5 py-1 bg-[#d4d0c8] text-black text-xs font-bold inline-flex items-center space-x-1" : "inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700"}>
                    <Tag className={`w-3 h-3 mr-1 ${isRetro ? 'text-black' : 'text-indigo-400'}`} />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={isRetro ? "win98-btn px-1 ml-1 text-[10px] font-bold text-rose-800" : "ml-1.5 hover:text-rose-400"}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <TabAutocompleteInput
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  suggestions={allTagsList}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder={lang === 'zh' ? '例如：移民、老兵、学者 (按Tab补全，回车添加)' : 'e.g. Immigrant, Veteran, Scholar (Tab to complete, Enter to add)'}
                  className={inpClass}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={isRetro ? "win98-btn px-4 py-1 text-xs font-bold text-black" : "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition"}
                >
                  {lang === 'zh' ? '添加' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Historical References & Sources Section */}
          <div className={isRetro ? "win98-box p-3 bg-[#c0c0c0] text-black space-y-3" : "space-y-4 pt-4 border-t border-slate-800/80"}>
            <div>
              <div className={isRetro ? "win98-title-navy px-2.5 py-1 text-xs font-bold text-white flex items-center select-none" : "text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center"}>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                <span>{t.references}</span>
              </div>
              <p className={isRetro ? "text-[11px] text-gray-800 font-semibold mt-1" : "text-[11px] text-slate-400 mt-0.5"}>{t.referencesDesc}</p>
            </div>

            {/* Existing References List */}
            {formData.references && formData.references.length > 0 && (
              <div className="space-y-2">
                {formData.references.map((ref, idx) => {
                  const typeLabels = {
                    doc: t.refDoc,
                    census: t.refCensus,
                    cemetery: t.refCemetery,
                    article: t.refArticle,
                    audio: t.refAudio,
                    other: t.refOther
                  };
                  return (
                    <div key={ref.id || idx} className={isRetro ? "p-2.5 win98-sunken bg-white text-black flex items-start justify-between gap-2 border border-gray-400" : "p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start justify-between gap-2"}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={isRetro ? "text-xs font-bold text-black truncate" : "text-xs font-medium text-slate-200 truncate"}>{ref.title || 'Citation'}</span>
                          <span className={isRetro ? "text-[10px] px-1.5 py-0.2 bg-[#d4d0c8] text-black border border-gray-500 font-bold" : "text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"}>
                            {typeLabels[ref.type] || ref.type || t.refDoc}
                          </span>
                        </div>
                        {ref.url && (
                          <div className="text-[11px] truncate mt-0.5">
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className={isRetro ? "text-blue-900 font-bold hover:underline flex items-center space-x-1" : "hover:underline flex items-center space-x-1 text-indigo-400"}>
                              <span>{ref.url}</span>
                              <ExternalLink className="w-3 h-3 inline shrink-0" />
                            </a>
                          </div>
                        )}
                        {ref.notes && (
                          <div className={isRetro ? "text-[11px] text-gray-700 font-semibold italic mt-0.5" : "text-[11px] text-slate-400 italic mt-0.5"}>"{ref.notes}"</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(ref.id)}
                        className={isRetro ? "win98-btn px-2 py-0.5 text-xs font-bold text-rose-800 shrink-0" : "p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition shrink-0"}
                        title={lang === 'zh' ? '移除此引用' : 'Remove citation'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Reference Sub-form */}
            <div 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newRef.title.trim() || newRef.url.trim()) {
                    handleAddReference();
                  }
                }
              }}
              className={isRetro ? "p-3 win98-box bg-[#d4d0c8] text-black space-y-2" : "p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"}
            >
              <div className={isRetro ? "text-xs font-bold text-black flex items-center space-x-1" : "text-xs font-semibold text-slate-300 flex items-center space-x-1"}>
                <Plus className="w-3.5 h-3.5 text-emerald-800" />
                <span>{t.addReference}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>{t.refTitle}</label>
                  <input
                    type="text"
                    value={newRef.title}
                    onChange={e => setNewRef({ ...newRef, title: e.target.value })}
                    placeholder="e.g. 1911 Census / Sabah Land Title"
                    className={inpClass}
                  />
                </div>
                <div>
                  <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>{t.refType}</label>
                  <select
                    value={newRef.type}
                    onChange={e => setNewRef({ ...newRef, type: e.target.value })}
                    className={selClass}
                  >
                    <option value="doc">{t.refDoc}</option>
                    <option value="census">{t.refCensus}</option>
                    <option value="cemetery">{t.refCemetery}</option>
                    <option value="article">{t.refArticle}</option>
                    <option value="audio">{t.refAudio}</option>
                    <option value="other">{t.refOther}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>{t.refUrl}</label>
                <input
                  type="url"
                  value={newRef.url}
                  onChange={e => setNewRef({ ...newRef, url: e.target.value })}
                  placeholder="https://familysearch.org/... or https://..."
                  className={inpClass}
                />
              </div>
              <div>
                <label className={isRetro ? "block text-[11px] font-bold text-black mb-0.5" : "block text-[11px] text-slate-400 mb-1"}>{t.refNotes}</label>
                <input
                  type="text"
                  value={newRef.notes}
                  onChange={e => setNewRef({ ...newRef, notes: e.target.value })}
                  placeholder="e.g. Page 42, Entry #104; archived at National Archives"
                  className={inpClass}
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddReference}
                  disabled={!newRef.title.trim() && !newRef.url.trim()}
                  className={isRetro ? "win98-btn px-3 py-1 text-xs font-bold text-black flex items-center space-x-1 disabled:opacity-40" : "px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addReference}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={`pt-4 flex items-center justify-end space-x-3 ${
            theme === 'win98' ? 'border-t border-gray-400' : 'border-t border-slate-800'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={theme === 'win98'
                ? 'win98-btn px-4 py-1 text-xs font-bold text-black'
                : 'px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition'
              }
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className={theme === 'win98'
                ? 'win98-btn px-6 py-1 text-xs font-extrabold flex items-center space-x-1.5 text-black bg-[#d4d0c8]'
                : 'flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/30'
              }
            >
              <Save className="w-4 h-4 text-emerald-800" />
              <span>{theme === 'win98' ? (lang === 'zh' ? '确定保存 (OK)' : 'OK / Save') : t.saveAndSync}</span>
            </button>
          </div>

          {/* Autotyping Datalists for Global Suggestions */}
          <datalist id="religions-global-datalist">
            {allReligionsList.map(r => <option key={r} value={r} />)}
          </datalist>
          <datalist id="firstnames-datalist">
            {nameSuggestions.firstNames.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="lastnames-datalist">
            {nameSuggestions.lastNames.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="christiannames-datalist">
            {nameSuggestions.christianNames.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="patronymics-datalist">
            {nameSuggestions.patronymics.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="places-datalist">
            {placeSuggestions.map(p => <option key={p} value={p} />)}
          </datalist>
          <datalist id="ethnicities-datalist">
            {ethnicitySuggestions.map(e => <option key={e} value={e} />)}
          </datalist>
          <datalist id="occupations-datalist">
            {occupationSuggestions.map(o => <option key={o} value={o} />)}
          </datalist>
        </form>

        {/* Gallery Photo Picker Modal */}
        <GalleryPhotoPickerModal
          isOpen={isGalleryPickerOpen}
          onClose={() => setIsGalleryPickerOpen(false)}
          photos={photos}
          currentPersonId={initialData?.id}
          onSelectPhoto={handleSelectFromGallery}
          onSelectAndCrop={handleSelectAndCropFromGallery}
          lang={lang}
        />

        {/* Image Cropper Modal */}
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          lang={lang}
        />
      </div>
    </div>
  );
}
