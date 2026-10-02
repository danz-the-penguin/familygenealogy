/**
 * Comprehensive Genealogy Utility & Kinship Engine
 * Supports:
 * - Bilingual names & Chinese characters (中文姓名)
 * - Year-only or full dates (e.g. "1918" or "1918-05-12")
 * - Ex-spouses and Ex-partners (离异/前配偶/前伴侣)
 * - Adoption status (Biological, Adopted, Foster, Step / 领养/继亲)
 * - Highly specific Kinship terms (Paternal/Maternal Uncle/Aunt/Niece/Nephew)
 * - Granular 1st Cousin Once Removed breakdown (Uncle/Aunt tier vs Niece/Nephew tier, 堂 vs 表)
 */

export function buildPersonsMap(persons = []) {
  const map = new Map();
  persons.forEach(p => {
    const effectiveLastName = (p.lastName && p.lastName.trim()) ? p.lastName.trim() : (p.patronymic ? p.patronymic.trim() : '');
    map.set(p.id, {
      ...p,
      lastName: effectiveLastName,
      chineseName: p.chineseName || '',
      christianName: p.christianName || '',
      patronymic: p.patronymic || '',
      burialPlace: p.burialPlace || p.burialSite || '',
      adoptionStatus: p.adoptionStatus || 'biological',
      parents: p.parents || [],
      spouses: p.spouses || [],
      partnerDetails: p.partnerDetails || {},
      children: p.children || [],
      tags: p.tags || [],
      references: Array.isArray(p.references) ? p.references : []
    });
  });
  return map;
}

/**
 * Format full name with maiden name, patronymic, and optional Chinese name
 * If surname (lastName) is empty while patronymic is present, patronymic acts as surname.
 */
export function formatFullName(person, lang = 'en') {
  if (!person) return lang === 'zh' ? '未知' : 'Unknown';
  const effectiveLastName = (person.lastName && person.lastName.trim()) 
    ? person.lastName.trim() 
    : (person.patronymic ? person.patronymic.trim() : '');
  const effectivePatronymic = (person.patronymic && person.patronymic.trim() && person.patronymic.trim() !== effectiveLastName)
    ? `${person.patronymic.trim()} `
    : '';
  const maiden = person.maidenName ? `(${person.maidenName}) ` : '';
  const westernName = `${person.firstName || ''} ${effectivePatronymic}${maiden}${effectiveLastName}`.trim();
  
  if (person.chineseName && person.chineseName.trim()) {
    if (westernName) {
      return `${westernName} (${person.chineseName.trim()})`;
    }
    return person.chineseName.trim();
  }

  return westernName || (lang === 'zh' ? '未命名' : 'Unnamed');
}

/**
 * Normalizes a surname or patronymic string into a canonical group key and display label.
 * Specifically groups "bin X", "binti X", "bt X", "bte X", "a/l X", "a/p X", "anak X"
 * together under the same family lineage "bin/binti X" with root "X".
 */
export function normalizeSurname(rawSurname) {
  if (!rawSurname || typeof rawSurname !== 'string') {
    return {
      root: '',
      groupKey: 'unknown',
      displayGroup: 'No Surname / Unknown',
      prefix: null,
      isPatronymic: false
    };
  }
  const trimmed = rawSurname.trim();
  if (!trimmed) {
    return {
      root: '',
      groupKey: 'unknown',
      displayGroup: 'No Surname / Unknown',
      prefix: null,
      isPatronymic: false
    };
  }

  // Matches patronymic prefixes (bin, binti, bte, bt, ibni, ibn, a/l, a/p, anak, ak)
  const patronymicMatch = trimmed.match(/^(bin|binti|bte\.?|bt\.?|ibni|ibn|a\/l|a\/p|anak|ak\.?)\s+(.+)$/i);
  if (patronymicMatch) {
    const prefix = patronymicMatch[1].trim();
    const root = patronymicMatch[2].trim();
    return {
      root,
      groupKey: root.toLowerCase(),
      displayGroup: `bin/binti ${root}`,
      prefix: prefix.toLowerCase(),
      isPatronymic: true
    };
  }

  return {
    root: trimmed,
    groupKey: trimmed.toLowerCase(),
    displayGroup: trimmed,
    prefix: null,
    isPatronymic: false
  };
}

/**
 * Checks if two surnames belong to the same family lineage (e.g. "bin Limbang" & "binti Limbang" & "Limbang")
 */
export function isSameSurname(surnameA, surnameB) {
  if (!surnameA || !surnameB) return false;
  const a = normalizeSurname(surnameA);
  const b = normalizeSurname(surnameB);
  if (a.groupKey === 'unknown' || b.groupKey === 'unknown') return false;
  return a.groupKey === b.groupKey;
}

/**
 * Groups an array of persons by canonical surname / patronymic lineage.
 */
export function groupPersonsBySurname(persons = []) {
  const groupsMap = new Map();

  persons.forEach(p => {
    const rawSurname = (p.lastName && p.lastName.trim()) 
      ? p.lastName.trim() 
      : (p.patronymic && p.patronymic.trim() ? p.patronymic.trim() : '');
    
    const info = normalizeSurname(rawSurname);
    const key = info.groupKey;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        groupKey: key,
        root: info.root || (info.groupKey === 'unknown' ? 'Unknown' : key),
        displayName: info.displayGroup,
        isPatronymic: info.isPatronymic,
        members: []
      });
    }

    const grp = groupsMap.get(key);
    // If any member has a patronymic prefix, ensure the group title reflects bin/binti
    if (info.isPatronymic && !grp.isPatronymic) {
      grp.isPatronymic = true;
      grp.displayName = `bin/binti ${grp.root}`;
    }
    grp.members.push(p);
  });

  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.groupKey === 'unknown') return 1;
    if (b.groupKey === 'unknown') return -1;
    return b.members.length - a.members.length || a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Extract 4-digit year from date string (handles "1918", "1918-05-12", "c. 1918", etc.)
 */
export function extractYear(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format date string verbosely: "Day, DD Month YYYY" (e.g. "Tuesday, 14 May 1968" or "1968年5月14日 星期二")
 * Handles YYYY-MM-DD, YYYY-MM, or YYYY.
 */
export function formatVerboseDate(rawDate, lang = 'en') {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  
  // Match full YYYY-MM-DD
  const fullMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (fullMatch) {
    const year = parseInt(fullMatch[1], 10);
    const month = parseInt(fullMatch[2], 10);
    const day = parseInt(fullMatch[3], 10);
    const dateObj = new Date(year, month - 1, day);
    
    if (!isNaN(dateObj.getTime())) {
      const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekdaysZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const monthsEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const weekdayEn = weekdaysEn[dateObj.getDay()];
      const weekdayZh = weekdaysZh[dateObj.getDay()];
      const monthEn = monthsEn[month - 1];

      if (lang === 'zh') {
        return `${year}年${month}月${day}日 ${weekdayZh}`;
      }
      return `${weekdayEn}, ${day} ${monthEn} ${year}`;
    }
  }

  // Match YYYY-MM
  const monthMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (monthMatch) {
    const year = parseInt(monthMatch[1], 10);
    const month = parseInt(monthMatch[2], 10);
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (month >= 1 && month <= 12) {
      if (lang === 'zh') {
        return `${year}年${month}月`;
      }
      return `${monthsEn[month - 1]} ${year}`;
    }
  }

  // Match 4-digit year only
  const yearMatch = str.match(/^\b(\d{4})\b$/);
  if (yearMatch) {
    return lang === 'zh' ? `${yearMatch[1]}年` : yearMatch[1];
  }

  return str;
}

/**
 * Authoritatively determine whether a person is considered living.
 * A person is deceased if:
 * 1. They have an explicit death date.
 * 2. Or isLiving is explicitly false.
 * 3. Or their birth year was > 115 years ago (human lifespan threshold).
 */
export function isPersonLiving(person) {
  if (!person) return false;
  if (person.deathDate && String(person.deathDate).trim() !== '') return false;
  if (person.isLiving === false) return false;
  const bYear = extractYear(person.birthDate);
  if (bYear && (new Date().getFullYear() - bYear > 115)) return false;
  return person.isLiving === true || person.isLiving === undefined;
}

/**
 * Calculate age or lifespan string (handles year-only or full dates)
 */
export function getLifespan(person, lang = 'en') {
  if (!person) return '';
  const birthYear = extractYear(person.birthDate);
  const deathYear = extractYear(person.deathDate);
  const living = isPersonLiving(person);

  if (birthYear && deathYear) {
    const age = deathYear - birthYear;
    return lang === 'zh' 
      ? `${birthYear} – ${deathYear} (享年${age}岁)`
      : `${birthYear} – ${deathYear} (aged ${age})`;
  }
  if (birthYear && living) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return lang === 'zh'
      ? `${birthYear}年出生 (${age}岁)`
      : `b. ${birthYear} (age ${age})`;
  }
  if (birthYear && !living) {
    return lang === 'zh' ? `${birthYear}年出生 (已故)` : `b. ${birthYear} (Deceased)`;
  }
  if (deathYear) {
    return lang === 'zh' ? `卒于${deathYear}年` : `d. ${deathYear}`;
  }
  return living ? (lang === 'zh' ? '在世' : 'Living') : (lang === 'zh' ? '已故' : 'Deceased');
}

