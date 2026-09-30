// Safe initial data loader for template repositories
// Uses template starter data as the initial synchronous bootstrap.
// The actual family database is loaded dynamically via /api/family on mount,
// preventing Vite's HMR watcher from triggering full-page browser reloads when family.json is edited.
import exampleData from '../../data/family.example.json';

const initialData = exampleData;

export default initialData;
