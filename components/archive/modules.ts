import type { ModuleId } from './timeline';

export const portfolioModules: Array<{ id: ModuleId; label: string; reasonIds: string[] }> = [
  { id: 'about', label: 'About', reasonIds: [] },
  { id: 'fragments', label: 'Fragments', reasonIds: ['01'] },
  { id: 'craft', label: 'Practice', reasonIds: ['02', '04', '05'] },
  { id: 'perspective', label: 'Perspective', reasonIds: ['09', '03', '07', '08'] },
  { id: 'works', label: 'Selected work', reasonIds: [] },
  { id: 'collaboration', label: 'Say hello', reasonIds: ['06'] },
];