/**
 * Find all direct ancestors of a person, grouped by generation
 */
export function getAncestors(personId, personsMap) {
  const ancestors = [];
  const visited = new Set();

  function traverse(currentId, generation, lineageType = 'direct', path = []) {
    const person = personsMap.get(currentId);
    if (!person || !person.parents || person.parents.length === 0) return;

    person.parents.forEach((parentId) => {
      if (visited.has(`${parentId}-${generation}`)) return;
      visited.add(`${parentId}-${generation}`);

      const parent = personsMap.get(parentId);
      if (!parent) return;

      const currentPath = [...path, { id: currentId, name: formatFullName(person) }];
      const currentLineage = generation === 1 
        ? (parent.gender === 'female' ? 'maternal' : 'paternal')
        : lineageType;

      const isAdoptive = person.adoptionStatus === 'adopted' || parent.adoptionStatus === 'adopted';

      ancestors.push({
        person: parent,
        generation,
        lineageType: currentLineage,
        isAdoptive,
        path: currentPath,
        relationshipLabel: getAncestorLabel(generation, parent.gender, currentLineage, isAdoptive)
      });

      traverse(parentId, generation + 1, currentLineage, currentPath);
    });
  }

  traverse(personId, 1, 'direct', []);
  return ancestors;
}

export function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getAncestorLabel(generation, gender, lineage = 'paternal') {
  const isFemale = gender === 'female';

  if (generation === 1) {
    return isFemale ? 'Mother' : 'Father';
  }
  if (generation === 2) {
    const side = lineage === 'paternal' ? 'Paternal ' : 'Maternal ';
    return isFemale ? `${side}Grandmother` : `${side}Grandfather`;
  }
  if (generation === 3) {
    const side = lineage === 'paternal' ? 'Paternal ' : 'Maternal ';
    return isFemale ? `${side}Great-Grandmother` : `${side}Great-Grandfather`;
  }
  if (generation === 4) {
    return isFemale ? '2nd Great-Grandmother' : '2nd Great-Grandfather';
  }
  return isFemale ? `${getOrdinal(generation - 2)} Great-Grandmother` : `${getOrdinal(generation - 2)} Great-Grandfather`;
}

/**
 * Find all descendants of a person, grouped by generation
 */
export function getDescendants(personId, personsMap) {
  const descendants = [];
  const visited = new Set();

  function traverse(currentId, generation, path = []) {
    const person = personsMap.get(currentId);
    if (!person || !person.children || person.children.length === 0) return;

    person.children.forEach(childId => {
      if (visited.has(`${childId}-${generation}`)) return;
      visited.add(`${childId}-${generation}`);

      const child = personsMap.get(childId);
      if (!child) return;

      const currentPath = [...path, { id: currentId, name: formatFullName(person) }];
      const isAdoptive = child.adoptionStatus === 'adopted';

      descendants.push({
        person: child,
        generation,
        isAdoptive,
        path: currentPath,
        relationshipLabel: getDescendantLabel(generation, child.gender, isAdoptive)
      });

      traverse(childId, generation + 1, currentPath);
    });
  }

  traverse(personId, 1, []);
  return descendants;
}

export function getDescendantLabel(generation, gender) {
  const isFemale = gender === 'female';
  if (generation === 1) return isFemale ? 'Daughter' : 'Son';
  if (generation === 2) return isFemale ? 'Granddaughter' : 'Grandson';
  if (generation === 3) return isFemale ? 'Great-Granddaughter' : 'Great-Grandson';
  return isFemale ? `${getOrdinal(generation - 2)} Great-Granddaughter` : `${getOrdinal(generation - 2)} Great-Grandson`;
}

/**
 * Find which direct child of ancestorId is in personId's direct lineage (or personId itself)
 */
export function getBranchChildUnderAncestor(personId, ancestorId, personsMap) {
  const anc = personsMap.get(ancestorId);
  if (!anc || !anc.children) return null;

  for (const childId of anc.children) {
    if (childId === personId) return personsMap.get(childId);
    const queue = [childId];
    const visited = new Set([childId]);
    while (queue.length > 0) {
      const curr = queue.shift();
      const currP = personsMap.get(curr);
      if (!currP) continue;
      for (const cId of (currP.children || [])) {
        if (cId === personId) return personsMap.get(childId);
        if (!visited.has(cId)) {
          visited.add(cId);
          queue.push(cId);
        }
      }
    }
  }
  return null;
}

/**
 * Traces pure upward blood lineage (parents only) from startId to targetAncestorId
 */
export function getLineageUp(startId, targetAncestorId, personsMap) {
  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currId = path[path.length - 1];
    if (currId === targetAncestorId) return path;

    const curr = personsMap.get(currId);
    if (!curr) continue;

    for (const pId of (curr.parents || [])) {
      if (!visited.has(pId)) {
        visited.add(pId);
        queue.push([...path, pId]);
      }
    }
  }
  return null;
}

/**
 * Finds the pure blood lineage path between personA and personB through their Most Recent Common Ancestor (MRCA).
 * Bypasses non-blood spouse detours (e.g. step-parents or second spouses) and assigns accurate semantic roles.
 */
