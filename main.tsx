import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './base.css';
import PortfolioTemplate from './components/archive/PortfolioTemplate';

const element = document.getElementById('root');
if (!element) throw new Error('Missing portfolio root');
createRoot(element).render(<StrictMode><PortfolioTemplate /></StrictMode>);
