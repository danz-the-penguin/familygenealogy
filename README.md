# KinshipFlow — Modern Genealogy, Ancestor & Cousin Tracker

A React web application for tracking family genealogy, exploring direct ancestral lineages, finding all degrees of cousins, calculating kinships between any two family members, and editing data either **directly in local files** (`data/family.json`) or **interactively in the web UI**.

---

## 🌟 Key Features

### 1. Dual Editing & Live Synchronization
- **Edit Manually in Files**: All records reside in human-friendly JSON at [`data/family.json`](./data/family.json). Open this file in your favorite text editor or VS Code, make changes, and save.
- **Live Disk Sync (SSE)**: When you edit `data/family.json` externally, the webapp automatically detects changes via Server-Sent Events (SSE) and refreshes without needing a browser reload!
- **Insert Entries in the Webapp**: Use the interactive form to add family members with vital dates, places, maiden names, photos, bio, tags, and parents/spouses/children. The webapp automatically writes changes back to `data/family.json` and preserves bidirectional integrity.
- **In-App JSON Editor**: Inspect, prettify, edit, or copy the raw JSON directly inside the webapp.

### 2. Search Ancestors
- Select any family member to immediately inspect all direct ancestors organized by generational distance:
  - **Gen 1**: Parents (Father & Mother)
  - **Gen 2**: Grandparents (Paternal & Maternal)
  - **Gen 3**: Great-Grandparents
  - **Gen 4+**: 2nd Great-Grandparents and beyond
- Filter between **All**, **Paternal (Father's line)**, and **Maternal (Mother's line)**.

### 3. Search Cousins
- Dedicated genealogical cousin discovery engine:
  - **1st Cousins**: Children of aunts/uncles sharing grandparents.
  - **1st Cousins Once Removed**: Upwards (parent's first cousins) and Downwards (cousin's children).
  - **2nd Cousins**: Relatives sharing great-grandparents.
  - **2nd Cousins Once Removed & 3rd Cousins**.
- Shows the **Most Recent Common Ancestors (MRCA)** and the exact genealogical branch.

### 4. Kinship Calculator (Any 2 People)
- Pick any two people in the family tree.
- Calculates the exact genealogical relationship (e.g. *“First cousin once removed”*, *“Great-Aunt”*, *“Half-Brother”*, *“Niece”*).
- Visualizes the step-by-step connecting lineage path through the family tree.

### 5. Interactive Family Tree Canvas
- Pan & zoom (mouse drag, zoom in/out, reset).
- Multi-generational pedigree view around any selected focus person.
- Spouses displayed side-by-side with connection indicators.
- Quick buttons to change tree focus, add child, add spouse, or inspect.

### 6. Directory, Timeline & Statistics
- **People Directory**: Instant search across names, birthplaces, occupations, and tags with quick navigation pills.
- **Historical Timeline**: Chronological milestones of births, marriages, and passings.
- **Statistics Dashboard**: Total members, living vs deceased ratio, average lifespan, oldest ancestors, top surnames, and geographic birthplaces.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment & Admin Passcode (Optional)
```bash
cp .env.example .env
```
Edit `.env` to customize your Admin login password:
```env
VITE_ADMIN_PASSWORD=your_secure_password
```

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### 4. Run Standalone Node Server (Optional)
```bash
npm run build
npm run serve
```
Open your browser at [http://localhost:3001](http://localhost:3001).

---

## 🔒 Privacy & Template Security
This repository is configured out-of-the-box as a **safe public template**:
- **Personal Family Data Protected**: `data/family.json` is listed in [`.gitignore`](./.gitignore). Your real family tree data, personal details, and sensitive dates will **never** be committed or uploaded to GitHub.
- **Starter Template Included**: [`data/family.example.json`](./data/family.example.json) is committed to the repository so anyone who clones or forks the template gets an immediately functional starter tree with zero setup.
- **Passcode Protection**: Set `VITE_ADMIN_PASSWORD` in your local `.env` (which is also ignored by Git) to restrict editing capabilities to family administrators only.

## 📁 File Structure

```
familygenealogy/
├── data/
│   └── family.json         # Direct file storage: edit manually here anytime!
├── src/
│   ├── components/
│   │   ├── FamilyTreeVisualizer.jsx  # Interactive pan & zoom pedigree canvas
│   │   ├── GenealogyExplorer.jsx     # Ancestor search, cousin finder & kinship calculator
│   │   ├── PeopleDirectory.jsx       # Searchable people list & tag filters
│   │   ├── PersonDetailDrawer.jsx    # Person profile slideout
│   │   ├── PersonModal.jsx           # Form to insert/edit family members
│   │   ├── FileEditorModal.jsx       # In-app JSON editor & live disk sync info
│   │   ├── TimelineView.jsx          # Chronological life milestones
│   │   ├── StatsDashboard.jsx        # Demographics & longevity stats
│   │   └── Navbar.jsx                # Navigation, quick search & status badge
│   ├── utils/
│   │   └── genealogy.js              # Ancestor, cousin & kinship pathfinding engine
│   ├── App.jsx                       # Main application state & SSE file watcher
│   ├── index.css                     # Tailwind CSS v4 styling & animations
│   └── main.jsx
├── server.js                         # Standalone Node.js server with live file watcher
├── vite.config.js                    # Vite configuration with built-in API plugin
└── package.json
```

---

## 📝 Editing `data/family.json` Manually

Each person entry has the following schema:

```json
{
  "id": "p-1",
  "firstName": "Arthur",
  "lastName": "Harrison",
  "maidenName": "",
  "gender": "male",
  "birthDate": "1918-05-12",
  "birthPlace": "Edinburgh, Scotland",
  "deathDate": "1994-11-20",
  "deathPlace": "Boston, MA, USA",
  "bio": "Served in WWII naval transport. Clockmaker and genealogist.",
  "avatar": "https://images.unsplash.com/...",
  "occupation": "Master Watchmaker",
  "isLiving": false,
  "parents": [],
  "spouses": ["p-2"],
  "children": ["p-3", "p-4", "p-5"],
  "tags": ["WWII Veteran", "Patriarch"]
}
```

Whenever you save changes to `data/family.json` in VS Code, the web app detects the change and updates live!