export function findBloodLineagePath(personAId, personBId, mrcaId, personsMap, targetRole = 'Target') {
  const pathA = getLineageUp(personAId, mrcaId, personsMap);
  const pathB = getLineageUp(personBId, mrcaId, personsMap);
  if (!pathA || !pathB) return null;

  // Crucial check: neither person should appear as an intermediate node in the other's lineage to MRCA!
  // If personBId is in pathA, personB is already personA's direct ancestor (or vice versa).
  if (pathA.slice(0, -1).includes(personBId) || pathB.slice(0, -1).includes(personAId)) {
    return null;
  }

  // Combine: pathA up to MRCA, then reversed pathB down to Person B
  const fullIds = [...pathA, ...pathB.slice(0, -1).reverse()];

  // If any node appears more than once, it is an invalid loop/cycle, not a simple path
  const seenIds = new Set();
  for (const id of fullIds) {
    if (seenIds.has(id)) return null;
    seenIds.add(id);
  }

  return fullIds.map((id, idx) => {
    const p = personsMap.get(id);
    let role = 'Relative';
    const isFemale = p && p.gender === 'female';

    if (id === personAId) {
      role = 'Subject';
    } else if (id === personBId) {
      role = targetRole || 'Target';
    } else if (id === mrcaId) {
      const genFromA = pathA.length - 1;
      if (genFromA === 1) role = isFemale ? 'Mother' : 'Father';
      else if (genFromA === 2) role = isFemale ? 'Grandmother (Common Ancestor)' : 'Grandfather (Common Ancestor)';
      else if (genFromA === 3) role = isFemale ? 'Great-Grandmother (Common Ancestor)' : 'Great-Grandfather (Common Ancestor)';
      else role = 'Common Ancestor';
    } else if (pathA.includes(id)) {
      const stepFromA = pathA.indexOf(id);
      if (stepFromA === 1) role = isFemale ? 'Mother' : 'Father';
      else if (stepFromA === 2) role = isFemale ? 'Grandmother' : 'Grandfather';
      else role = `Ancestor (${stepFromA} gen)`;
    } else if (pathB.includes(id)) {
      const stepFromB = pathB.indexOf(id);
      if (stepFromB === 1) {
        role = isFemale ? 'Aunt' : 'Uncle';
      } else {
        role = 'Relative';
      }
    }

    return {
      id,
      name: formatFullName(p),
      role,
      gender: p ? p.gender : 'other'
    };
  });
}

/**
 * Find all cousins of a person with granular degree and removedness,
 * explicitly clarifying Uncle/Aunt generation vs Niece/Nephew generation
 */
export function getCousins(personId, personsMap, relationships = []) {
  const person = personsMap.get(personId);
  if (!person) return [];

  const cousinsMap = new Map();
  const targetAncestors = getAncestors(personId, personsMap);

  const ancestorsByGen = new Map();
  targetAncestors.forEach(anc => {
    if (!ancestorsByGen.has(anc.generation)) {
      ancestorsByGen.set(anc.generation, []);
    }
    ancestorsByGen.get(anc.generation).push(anc);
  });

  const ancestorIds = new Set(targetAncestors.map(a => a.person.id));
  ancestorIds.add(personId);

  const directDescendantIds = new Set(getDescendants(personId, personsMap).map(d => d.person.id));
  const siblingIds = new Set();
  (person.parents || []).forEach(pId => {
    const parent = personsMap.get(pId);
    if (parent && parent.children) {
      parent.children.forEach(cId => siblingIds.add(cId));
    }
  });

  ancestorsByGen.forEach((ancestorList, ancGen) => {
    ancestorList.forEach(({ person: ancestor, lineageType }) => {
      const allDescendantsOfAncestor = getDescendants(ancestor.id, personsMap);
      const branchA = getBranchChildUnderAncestor(personId, ancestor.id, personsMap);

      allDescendantsOfAncestor.forEach(({ person: descendant, generation: descGen }) => {
        if (ancestorIds.has(descendant.id)) return;
        if (siblingIds.has(descendant.id)) return;
        if (directDescendantIds.has(descendant.id)) return;

        const d1 = ancGen;
        const d2 = descGen;
        const degree = Math.min(d1, d2) - 1;
        const removed = Math.abs(d1 - d2);

        if (degree >= 1) {
          const removedDirection = d1 > d2 ? 'ascending' : (d1 < d2 ? 'descending' : 'none');
          const cousinKey = descendant.id;
          const branchB = getBranchChildUnderAncestor(descendant.id, ancestor.id, personsMap);

          // Determine specific breakdown with precise agnatic (堂) vs cognatic (表) logic
          const { label, subtitle, chineseTerm } = formatSpecificCousinDetails({
            degree,
            removed,
            direction: removedDirection,
            descendant,
            lineageType,
            person,
            branchA,
            branchB
          });

          const commonAncestorName = formatFullName(ancestor);

          if (!cousinsMap.has(cousinKey) || cousinsMap.get(cousinKey).degree > degree) {
            cousinsMap.set(cousinKey, {
              person: descendant,
              degree,
              removed,
              removedDirection,
              label,
              subtitle,
              chineseTerm,
              lineageType,
              commonAncestors: [commonAncestorName],
              mrca: ancestor,
              branchA,
              branchB
            });
          } else if (cousinsMap.has(cousinKey)) {
            const existing = cousinsMap.get(cousinKey);
            if (!existing.commonAncestors.includes(commonAncestorName)) {
              existing.commonAncestors.push(commonAncestorName);
            }
          }
        }
      });
    });
  });

  const results = Array.from(cousinsMap.values());
  results.sort((a, b) => {
    if (a.degree !== b.degree) return a.degree - b.degree;
    if (a.removed !== b.removed) return a.removed - b.removed;
    return (a.person.lastName || '').localeCompare(b.person.lastName || '');
  });

  return results;
}

