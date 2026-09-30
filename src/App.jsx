import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import FamilyTreeVisualizer from './components/FamilyTreeVisualizer';
import GenealogyExplorer from './components/GenealogyExplorer';
import PeopleDirectory from './components/PeopleDirectory';
import TimelineView from './components/TimelineView';
import StatsDashboard from './components/StatsDashboard';
import PersonDetailDrawer from './components/PersonDetailDrawer';
import PersonModal from './components/PersonModal';
import FileEditorModal from './components/FileEditorModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import PhotoGallery from './components/PhotoGallery';
import TutorialSection from './components/TutorialSection';
import AdminLoginModal from './components/AdminLoginModal';
import { buildPersonsMap, formatFullName } from './utils/genealogy';

// Safe initial dataset (loads private family.json or template starter)
import initialFamilyData from './utils/initialData';

export default function App() {
  const [data, setData] = useState(initialFamilyData);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState(() => {
    try {
      return sessionStorage.getItem('family_current_view') || 'tree';
    } catch {
      return 'tree';
    }
  });
  const [rootPersonId, setRootPersonId] = useState(() => {
    try {
      return sessionStorage.getItem('family_root_person_id') || initialFamilyData?.persons?.[0]?.id || '';
    } catch {
      return initialFamilyData?.persons?.[0]?.id || '';
    }
  });
  
  // Admin Mode vs Viewer Mode (check stored admin session, default to viewer if not logged in)
  const [isAdminMode, setIsAdminMode] = useState(() => {
    try {
      const stored = localStorage.getItem('family_admin_logged_in') || sessionStorage.getItem('family_admin_logged_in');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Language State: 'en' | 'zh'
  const [lang, setLang] = useState('en');

  // Selected Person Drawer
  const [selectedPersonId, setSelectedPersonId] = useState(() => {
    try {
      return sessionStorage.getItem('family_selected_person_id') || null;
    } catch {
      return null;
    }
  });

  // Add / Edit Modal state
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);
  const [defaultSpouseId, setDefaultSpouseId] = useState(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  // Keyboard Shortcuts Cheat Sheet Modal State
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // File Sync Modal
  const [isFileEditorOpen, setIsFileEditorOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Explorer Tab & Target control
  const [explorerTab, setExplorerTab] = useState('ancestors');
  const [explorerTargetBId, setExplorerTargetBId] = useState(null);

  // Build Persons Map
  const personsMap = useMemo(() => {
    return buildPersonsMap(data.persons || []);
  }, [data.persons]);

  const selectedPerson = selectedPersonId ? personsMap.get(selectedPersonId) : null;

  // Toggle Language Handler
  const handleToggleLang = () => {
    setLang(prev => (prev === 'en' ? 'zh' : 'en'));
  };

  // Admin Authentication handlers
  const handleAdminLoginSuccess = useCallback(() => {
    setIsAdminMode(true);
    showToast(lang === 'zh' ? '管理员登录成功！编辑与增删权限已开启' : 'Admin logged in! Edit and management privileges enabled.');
  }, [lang, showToast]);

  const handleAdminLogout = useCallback(() => {
    try {
      localStorage.removeItem('family_admin_logged_in');
      sessionStorage.removeItem('family_admin_logged_in');
    } catch (e) {
      console.error(e);
    }
    setIsAdminMode(false);
    showToast(lang === 'zh' ? '已退出管理登录，当前为公开族人查阅模式' : 'Logged out. Switched to public Viewer Mode.');
  }, [lang, showToast]);

  // Sync state changes with sessionStorage to maintain view context across any reload
  useEffect(() => {
    try {
      if (currentView) sessionStorage.setItem('family_current_view', currentView);
    } catch (e) {}
  }, [currentView]);

  useEffect(() => {
    try {
      if (rootPersonId) sessionStorage.setItem('family_root_person_id', rootPersonId);
    } catch (e) {}
  }, [rootPersonId]);

  useEffect(() => {
    try {
      if (selectedPersonId) {
        sessionStorage.setItem('family_selected_person_id', selectedPersonId);
      } else {
        sessionStorage.removeItem('family_selected_person_id');
      }
    } catch (e) {}
  }, [selectedPersonId]);

  // Load family data from backend /api/family
  const fetchFamilyData = useCallback(async () => {
    try {
      const res = await fetch('/api/family');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsSynced(true);
        if (json.persons && json.persons.length > 0) {
          setRootPersonId(prev => prev || json.persons[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch from /api/family, using local state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect SSE for live disk file changes
  useEffect(() => {
    fetchFamilyData();

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/family/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'file_change' || payload.type === 'save_complete') {
            if (payload.data) {
              setData(payload.data);
              setIsSynced(true);
            }
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsSynced(false);
      };
    } catch (e) {
      console.warn('SSE not supported or failed to connect:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchFamilyData]);

  // Persist entire data to backend API and disk
  const persistData = async (newData) => {
    setData(newData);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        setIsSynced(true);
        setLastSaved(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error persisting to /api/family:', err);
      setIsSynced(false);
    }
  };

  // Add / Edit Person with bidirectional reference consistency & partner status
  const handleSavePerson = (person) => {
    let updatedPersons = [...(data.persons || [])];

    // 1. Process inline-created new spouses if any
    if (Array.isArray(person.newSpousesToCreate) && person.newSpousesToCreate.length > 0) {
      person.newSpousesToCreate.forEach(newSpouse => {
        const cleanedNewSpouse = { ...newSpouse };
        const existingIdx = updatedPersons.findIndex(p => p.id === cleanedNewSpouse.id);
        if (existingIdx >= 0) {
          updatedPersons[existingIdx] = cleanedNewSpouse;
        } else {
          updatedPersons.push(cleanedNewSpouse);
        }
      });
    }

    const cleanPerson = { ...person };
    delete cleanPerson.newSpousesToCreate;

    // If a patronymic is added, while the surname is empty, make the patronymic the surname
    if (!cleanPerson.lastName?.trim() && cleanPerson.patronymic?.trim()) {
      cleanPerson.lastName = cleanPerson.patronymic.trim();
    }

    // Ensure cleanPerson.partnerDetails is an object and each spouse has an entry
    if (!cleanPerson.partnerDetails || typeof cleanPerson.partnerDetails !== 'object') {
      cleanPerson.partnerDetails = {};
    }
    (cleanPerson.spouses || []).forEach((sId, index) => {
      if (!cleanPerson.partnerDetails[sId]) {
        cleanPerson.partnerDetails[sId] = {
          status: index === 0 ? 'first_spouse' : (index === 1 ? 'second_spouse' : 'third_spouse'),
          marriageState: 'current',
          notes: ''
        };
      }
    });

    const existingIndex = updatedPersons.findIndex(p => p.id === cleanPerson.id);
    if (existingIndex >= 0) {
      updatedPersons[existingIndex] = cleanPerson;
    } else {
      updatedPersons.push(cleanPerson);
    }

    // 2. Bidirectional links maintenance:
    updatedPersons = updatedPersons.map(p => {
      if (p.id === cleanPerson.id) return cleanPerson;
      let updatedP = { ...p };

      // 1. Parent bidirectional sync
      const wasParent = (existingIndex >= 0 ? (data.persons || [])[existingIndex]?.parents || [] : []).includes(p.id);
      const isNowParent = (cleanPerson.parents || []).includes(p.id);
      if (wasParent && !isNowParent) {
        updatedP.children = (updatedP.children || []).filter(cId => cId !== cleanPerson.id);
      } else if (isNowParent) {
        if (!(updatedP.children || []).includes(cleanPerson.id)) {
          updatedP.children = [...(updatedP.children || []), cleanPerson.id];
        }
      }

      // 2. Child bidirectional sync
      const wasChild = (existingIndex >= 0 ? (data.persons || [])[existingIndex]?.children || [] : []).includes(p.id);
      const isNowChild = (cleanPerson.children || []).includes(p.id);
      if (wasChild && !isNowChild) {
        updatedP.parents = (updatedP.parents || []).filter(pId => pId !== cleanPerson.id);
      } else if (isNowChild) {
        if (!(updatedP.parents || []).includes(cleanPerson.id)) {
          updatedP.parents = [...(updatedP.parents || []), cleanPerson.id];
        }
      }

      // 3. Spouse bidirectional sync
      const wasSpouse = (existingIndex >= 0 ? (data.persons || [])[existingIndex]?.spouses || [] : []).includes(p.id);
      const isNowSpouse = (cleanPerson.spouses || []).includes(p.id);

      if (wasSpouse && !isNowSpouse) {
        // Spouse was unlinked
        updatedP.spouses = (updatedP.spouses || []).filter(sId => sId !== cleanPerson.id);
        if (updatedP.partnerDetails && updatedP.partnerDetails[cleanPerson.id]) {
          const nextDetails = { ...updatedP.partnerDetails };
          delete nextDetails[cleanPerson.id];
          updatedP.partnerDetails = nextDetails;
        }
      } else if (isNowSpouse) {
        if (!(updatedP.spouses || []).includes(cleanPerson.id)) {
          updatedP.spouses = [...(updatedP.spouses || []), cleanPerson.id];
        }

        // CRITICAL FOR ASYMMETRICAL SPOUSAL PERSPECTIVE:
        // Do NOT overwrite p's existing perspective towards person!
        // For example, if person is Jacob and p is Darmih:
        // Jacob may have Darmih as 'second_spouse' (or 'remarriage_after_death'),
        // but Darmih has Jacob as 'first_spouse' (first husband).
        // We only set a default if p does not already have a partnerDetails entry for person.
        if (!updatedP.partnerDetails) updatedP.partnerDetails = {};
        const partnerDetailForP = cleanPerson.partnerDetails?.[p.id] || {};
        if (!updatedP.partnerDetails[cleanPerson.id] || !updatedP.partnerDetails[cleanPerson.id].status) {
          const otherSpouses = (updatedP.spouses || []).filter(id => id !== cleanPerson.id);
          const defaultRole = otherSpouses.length === 0 ? 'first_spouse' : 'second_spouse';
          const isPersonDeceased = !cleanPerson.isLiving;
          updatedP.partnerDetails[cleanPerson.id] = {
            ...(updatedP.partnerDetails[cleanPerson.id] || {}),
            status: defaultRole,
            marriageState: isPersonDeceased ? 'death' : 'current',
            marriageDate: partnerDetailForP.marriageDate || '',
            marriagePlace: partnerDetailForP.marriagePlace || ''
          };
        } else if (partnerDetailForP.marriageDate && !updatedP.partnerDetails[cleanPerson.id].marriageDate) {
          updatedP.partnerDetails[cleanPerson.id].marriageDate = partnerDetailForP.marriageDate;
          if (partnerDetailForP.marriagePlace && !updatedP.partnerDetails[cleanPerson.id].marriagePlace) {
            updatedP.partnerDetails[cleanPerson.id].marriagePlace = partnerDetailForP.marriagePlace;
          }
        }
      }

      return updatedP;
    });

    // Update relationships array (with ex-spouse/ex-partner support)
    let updatedRelationships = [...(data.relationships || [])];

    // If person was unlinked from any former spouse, remove that relationship
    if (existingIndex >= 0) {
      const formerSpouseIds = (data.persons || [])[existingIndex]?.spouses || [];
      const currentSpouseIds = new Set(cleanPerson.spouses || []);
      const removedSpouseIds = formerSpouseIds.filter(id => !currentSpouseIds.has(id));
      if (removedSpouseIds.length > 0) {
        updatedRelationships = updatedRelationships.filter(r => 
          !((r.person1 === cleanPerson.id && removedSpouseIds.includes(r.person2)) ||
            (r.person2 === cleanPerson.id && removedSpouseIds.includes(r.person1)))
        );
      }
    }

    (cleanPerson.spouses || []).forEach(spouseId => {
      const partnerDetail = cleanPerson.partnerDetails?.[spouseId] || {};
      const partnerStatus = partnerDetail.status || 'spouse';
      const existingRelIndex = updatedRelationships.findIndex(
        r => ((r.person1 === cleanPerson.id && r.person2 === spouseId) || (r.person1 === spouseId && r.person2 === cleanPerson.id))
      );

      const relType = (partnerStatus === 'ex_spouse') ? 'divorce' : (partnerStatus === 'partner' ? 'partner' : (partnerStatus === 'ex_partner' ? 'ex_partner' : 'marriage'));
      const effectiveDate = partnerDetail.marriageDate || partnerDetail.marriageYear || '';
      const effectivePlace = partnerDetail.marriagePlace || partnerDetail.place || '';

      if (existingRelIndex >= 0) {
        updatedRelationships[existingRelIndex] = {
          ...updatedRelationships[existingRelIndex],
          type: relType,
          status: partnerStatus,
          startDate: effectiveDate || updatedRelationships[existingRelIndex].startDate || '',
          marriageDate: effectiveDate || updatedRelationships[existingRelIndex].marriageDate || '',
          place: effectivePlace || updatedRelationships[existingRelIndex].place || '',
          notes: partnerDetail.notes || updatedRelationships[existingRelIndex].notes || ''
        };
      } else {
        updatedRelationships.push({
          id: `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: relType,
          status: partnerStatus,
          person1: cleanPerson.id,
          person2: spouseId,
          startDate: effectiveDate,
          marriageDate: effectiveDate,
          place: effectivePlace,
          notes: partnerDetail.notes || ''
        });
      }
    });

    const newDatabase = {
      ...data,
      persons: updatedPersons,
      relationships: updatedRelationships
    };

    persistData(newDatabase);
    setIsPersonModalOpen(false);
    setEditingPerson(null);
    setDefaultParentId(null);
    setDefaultSpouseId(null);
    if (cleanPerson.id) {
      setSelectedPersonId(cleanPerson.id);
    }
  };

  // Delete person and clean up references
  const handleDeletePerson = useCallback((personId) => {
    const updatedPersons = (data.persons || [])
      .filter(p => p.id !== personId)
      .map(p => ({
        ...p,
        parents: (p.parents || []).filter(id => id !== personId),
        spouses: (p.spouses || []).filter(id => id !== personId),
        children: (p.children || []).filter(id => id !== personId),
      }));

    const updatedRelationships = (data.relationships || []).filter(
      r => r.person1 !== personId && r.person2 !== personId
    );

    const newDatabase = {
      ...data,
      persons: updatedPersons,
      relationships: updatedRelationships
    };

    persistData(newDatabase);
    setSelectedPersonId(null);

    if (rootPersonId === personId && updatedPersons.length > 0) {
      setRootPersonId(updatedPersons[0].id);
    }
  }, [data, rootPersonId]);

  // Safe delete dialog triggers
  const handleRequestDeletePerson = useCallback((person) => {
    if (!person) return;
    setPersonToDelete(person);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!personToDelete) return;
    const target = personToDelete;
    const name = formatFullName(target, lang);
    handleDeletePerson(target.id);
    setIsDeleteModalOpen(false);
    setPersonToDelete(null);
    showToast(lang === 'zh' ? `已成功删除族人：${name}` : `Removed ${name} from family tree`);
  }, [personToDelete, lang, handleDeletePerson, showToast]);

  // Navigation handlers
  const handleExploreAncestors = useCallback((personId) => {
    setSelectedPersonId(personId);
    setExplorerTab('ancestors');
    setCurrentView('explorer');
  }, []);

  const handleExploreCousins = useCallback((personId) => {
    setSelectedPersonId(personId);
    setExplorerTab('cousins');
    setCurrentView('explorer');
  }, []);

  const handleOpenKinship = useCallback((personId, targetId = null) => {
    setSelectedPersonId(personId);
    setExplorerTargetBId(targetId);
    setExplorerTab('calculator');
    setCurrentView('explorer');
  }, []);

  const handleAddChildTo = useCallback((parentId) => {
    setEditingPerson(null);
    setDefaultParentId(parentId);
    setDefaultSpouseId(null);
    setIsPersonModalOpen(true);
  }, []);

  const handleAddSpouseTo = useCallback((personId) => {
    setEditingPerson(null);
    setDefaultParentId(null);
    setDefaultSpouseId(personId);
    setIsPersonModalOpen(true);
  }, []);

  // Photo gallery & media handlers
  const handleSavePhoto = useCallback((photo) => {
    const existingPhotos = [...(data.photos || [])];
    const photoId = photo.id || `photo-${Date.now()}`;
    const photoData = { ...photo, id: photoId };
    const existingIdx = existingPhotos.findIndex(p => p.id === photoId);
    if (existingIdx >= 0) {
      existingPhotos[existingIdx] = photoData;
    } else {
      existingPhotos.unshift(photoData);
    }
    const nextData = { ...data, photos: existingPhotos };
    persistData(nextData);
    showToast(lang === 'zh' ? '照片档案已成功保存' : 'Photo saved successfully');
  }, [data, lang, showToast]);

  const handleDeletePhoto = useCallback((photoId) => {
    const updatedPhotos = (data.photos || []).filter(p => p.id !== photoId);
    const nextData = { ...data, photos: updatedPhotos };
    persistData(nextData);
    showToast(lang === 'zh' ? '照片已删除' : 'Photo deleted');
  }, [data, lang, showToast]);

  const handleSetAvatarFromPhoto = useCallback((personId, photoUrl) => {
    const updatedPersons = (data.persons || []).map(p => {
      if (p.id === personId) {
        return { ...p, avatar: photoUrl };
      }
      return p;
    });
    const nextData = { ...data, persons: updatedPersons };
    persistData(nextData);
    showToast(lang === 'zh' ? '族人头像已成功更新' : 'Profile avatar updated');
  }, [data, lang, showToast]);

  // Global Keyboard Shortcuts (Delete, Backspace, E, F, C, S, A, 1-7, Esc, ?)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Detect if the user is typing in any form input
      const activeEl = document.activeElement;
      const activeTag = activeEl?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || activeEl?.isContentEditable;

      // Escape key handles closing whichever top surface is open
      if (e.key === 'Escape') {
        if (isDeleteModalOpen) {
          e.preventDefault();
          setIsDeleteModalOpen(false);
          setPersonToDelete(null);
          return;
        }
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isPersonModalOpen) {
          e.preventDefault();
          if (editingPerson?.id) setSelectedPersonId(editingPerson.id);
          setIsPersonModalOpen(false);
          setEditingPerson(null);
          return;
        }
        if (isFileEditorOpen) {
          e.preventDefault();
          setIsFileEditorOpen(false);
          return;
        }
        if (selectedPersonId) {
          e.preventDefault();
          setSelectedPersonId(null);
          return;
        }
        return;
      }

      // If typing inside an input element, do not intercept keyboard commands
      if (isInput) return;

      // If PersonModal or FileEditorModal is open, avoid background triggers
      if (isPersonModalOpen || isFileEditorOpen) return;

      // If Delete confirmation modal is open:
      if (isDeleteModalOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmDelete();
        }
        return;
      }

      // If Shortcuts modal is open:
      if (isShortcutsModalOpen) {
        if (e.key === '?' || (e.key === '/' && !e.shiftKey)) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
        }
        return;
      }

      // 2. Delete / Backspace: Delete selected person (Admin Mode only)
      if (isAdminMode && (e.key === 'Delete' || e.key === 'Backspace')) {
        const target = selectedPerson || (selectedPersonId ? personsMap.get(selectedPersonId) : null);
        if (target) {
          e.preventDefault();
          handleRequestDeletePerson(target);
        }
        return;
      }

      // 3. 'E' or 'e': Edit selected person (Admin Mode only)
      if (isAdminMode && (e.key === 'e' || e.key === 'E')) {
        const target = selectedPerson || (selectedPersonId ? personsMap.get(selectedPersonId) : null);
        if (target) {
          e.preventDefault();
          setSelectedPersonId(null);
          setEditingPerson(target);
          setIsPersonModalOpen(true);
        }
        return;
      }

      // 4. 'F' or 'f': Focus tree on selected person
      if (e.key === 'f' || e.key === 'F') {
        const target = selectedPerson || (selectedPersonId ? personsMap.get(selectedPersonId) : null);
        if (target) {
          e.preventDefault();
          setRootPersonId(target.id);
          setCurrentView('tree');
          showToast(lang === 'zh' ? `已聚焦世系树：${formatFullName(target, lang)}` : `Focused tree on: ${formatFullName(target, lang)}`);
        }
        return;
      }

      // 5. 'C' or 'c': Add child to selected person (Admin Mode only)
      if (isAdminMode && (e.key === 'c' || e.key === 'C')) {
        const targetId = selectedPersonId || rootPersonId;
        if (targetId) {
          e.preventDefault();
          handleAddChildTo(targetId);
        }
        return;
      }

      // 6. 'S' or 's': Add spouse/partner to selected person (Admin Mode only)
      if (isAdminMode && (e.key === 's' || e.key === 'S')) {
        const targetId = selectedPersonId || rootPersonId;
        if (targetId) {
          e.preventDefault();
          handleAddSpouseTo(targetId);
        }
        return;
      }

      // 7. 'A' or 'a': Add new family member (Admin Mode only)
      if (isAdminMode && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setEditingPerson(null);
        setDefaultParentId(null);
        setDefaultSpouseId(null);
        setIsPersonModalOpen(true);
        return;
      }

      // 8. '1' to '7': Quick view switcher
      if (e.key === '1') {
        e.preventDefault();
        setCurrentView('tree');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setCurrentView('explorer');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        setCurrentView('directory');
        return;
      }
      if (e.key === '4') {
        e.preventDefault();
        setCurrentView('timeline');
        return;
      }
      if (e.key === '5') {
        e.preventDefault();
        setCurrentView('stats');
        return;
      }
      if (e.key === '6') {
        e.preventDefault();
        setCurrentView('gallery');
        return;
      }
      if (e.key === '7') {
        e.preventDefault();
        setCurrentView('tutorial');
        return;
      }

      // 9. '?' or '/': Toggle keyboard shortcuts cheat sheet
      if (e.key === '?' || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedPersonId,
    selectedPerson,
    personsMap,
    rootPersonId,
    isPersonModalOpen,
    isFileEditorOpen,
    isDeleteModalOpen,
    isShortcutsModalOpen,
    editingPerson,
    isAdminMode,
    lang,
    handleRequestDeletePerson,
    handleConfirmDelete,
    handleAddChildTo,
    handleAddSpouseTo,
    showToast
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        persons={data.persons || []}
        onSelectPerson={(p) => {
          setSelectedPersonId(p.id);
          setRootPersonId(p.id);
        }}
        onOpenAddModal={() => {
          setEditingPerson(null);
          setDefaultParentId(null);
          setDefaultSpouseId(null);
          setIsPersonModalOpen(true);
        }}
        onOpenFileEditor={() => setIsFileEditorOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        isSynced={isSynced}
        lastSaved={lastSaved}
        lang={lang}
        onToggleLang={handleToggleLang}
        isAdminMode={isAdminMode}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main View Display */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentView === 'tree' && (
          <FamilyTreeVisualizer
            persons={data.persons || []}
            personsMap={personsMap}
            relationships={data.relationships || []}
            rootPersonId={rootPersonId}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            onSetRootPerson={(id) => setRootPersonId(id)}
            onAddChild={isAdminMode ? handleAddChildTo : undefined}
            onAddSpouse={isAdminMode ? handleAddSpouseTo : undefined}
            onExploreAncestors={handleExploreAncestors}
            onExploreCousins={handleExploreCousins}
            onEditPerson={isAdminMode ? (p) => {
              setSelectedPersonId(null);
              setEditingPerson(p);
              setIsPersonModalOpen(true);
            } : undefined}
            lang={lang}
          />
        )}

        {currentView === 'explorer' && (
          <GenealogyExplorer
            persons={data.persons || []}
            personsMap={personsMap}
            relationships={data.relationships || []}
            selectedPersonId={selectedPersonId || rootPersonId}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            initialTab={explorerTab}
            initialTargetBId={explorerTargetBId}
            lang={lang}
          />
        )}

        {currentView === 'directory' && (
          <PeopleDirectory
            persons={data.persons || []}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            onSetRootPerson={(id) => {
              setRootPersonId(id);
              setCurrentView('tree');
            }}
            onExploreAncestors={handleExploreAncestors}
            onExploreCousins={handleExploreCousins}
            onAddNewPerson={isAdminMode ? () => {
              setEditingPerson(null);
              setDefaultParentId(null);
              setDefaultSpouseId(null);
              setIsPersonModalOpen(true);
            } : undefined}
            onEditPerson={isAdminMode ? (p) => {
              setSelectedPersonId(null);
              setEditingPerson(p);
              setIsPersonModalOpen(true);
            } : undefined}
            lang={lang}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            persons={data.persons || []}
            relationships={data.relationships || []}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            lang={lang}
          />
        )}

        {currentView === 'stats' && (
          <StatsDashboard
            persons={data.persons || []}
            lang={lang}
          />
        )}

        {currentView === 'gallery' && (
          <PhotoGallery
            photos={data.photos || []}
            persons={data.persons || []}
            personsMap={personsMap}
            onSavePhoto={handleSavePhoto}
            onDeletePhoto={handleDeletePhoto}
            onSetAvatarFromPhoto={handleSetAvatarFromPhoto}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            isAdminMode={isAdminMode}
            lang={lang}
          />
        )}

        {currentView === 'tutorial' && (
          <TutorialSection
            lang={lang}
            onNavigateView={setCurrentView}
          />
        )}

        {/* Selected Person Slideout Drawer */}
        {selectedPerson && (
          <PersonDetailDrawer
            person={selectedPerson}
            personsMap={personsMap}
            relationships={data.relationships || []}
            photos={data.photos || []}
            isAdminMode={isAdminMode}
            onOpenGalleryWithPerson={(personId) => {
              setCurrentView('gallery');
            }}
            onClose={() => setSelectedPersonId(null)}
            onEdit={(p) => {
              if (!isAdminMode) return;
              setSelectedPersonId(null);
              setEditingPerson(p);
              setIsPersonModalOpen(true);
            }}
            onDelete={isAdminMode ? handleRequestDeletePerson : undefined}
            onSelectPerson={(p) => setSelectedPersonId(p.id)}
            onExploreAncestors={handleExploreAncestors}
            onExploreCousins={handleExploreCousins}
            onOpenKinship={handleOpenKinship}
            onAddSpouse={isAdminMode ? handleAddSpouseTo : undefined}
            onAddChild={isAdminMode ? handleAddChildTo : undefined}
            lang={lang}
          />
        )}
      </main>

      {/* Add / Edit Person Modal */}
      <PersonModal
        key={editingPerson ? `edit-${editingPerson.id}` : `new-${defaultParentId || defaultSpouseId || 'add'}`}
        isOpen={isPersonModalOpen}
        onClose={() => {
          if (editingPerson?.id) {
            setSelectedPersonId(editingPerson.id);
          }
          setIsPersonModalOpen(false);
          setEditingPerson(null);
          setDefaultParentId(null);
          setDefaultSpouseId(null);
        }}
        onSave={handleSavePerson}
        initialData={editingPerson}
        allPersons={data.persons || []}
        defaultParentId={defaultParentId}
        defaultSpouseId={defaultSpouseId}
        photos={data.photos || []}
        lang={lang}
      />

      {/* File Editor & Database Sync Modal */}
      <FileEditorModal
        isOpen={isFileEditorOpen}
        onClose={() => setIsFileEditorOpen(false)}
        currentData={data}
        onSaveData={persistData}
        onReloadFromFile={fetchFamilyData}
        syncStatus={isSynced}
        lang={lang}
      />

      {/* Delete Confirmation Modal (Triggered by Delete / Backspace or Drawer Delete button) */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        person={personToDelete}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPersonToDelete(null);
        }}
        lang={lang}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (Triggered by ? or Navbar button) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        lang={lang}
      />

      {/* Admin Passcode Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        lang={lang}
      />

      {/* Quick Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[130] animate-in slide-in-from-bottom-5 duration-200 pointer-events-none">
          <div className="flex items-center space-x-2.5 px-4 py-2.5 bg-slate-900/95 border border-indigo-500/40 text-white rounded-2xl shadow-2xl backdrop-blur-md text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}