function formatSpecificCousinDetails({ degree, removed, direction, descendant, lineageType, person, branchA, branchB }) {
  const isFemale = descendant.gender === 'female';
  const isPaternal = lineageType === 'paternal';

  if (degree === 1 && removed === 0) {
    let isTang = false;
    let cousinCategory = 'cousin';
    let subtitle = '';

    if (branchA && branchB) {
      const isMaleBranchA = branchA.gender !== 'female';
      const isMaleBranchB = branchB.gender !== 'female';

      if (isMaleBranchA && isMaleBranchB) {
        // Both branches are male children of common grandparents: 堂亲 (Paternal agnatic cousins)
        isTang = true;
        cousinCategory = 'tang';
        subtitle = "Paternal Cousin (Father's Brother's Child / 堂亲)";
      } else if (isMaleBranchA && !isMaleBranchB) {
        // Father's sister's child: 姑表亲
        cousinCategory = 'gu_biao';
        subtitle = "Paternal Aunt's Child (Father's Sister's Child / 姑表亲)";
      } else if (!isMaleBranchA && isMaleBranchB) {
        // Mother's brother's child: 舅表亲
        cousinCategory = 'jiu_biao';
        subtitle = "Maternal Uncle's Child (Mother's Brother's Child / 舅表亲)";
      } else {
        // Mother's sister's child: 姨表亲
        cousinCategory = 'yi_biao';
        subtitle = "Maternal Aunt's Child (Mother's Sister's Child / 姨表亲)";
      }
    } else {
      const descSurname = (descendant.lastName && descendant.lastName.trim()) || (descendant.patronymic && descendant.patronymic.trim()) || '';
      const personSurname = (person.lastName && person.lastName.trim()) || (person.patronymic && person.patronymic.trim()) || '';
      isTang = isPaternal && isSameSurname(descSurname, personSurname);
      subtitle = isTang ? 'Paternal Cousin (Same surname / 堂亲)' : 'Maternal or Aunt Cousin (表亲)';
    }

    let chineseTerm = '';
    if (isTang) {
      chineseTerm = isFemale ? '堂姐妹 (堂姐/堂妹)' : '堂兄弟 (堂兄/堂弟)';
    } else if (cousinCategory === 'gu_biao') {
      chineseTerm = isFemale ? '姑表姐妹 (姑表姐/姑表妹)' : '姑表兄弟 (姑表兄/姑表弟)';
    } else if (cousinCategory === 'jiu_biao') {
      chineseTerm = isFemale ? '舅表姐妹 (舅表姐/舅表妹)' : '舅表兄弟 (舅表兄/舅表弟)';
    } else {
      chineseTerm = isFemale ? '表姐妹 (表姐/表妹)' : '表兄弟 (表兄/表弟)';
    }

    return {
      label: isTang ? '1st Paternal Cousin (Same Generation)' : '1st Cousin (Same Generation)',
      subtitle,
      chineseTerm,
      isTang
    };
  }

  if (degree === 1 && removed === 1) {
    const isAgnaticPaternal = isPaternal && (!branchA || branchA.gender !== 'female') && (!branchB || branchB.gender !== 'female');
    if (direction === 'ascending') {
      // Parent's 1st Cousin (Uncle / Aunt tier)
      const roleTier = isFemale ? "Parent's Cousin (Aunt tier)" : "Parent's Cousin (Uncle tier)";
      return {
        label: isAgnaticPaternal ? '1st Paternal Cousin Once Removed (Ascending)' : '1st Cousin Once Removed (Ascending)',
        subtitle: `${roleTier} — 1 generation above you (${isAgnaticPaternal ? '堂叔伯/堂姑' : '表舅/表姨'})`,
        chineseTerm: isAgnaticPaternal
          ? (isFemale ? '堂姑 (父亲的堂姐妹)' : '堂叔 / 堂伯 (父亲的堂兄弟)')
          : (isFemale ? '表姨 (母亲的表姐妹/姑表姨)' : '表舅 (母亲的表兄弟/姑表舅)')
      };
    } else {
      // 1st Cousin's Child (Niece / Nephew tier)
      const roleTier = isFemale ? "Cousin's Daughter (Niece tier)" : "Cousin's Son (Nephew tier)";
      return {
        label: isAgnaticPaternal ? '1st Paternal Cousin Once Removed (Descending)' : '1st Cousin Once Removed (Descending)',
        subtitle: `${roleTier} — 1 generation below you (${isAgnaticPaternal ? '堂侄/堂侄女' : '表侄/表甥'})`,
        chineseTerm: isAgnaticPaternal
          ? (isFemale ? '堂侄女 (堂兄弟之女)' : '堂侄子 (堂兄弟之子)')
          : (isFemale ? '表侄女 / 表甥女' : '表侄子 / 表甥男')
      };
    }
  }

  // 1st Cousin Twice Removed (1st Cousin 2nd Removed)
  if (degree === 1 && removed === 2) {
    if (direction === 'ascending') {
      // 2 generations above: Granduncle / Grandaunt tier
      const roleTier = isFemale ? "Grandaunt tier" : "Granduncle tier";
      const specificTitle = isPaternal
        ? (isFemale ? "Paternal Grandaunt tier" : "Paternal Granduncle tier")
        : (isFemale ? "Maternal Grandaunt tier" : "Maternal Granduncle tier");

      const lineageDetail = isPaternal 
        ? "Father's paternal/maternal first cousin once removed (Grandparent's 1st cousin — 2 generations above you)" 
        : "Mother's paternal/maternal first cousin once removed (Maternal Grandparent's 1st cousin — 2 generations above you)";

      return {
        label: `1st Cousin 2x Removed (Ascending: ${specificTitle})`,
        subtitle: `${roleTier} — ${lineageDetail}`,
        chineseTerm: isPaternal
          ? (isFemale ? '堂姑祖母 / 表姑祖母 (祖父母之堂表姐妹，父之堂表姑)' : '堂伯祖父 / 堂叔祖父 / 表舅祖父 (祖父母之堂表兄弟，父之堂表叔伯)')
          : (isFemale ? '表姨祖母 (外祖父母之表姐妹，母之表姨)' : '表舅祖父 (外祖父母之表兄弟，母之表舅)')
      };
    } else {
      // 2 generations below: Grandnephew / Grandniece tier
      const roleTier = isFemale ? "Grandniece tier" : "Grandnephew tier";
      const specificTitle = isPaternal
        ? (isFemale ? "Paternal Grandniece tier" : "Paternal Grandnephew tier")
        : (isFemale ? "Maternal Grandniece tier" : "Maternal Grandnephew tier");

      const lineageDetail = isPaternal
        ? "Paternal 1st Cousin's Grandchild (Grandnephew/Grandniece generation — 2 generations below you)"
        : "Maternal 1st Cousin's Grandchild (Grandnephew/Grandniece generation — 2 generations below you)";

      return {
        label: `1st Cousin 2x Removed (Descending: ${specificTitle})`,
        subtitle: `${roleTier} — ${lineageDetail}`,
        chineseTerm: isPaternal
          ? (isFemale ? '堂侄孙女 (堂兄弟之孙女)' : '堂侄孙 (堂兄弟之孙)')
          : (isFemale ? '表侄孙女 / 表甥孙女 (表兄弟姐妹之孙女)' : '表侄孙 / 表甥孙 (表兄弟姐妹之孙)')
      };
    }
  }

  if (degree === 2 && removed === 0) {
    return {
      label: '2nd Cousin',
      subtitle: 'Share great-grandparents (children of your parents’ 1st cousins)',
      chineseTerm: isPaternal ? '再从兄弟/再从姐妹 (二代堂亲)' : '二代表亲'
    };
  }

  if (degree === 2 && removed === 1) {
    return {
      label: '2nd Cousin Once Removed',
      subtitle: direction === 'ascending' ? 'Great-Uncle/Aunt tier (parent’s 2nd cousin)' : 'Cousin-Grandniece/Nephew tier (2nd cousin’s child)',
      chineseTerm: direction === 'ascending' ? '族叔/族姑/表族舅' : '族侄/表族侄'
    };
  }

  return {
    label: `${getOrdinal(degree)} Cousin${removed > 0 ? ` ${removed}x removed` : ''}`,
    subtitle: `Extended cousin relationship`,
    chineseTerm: '远亲 (族表亲)'
  };
}

/**
 * Calculate the direct relationship between ANY two individuals
 * Supports:
 * - Ex-spouses and Ex-partners
 * - Specific Paternal/Maternal Uncle and Aunt
 * - Specific Paternal/Maternal Niece and Nephew
 * - Adopted child and Adoptive parents
 * - Precise 1st cousin once removed (Uncle/Aunt tier vs Niece/Nephew tier)
 */
export function calculateRelationship(personAId, personBId, personsMap, relationships = []) {
  if (!personAId || !personBId) return null;
  if (personAId === personBId) {
    return { title: 'Self', chineseTitle: '本人', degreeType: 'self', path: [] };
  }

  const personA = personsMap.get(personAId);
  const personB = personsMap.get(personBId);
  if (!personA || !personB) return null;

  const candidates = [];
  const isFemaleB = personB.gender === 'female';

  // 1. Check Spouse / Ex-Spouse / Partner / Ex-Partner
  const rel = (relationships || []).find(r => 
    (r.person1 === personAId && r.person2 === personBId) || 
    (r.person1 === personBId && r.person2 === personAId)
  );

  const partnerDetail = personA.partnerDetails?.[personBId] || {};
  let effectiveStatus = partnerDetail.status;

  if (!effectiveStatus) {
    if ((personA.spouses || []).includes(personBId)) {
      effectiveStatus = 'spouse';
    } else if (rel) {
      effectiveStatus = rel.status || rel.type;
    }
  }

  const isDeceased = partnerDetail.marriageState === 'death' || !personB.isLiving;
  const statusStr = isDeceased ? '(Deceased)' : '(Current)';
  const zhStatusStr = isDeceased ? '(已故)' : '(现任/在世)';

  if (effectiveStatus) {
    if (effectiveStatus === 'first_wife' || effectiveStatus === 'first_spouse') {
      const title = isFemaleB 
        ? `First Wife ${statusStr}`
        : `First Husband ${statusStr}`;
      const chineseTitle = isFemaleB 
        ? `原配发妻 ${zhStatusStr}`
        : `第一任丈夫 ${zhStatusStr}`;
      candidates.push({
        title,
        chineseTitle,
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || (isDeceased ? 'First marriage; spouse is deceased' : 'First marriage; current spouse'),
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: title }
        ]
      });
    } else if (effectiveStatus === 'second_wife' || effectiveStatus === 'second_spouse') {
      const title = isFemaleB 
        ? `Second Wife ${statusStr}`
        : `Second Husband ${statusStr}`;
      const chineseTitle = isFemaleB 
        ? `继室 / 续弦 ${zhStatusStr}`
        : `第二任丈夫 ${zhStatusStr}`;
      candidates.push({
        title,
        chineseTitle,
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || (isDeceased ? 'Second marriage / Remarriage; spouse is deceased' : 'Second marriage / Remarriage; current spouse'),
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: title }
        ]
      });
    } else if (effectiveStatus === 'third_spouse') {
      const title = isFemaleB 
        ? `Third Wife ${statusStr}`
        : `Third Husband ${statusStr}`;
      const chineseTitle = isFemaleB 
        ? `第三任妻子 ${zhStatusStr}`
        : `第三任丈夫 ${zhStatusStr}`;
      candidates.push({
        title,
        chineseTitle,
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || 'Third marriage',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: title }
        ]
      });
    } else if (effectiveStatus === 'remarriage' || effectiveStatus === 'remarriage_after_death') {
      const title = isFemaleB 
        ? `Remarried Wife (After Death of Previous Spouse) ${statusStr}` 
        : `Remarried Husband (After Death of Previous Spouse) ${statusStr}`;
      const chineseTitle = isFemaleB 
        ? `续弦妻子 (丧偶后再婚) ${zhStatusStr}` 
        : `再婚丈夫 (丧偶后再婚) ${zhStatusStr}`;
      candidates.push({
        title,
        chineseTitle,
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || 'Remarriage following the death of a previous spouse',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: title }
        ]
      });
    } else if (effectiveStatus === 'polygamous') {
      const title = isFemaleB 
        ? `Plural Wife (Polygamous / Secondary Spouse) ${statusStr}` 
        : `Plural Husband (Polygamous) ${statusStr}`;
      const chineseTitle = isFemaleB 
        ? `平妻 / 侧室 / 妾室 ${zhStatusStr}` 
        : `多配偶 ${zhStatusStr}`;
      candidates.push({
        title,
        chineseTitle,
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || 'Concurrent or plural marriage (historical polygamy / bigamy)',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: title }
        ]
      });
    } else if (effectiveStatus === 'divorce' || effectiveStatus === 'ex_spouse') {
      candidates.push({
        title: isFemaleB ? 'Ex-Wife' : 'Ex-Husband',
        chineseTitle: isFemaleB ? '前妻 (离异)' : '前夫 (离异)',
        degreeType: 'ex_spouse',
        priority: 2,
        notes: partnerDetail.notes || rel?.notes || 'Divorced / former spouse',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Former Spouse' },
          { id: personB.id, name: formatFullName(personB), role: isFemaleB ? 'Ex-Wife' : 'Ex-Husband' }
        ]
      });
    } else if (effectiveStatus === 'partner') {
      candidates.push({
        title: `Domestic Partner ${statusStr}`,
        chineseTitle: `伴侣 ${zhStatusStr}`,
        degreeType: 'partner',
        priority: 1,
        notes: partnerDetail.notes || '',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Partner' },
          { id: personB.id, name: formatFullName(personB), role: 'Partner' }
        ]
      });
    } else if (effectiveStatus === 'ex_partner') {
      candidates.push({
        title: 'Ex-Partner',
        chineseTitle: '前伴侣',
        degreeType: 'ex_partner',
        priority: 2,
        notes: partnerDetail.notes || '',
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Former Partner' },
          { id: personB.id, name: formatFullName(personB), role: 'Ex-Partner' }
        ]
      });
    } else {
      // General spouse / marriage
      const title = `Spouse ${statusStr}`;
      const chineseTitle = `配偶 ${zhStatusStr}`;
      candidates.push({
        title: title.trim(),
        chineseTitle: chineseTitle.trim(),
        degreeType: 'spouse',
        priority: 1,
        notes: partnerDetail.notes || (isDeceased ? 'Spouse is deceased' : 'Current spouse'),
        path: [
          { id: personA.id, name: formatFullName(personA), role: 'Subject' },
          { id: personB.id, name: formatFullName(personB), role: isFemaleB ? 'Spouse (Wife)' : 'Spouse (Husband)' }
        ]
      });
    }
  } else if ((personA.spouses || []).includes(personBId) || (personB.spouses || []).includes(personAId)) {
    const isDeceased = partnerDetail.marriageState === 'death' || !personB.isLiving;
    const title = `Spouse ${isDeceased ? '(Deceased)' : '(Current)'}`;
    const chineseTitle = `配偶 ${isDeceased ? '(已故)' : '(现任)'}`;
    candidates.push({
      title: title.trim(),
      chineseTitle: chineseTitle.trim(),
      degreeType: 'spouse',
      priority: 1,
      path: [
        { id: personA.id, name: formatFullName(personA), role: 'Subject' },
        { id: personB.id, name: formatFullName(personB), role: isFemaleB ? 'Spouse (Wife)' : 'Spouse (Husband)' }
      ]
    });
  }

  // 2. Parent / Child (with Adopted status)
  // 2. Parent / Child (with Adopted / Foster status)
  if ((personA.parents || []).includes(personBId)) {
    const isAdoptive = personA.adoptionStatus === 'adopted';
    const isFoster = personA.adoptionStatus === 'foster';
    const isStep = personA.adoptionStatus === 'step';
    
    let prefix = '';
    let zhPrefix = '';
    let roleA = 'Child';
    if (isAdoptive) {
      prefix = 'Adoptive ';
      zhPrefix = '养';
      roleA = 'Adopted Child';
    } else if (isFoster) {
      prefix = 'Foster ';
      zhPrefix = '寄养';
      roleA = 'Foster Child';
    } else if (isStep) {
      prefix = 'Step-';
      zhPrefix = '继';
      roleA = 'Step-Child';
    }

    candidates.push({
      title: isFemaleB ? `${prefix}Mother` : `${prefix}Father`,
      chineseTitle: isFemaleB ? `${zhPrefix}母 (母亲)` : `${zhPrefix}父 (父亲)`,
      degreeType: isAdoptive ? 'adoptive_parent' : (isFoster ? 'foster_parent' : (isStep ? 'step_parent' : 'parent')),
      priority: 2,
      isAdoptive,
      isFoster,
      path: [
        { id: personA.id, name: formatFullName(personA), role: roleA },
        { id: personB.id, name: formatFullName(personB), role: isFemaleB ? `${prefix}Mother` : `${prefix}Father` }
      ]
    });
  }

  if ((personA.children || []).includes(personBId) || (personB.parents || []).includes(personAId)) {
    const isAdoptive = personB.adoptionStatus === 'adopted';
    const isFoster = personB.adoptionStatus === 'foster';
    const isStep = personB.adoptionStatus === 'step';

    let prefix = '';
    let zhPrefix = '';
    if (isAdoptive) {
      prefix = 'Adopted ';
      zhPrefix = '养';
    } else if (isFoster) {
      prefix = 'Foster ';
      zhPrefix = '寄养';
    } else if (isStep) {
      prefix = 'Step-';
      zhPrefix = '继';
    }

    candidates.push({
      title: isFemaleB ? `${prefix}Daughter` : `${prefix}Son`,
      chineseTitle: isFemaleB ? `${zhPrefix}女 (女儿)` : `${zhPrefix}子 (儿子)`,
      degreeType: isAdoptive ? 'adopted_child' : (isFoster ? 'foster_child' : (isStep ? 'step_child' : 'child')),
      priority: 2,
      isAdoptive,
      isFoster,
      path: [
        { id: personA.id, name: formatFullName(personA), role: 'Parent' },
        { id: personB.id, name: formatFullName(personB), role: isFemaleB ? `${prefix}Daughter` : `${prefix}Son` }
      ]
    });
  }

  // 3. Siblings & Half-Siblings (including Adoptive / Foster siblings)
  const parentsA = new Set(personA.parents || []);
  const parentsB = new Set(personB.parents || []);
  const sharedParents = [...parentsA].filter(p => parentsB.has(p));

  const eitherAdopted = personA.adoptionStatus === 'adopted' || personB.adoptionStatus === 'adopted';
  const eitherFoster = personA.adoptionStatus === 'foster' || personB.adoptionStatus === 'foster';

  if (sharedParents.length >= 2) {
    let title = isFemaleB ? 'Sister' : 'Brother';
    let chineseTitle = isFemaleB ? '亲姐妹' : '亲兄弟';
    let degreeType = 'sibling';
    let notes = `Full siblings sharing both parents`;

    if (eitherAdopted) {
      title = isFemaleB ? 'Adoptive Sister' : 'Adoptive Brother';
      chineseTitle = isFemaleB ? '养姐妹' : '养兄弟';
      degreeType = 'adoptive_sibling';
      notes = `Adoptive sibling sharing parents`;
    } else if (eitherFoster) {
      title = isFemaleB ? 'Foster Sister' : 'Foster Brother';
      chineseTitle = isFemaleB ? '寄养姐妹' : '寄养兄弟';
      degreeType = 'foster_sibling';
      notes = `Foster sibling sharing household/parents`;
    }

    candidates.push({
      title,
      chineseTitle,
      degreeType,
      priority: 3,
      isAdoptive: eitherAdopted,
      isFoster: eitherFoster,
      notes,
      path: [
        { id: personA.id, name: formatFullName(personA), role: personA.adoptionStatus === 'adopted' ? 'Adopted Child' : (personA.adoptionStatus === 'foster' ? 'Foster Child' : 'Sibling') },
        { id: sharedParents[0], name: formatFullName(personsMap.get(sharedParents[0])), role: 'Shared Parent' },
        { id: personB.id, name: formatFullName(personB), role: title }
      ]
    });
  } else if (sharedParents.length === 1) {
    const sharedP = personsMap.get(sharedParents[0]);
    const isSharedMother = sharedP && sharedP.gender === 'female';
    let specificZh = isSharedMother 
      ? (isFemaleB ? '同母异父姐妹' : '同母异父兄弟') 
      : (isFemaleB ? '同父异母姐妹' : '同父异母兄弟');
    let title = isFemaleB ? 'Half-Sister' : 'Half-Brother';
    let degreeType = 'half-sibling';
    let notes = `Sharing 1 parent: ${formatFullName(sharedP)} (${isSharedMother ? 'Mother' : 'Father'})`;

    if (eitherAdopted) {
      title = isFemaleB ? 'Adoptive Half-Sister' : 'Adoptive Half-Brother';
      specificZh = isFemaleB ? '养姐妹 (异父/异母)' : '养兄弟 (异父/异母)';
      degreeType = 'adoptive_sibling';
      notes = `Adoptive half-sibling sharing parent: ${formatFullName(sharedP)}`;
    } else if (eitherFoster) {
      title = isFemaleB ? 'Foster Half-Sister' : 'Foster Half-Brother';
      specificZh = isFemaleB ? '寄养姐妹' : '寄养兄弟';
      degreeType = 'foster_sibling';
      notes = `Foster half-sibling sharing parent: ${formatFullName(sharedP)}`;
    }

    candidates.push({
      title,
      chineseTitle: specificZh,
      degreeType,
      priority: 4,
      isAdoptive: eitherAdopted,
      isFoster: eitherFoster,
      notes,
      path: [
        { id: personA.id, name: formatFullName(personA), role: personA.adoptionStatus === 'adopted' ? 'Adopted Child' : (personA.adoptionStatus === 'foster' ? 'Foster Child' : 'Subject') },
        { id: sharedP.id, name: formatFullName(sharedP), role: isSharedMother ? 'Shared Mother' : 'Shared Father' },
        { id: personB.id, name: formatFullName(personB), role: title }
      ]
    });
  }

  // 4. Highly Specific Paternal vs Maternal Uncle & Aunt
  for (const parentId of (personA.parents || [])) {
    const parent = personsMap.get(parentId);
    if (!parent) continue;
    const isPaternal = parent.gender !== 'female';

    for (const grandparentId of (parent.parents || [])) {
      const grandparent = personsMap.get(grandparentId);
      if (grandparent && grandparent.children) {
        if (grandparent.children.includes(personBId) && personBId !== parentId) {
          if (isPaternal) {
            const title = isFemaleB ? "Paternal Aunt (Father's Sister)" : "Paternal Uncle (Father's Brother)";
            const chineseTitle = isFemaleB ? '姑母 (姑姑)' : '伯父 / 叔父';
            candidates.push({
              title,
              chineseTitle,
              degreeType: 'aunt_uncle',
              priority: 5,
              notes: isFemaleB ? `Sister of your father ${formatFullName(parent)}` : `Brother of your father ${formatFullName(parent)}`,
              path: [
                { id: personA.id, name: formatFullName(personA), role: 'Subject' },
                { id: parent.id, name: formatFullName(parent), role: 'Father' },
                { id: personB.id, name: formatFullName(personB), role: title }
              ]
            });
          } else {
            const title = isFemaleB ? "Maternal Aunt (Mother's Sister)" : "Maternal Uncle (Mother's Brother)";
            const chineseTitle = isFemaleB ? '姨母 (姨妈)' : '舅父 (舅舅)';
            candidates.push({
              title,
              chineseTitle,
              degreeType: 'aunt_uncle',
              priority: 5,
              notes: isFemaleB ? `Sister of your mother ${formatFullName(parent)}` : `Brother of your mother ${formatFullName(parent)}`,
              path: [
                { id: personA.id, name: formatFullName(personA), role: 'Subject' },
                { id: parent.id, name: formatFullName(parent), role: 'Mother' },
                { id: personB.id, name: formatFullName(personB), role: title }
              ]
            });
          }
          break;
        }
      }
    }
  }

  // 5. Highly Specific Paternal vs Maternal Niece & Nephew
  for (const parentId of (personB.parents || [])) {
    const parent = personsMap.get(parentId);
    if (!parent) continue;
    const isATheUncleOrAunt = (parent.parents || []).some(gpId => {
      const gp = personsMap.get(gpId);
      return gp && (gp.children || []).includes(personAId) && personAId !== parentId;
    });

    if (isATheUncleOrAunt) {
      const isBrother = personA.gender !== 'female';
      if (isBrother) {
        const title = isFemaleB ? "Niece (Brother's Daughter)" : "Nephew (Brother's Son)";
        const chineseTitle = isFemaleB ? '侄女 (兄弟之女)' : '侄子 (兄弟之子)';
        candidates.push({
          title,
          chineseTitle,
          degreeType: 'niece_nephew',
          priority: 5,
          notes: `Child of your brother ${formatFullName(parent)}`,
          path: [
            { id: personA.id, name: formatFullName(personA), role: 'Subject' },
            { id: parent.id, name: formatFullName(parent), role: 'Brother' },
            { id: personB.id, name: formatFullName(personB), role: title }
          ]
        });
      } else {
        const title = isFemaleB ? "Niece (Sister's Daughter)" : "Nephew (Sister's Son)";
        const chineseTitle = isFemaleB ? '外甥女 (姐妹之女)' : '外甥 (姐妹之子)';
        candidates.push({
          title,
          chineseTitle,
          degreeType: 'niece_nephew',
          priority: 5,
          notes: `Child of your sister ${formatFullName(parent)}`,
          path: [
            { id: personA.id, name: formatFullName(personA), role: 'Subject' },
            { id: parent.id, name: formatFullName(parent), role: 'Sister' },
            { id: personB.id, name: formatFullName(personB), role: title }
          ]
        });
      }
      break;
    }
  }

  // 6. Direct Ancestors & Descendants
  const ancestorsA = getAncestors(personAId, personsMap);
  const foundAsAncestor = ancestorsA.find(a => a.person.id === personBId);
  if (foundAsAncestor) {
    const zhTitle = foundAsAncestor.generation === 2
      ? (foundAsAncestor.lineageType === 'paternal' ? (isFemaleB ? '祖母 (奶奶)' : '祖父 (爷爷)') : (isFemaleB ? '外祖母 (外婆)' : '外祖父 (外公)'))
      : (foundAsAncestor.relationshipLabel);

    candidates.push({
      title: foundAsAncestor.relationshipLabel,
      chineseTitle: zhTitle,
      degreeType: 'ancestor',
      priority: foundAsAncestor.generation <= 2 ? 2 : 5,
      generation: foundAsAncestor.generation,
      path: [...foundAsAncestor.path.map(p => ({ ...p, role: 'Lineage' })), { id: personB.id, name: formatFullName(personB), role: foundAsAncestor.relationshipLabel }]
    });
  }

  const descendantsA = getDescendants(personAId, personsMap);
  const foundAsDescendant = descendantsA.find(d => d.person.id === personBId);
  if (foundAsDescendant) {
    const zhTitle = foundAsDescendant.generation === 2
      ? (isFemaleB ? '孙女' : '孙子')
      : foundAsDescendant.relationshipLabel;

    candidates.push({
      title: foundAsDescendant.relationshipLabel,
      chineseTitle: zhTitle,
      degreeType: 'descendant',
      priority: foundAsDescendant.generation <= 2 ? 2 : 5,
      generation: foundAsDescendant.generation,
      path: [...foundAsDescendant.path.map(p => ({ ...p, role: 'Lineage' })), { id: personB.id, name: formatFullName(personB), role: foundAsDescendant.relationshipLabel }]
    });
  }

  // 7. Cousins (Evaluated through all common ancestors with degree >= 1)
  // CRITICAL: Direct lineal ancestors, descendants, and siblings cannot be cousins!
  const isDirectSibling = (personA.parents || []).some(pId => (personB.parents || []).includes(pId));

  if (!foundAsAncestor && !foundAsDescendant && !isDirectSibling) {
    const ancestorsB = getAncestors(personBId, personsMap);
    const mapAncB = new Map();
    ancestorsB.forEach(b => {
      if (!mapAncB.has(b.person.id) || mapAncB.get(b.person.id).generation > b.generation) {
        mapAncB.set(b.person.id, b);
      }
    });

    const cousinAncestors = [];
    ancestorsA.forEach(a => {
      if (mapAncB.has(a.person.id)) {
        const b = mapAncB.get(a.person.id);
        const d1 = a.generation;
        const d2 = b.generation;
        const degree = Math.min(d1, d2) - 1;
        if (degree >= 1) {
          const branchA = getBranchChildUnderAncestor(personAId, a.person.id, personsMap);
          const branchB = getBranchChildUnderAncestor(personBId, a.person.id, personsMap);
          // Crucial: true cousins MUST diverge into different children under the common ancestor!
          if (branchA && branchB && branchA.id !== branchB.id) {
            cousinAncestors.push({
              ancestor: a.person,
              d1,
              d2,
              degree,
              removed: Math.abs(d1 - d2),
              lineageA: a.lineageType,
              lineageB: b.lineageType,
              branchA,
              branchB
            });
          }
        }
      }
    });

    if (cousinAncestors.length > 0) {
      // Sort by minimum generation sum to evaluate closest common ancestors first
      cousinAncestors.sort((x, y) => (x.d1 + x.d2) - (y.d1 + y.d2));
      const mrcaInfo = cousinAncestors[0];
      const mrca = mrcaInfo.ancestor;
      const { degree, removed, d1, d2, branchA, branchB } = mrcaInfo;

      const { label, subtitle, chineseTerm } = formatSpecificCousinDetails({
        degree,
        removed,
        direction: d1 > d2 ? 'ascending' : (d1 < d2 ? 'descending' : 'none'),
        descendant: personB,
        lineageType: mrcaInfo.lineageA,
        person: personA,
        branchA,
        branchB
      });

      // Compute clean blood lineage path through MRCA!
      const bloodPath = findBloodLineagePath(personAId, personBId, mrca.id, personsMap, chineseTerm || label);

      if (bloodPath) {
        candidates.push({
          title: `${label} — ${subtitle}`,
          chineseTitle: chineseTerm,
          degreeType: 'cousin',
          priority: degree === 1 && removed === 0 ? 6 : (degree === 1 ? 7 : 8),
          degree,
          removed,
          notes: `Common ancestors: ${cousinAncestors.map(c => formatFullName(c.ancestor)).join(', ')}`,
          mrca,
          path: bloodPath
        });
      }
    }
  }

  // 8. Step-Family Relationships (via parent marriages)
  for (const parentId of (personA.parents || [])) {
    const parent = personsMap.get(parentId);
    if (!parent) continue;

    for (const spouseId of (parent.spouses || [])) {
      if ((personA.parents || []).includes(spouseId)) continue; // biological parent
      const spouse = personsMap.get(spouseId);
      if (!spouse) continue;

      // Target is Step-Parent
      if (spouse.id === personBId) {
        candidates.push({
          title: isFemaleB ? 'Step-Mother' : 'Step-Father',
          chineseTitle: isFemaleB ? '继母' : '继父',
          degreeType: 'step_parent',
          priority: 8,
          notes: `Spouse of your ${parent.gender === 'female' ? 'mother' : 'father'} ${formatFullName(parent)}`,
          path: [
            { id: personA.id, name: formatFullName(personA), role: 'Step-Child' },
            { id: parent.id, name: formatFullName(parent), role: parent.gender === 'female' ? 'Mother' : 'Father' },
            { id: spouse.id, name: formatFullName(spouse), role: isFemaleB ? 'Step-Mother' : 'Step-Father' }
          ]
        });
      }

      // Target is Step-Sibling
      if ((spouse.children || []).includes(personBId) && !(personA.parents || []).includes(spouse.id)) {
        candidates.push({
          title: isFemaleB ? 'Step-Sister' : 'Step-Brother',
          chineseTitle: isFemaleB ? '继姐妹' : '继兄弟',
          degreeType: 'step_sibling',
          priority: 8,
          notes: `Step-sibling via marriage between your ${parent.gender === 'female' ? 'mother' : 'father'} ${formatFullName(parent)} and step-${spouse.gender === 'female' ? 'mother' : 'father'} ${formatFullName(spouse)}`,
          path: [
            { id: personA.id, name: formatFullName(personA), role: 'Subject' },
            { id: parent.id, name: formatFullName(parent), role: parent.gender === 'female' ? 'Mother' : 'Father' },
            { id: spouse.id, name: formatFullName(spouse), role: spouse.gender === 'female' ? 'Step-Mother' : 'Step-Father' },
            { id: personB.id, name: formatFullName(personB), role: isFemaleB ? 'Step-Sister' : 'Step-Brother' }
          ]
        });
      }
    }
  }

  // If no candidates found, fallback to general BFS
  if (candidates.length === 0) {
    const bfsPath = findKinshipGraphPath(personAId, personBId, personsMap);
    if (bfsPath && bfsPath.length > 0) {
      return {
        title: 'Extended Relative',
        chineseTitle: '宗亲远戚',
        degreeType: 'extended',
        notes: `Connected across ${bfsPath.length - 1} steps in the family tree`,
        path: bfsPath
      };
    }

    return {
      title: 'No Direct Connection Recorded',
      chineseTitle: '暂无记录的血亲或婚姻关系',
      degreeType: 'unrelated',
      notes: 'These two individuals do not have a recorded connection in the tree.',
      path: []
    };
  }

  // Deduplicate candidates by degreeType + title
  const uniqueCandidates = [];
  const seen = new Set();
  candidates.forEach(c => {
    const key = `${c.degreeType}::${c.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCandidates.push(c);
    }
  });

  uniqueCandidates.sort((a, b) => a.priority - b.priority);
  const primary = { ...uniqueCandidates[0] };

  if (uniqueCandidates.length > 1) {
    primary.hasMultipleRelationships = true;
    primary.allRelationships = uniqueCandidates;
  }

  return primary;
}

/**
 * BFS to find the shortest kinship path between two persons
 */
export function findKinshipGraphPath(startId, targetId, personsMap) {
  if (startId === targetId) return [];

  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const currentId = currentPath[currentPath.length - 1];

    if (currentId === targetId) {
      return currentPath.map(id => {
        const p = personsMap.get(id);
        return {
          id,
          name: formatFullName(p),
          gender: p?.gender,
          birthDate: p?.birthDate
        };
      });
    }

    const currentPerson = personsMap.get(currentId);
    if (!currentPerson) continue;

    const neighbors = [
      ...(currentPerson.parents || []),
      ...(currentPerson.children || []),
      ...(currentPerson.spouses || [])
    ];

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId) && personsMap.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...currentPath, neighborId]);
      }
    }
  }

  return [];
}

/**
 * Determines the current or final practiced religion of a person.
 * Evaluation priority:
 * 1. Explicitly flagged final / current religion (isFinal: true or isCurrent: true)
 * 2. Deathbed conversion (isDeathbedConversion: true) - by definition their final religion before passing
 * 3. Ongoing / current faith (endDate matches "present", "current", "now", etc.)
 * 4. Latest chronologically by endDate or startDate
 * 5. Last entered religion in the list (or the only religion if single entry)
 */
export function getFinalReligion(person) {
  if (!person || !Array.isArray(person.religions) || person.religions.length === 0) {
    return null;
  }

  const validReligions = person.religions.filter(r => r && r.name && r.name.trim());
  if (validReligions.length === 0) return null;

  // 1. Explicitly marked as final or current
  const explicit = validReligions.find(r => r.isFinal === true || r.isCurrent === true);
  if (explicit) {
    return {
      ...explicit,
      name: explicit.name.trim(),
      reason: 'explicit'
    };
  }

  // 2. Deathbed conversion
  const deathbed = validReligions.find(r => r.isDeathbedConversion === true);
  if (deathbed) {
    return {
      ...deathbed,
      name: deathbed.name.trim(),
      reason: 'deathbed'
    };
  }

  // 3. Single religion
  if (validReligions.length === 1) {
    return {
      ...validReligions[0],
      name: validReligions[0].name.trim(),
      reason: 'single'
    };
  }

  // 4. Ongoing / current faith
  const presentRelig = validReligions.find(r => 
    r.endDate && /present|current|now/i.test(r.endDate.trim())
  );
  if (presentRelig) {
    return {
      ...presentRelig,
      name: presentRelig.name.trim(),
      reason: 'present'
    };
  }

  // 5. Latest date or last added
  const withYears = validReligions.map((r, idx) => {
    const endY = extractYear(r.endDate);
    const startY = extractYear(r.startDate);
    const sortVal = endY !== null ? endY : (startY !== null ? startY : idx * 10);
    return { r, sortVal, idx };
  });

  withYears.sort((a, b) => b.sortVal - a.sortVal || b.idx - a.idx);
  const latest = withYears[0].r;

  return {
    ...latest,
    name: latest.name.trim(),
    reason: 'latest'
  };
}

/**
 * Compute summary statistics for the whole family tree
 */
export function computeGenealogyStats(persons = []) {
  if (!persons || persons.length === 0) {
    return {
      total: 0,
      living: 0,
      deceased: 0,
      adoptedCount: 0,
      generations: 0,
      oldestPerson: null,
      topSurnames: [],
      avgLifespan: 0,
      places: [],
      topReligions: [],
      totalWithReligion: 0,
      totalUnspecifiedReligion: 0
    };
  }

  let livingCount = 0;
  let deceasedCount = 0;
  let adoptedCount = 0;
  let totalLifespanYears = 0;
  let deceasedWithAgeCount = 0;
  const surnameGroups = {};
  const placeCounts = {};
  const religionCounts = {};
  let totalWithReligion = 0;
  let totalUnspecifiedReligion = 0;
  let oldestPerson = null;
  let maxAge = -1;

  persons.forEach(p => {
    const living = isPersonLiving(p);
    if (living) livingCount++;
    else deceasedCount++;

    if (p.adoptionStatus === 'adopted') adoptedCount++;

    const rawSurname = (p.lastName || p.patronymic || '').trim();
    if (rawSurname) {
      const norm = normalizeSurname(rawSurname);
      const key = norm.groupKey;
      if (!surnameGroups[key]) {
        surnameGroups[key] = {
          name: norm.displayGroup,
          root: norm.root,
          isPatronymic: norm.isPatronymic,
          count: 0
        };
      }
      if (norm.isPatronymic && !surnameGroups[key].isPatronymic) {
        surnameGroups[key].isPatronymic = true;
        surnameGroups[key].name = `bin/binti ${norm.root}`;
      }
      surnameGroups[key].count++;
    }

    if (p.birthPlace) {
      const place = p.birthPlace.split(',').pop()?.trim() || p.birthPlace;
      placeCounts[place] = (placeCounts[place] || 0) + 1;
    }

    // Determine current or final practiced religion
    const finalRel = getFinalReligion(p);
    if (finalRel && finalRel.name) {
      const relName = finalRel.name.trim();
      religionCounts[relName] = (religionCounts[relName] || 0) + 1;
      totalWithReligion++;
    } else {
      totalUnspecifiedReligion++;
    }

    const bYear = extractYear(p.birthDate);
    const dYear = extractYear(p.deathDate);
    if (bYear && dYear && dYear >= bYear) {
      const age = dYear - bYear;
      totalLifespanYears += age;
      deceasedWithAgeCount++;
      if (age > maxAge) {
        maxAge = age;
        oldestPerson = { ...p, age };
      }
    } else if (bYear && living) {
      const age = new Date().getFullYear() - bYear;
      if (age > maxAge) {
        maxAge = age;
        oldestPerson = { ...p, age };
      }
    }
  });

  const topSurnames = Object.values(surnameGroups)
    .map(item => ({ name: item.name, count: item.count, isPatronymic: item.isPatronymic }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPlaces = Object.entries(placeCounts)
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topReligions = Object.entries(religionCounts)
    .map(([religion, count]) => ({ religion, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: persons.length,
    living: livingCount,
    deceased: deceasedCount,
    adoptedCount,
    avgLifespan: deceasedWithAgeCount > 0 ? Math.round(totalLifespanYears / deceasedWithAgeCount) : null,
    oldestPerson,
    topSurnames,
    topPlaces,
    topReligions,
    totalWithReligion,
    totalUnspecifiedReligion
  };
}
