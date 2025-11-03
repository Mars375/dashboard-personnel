import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Filtrer les erreurs non critiques provenant d'extensions de navigateur
const originalError = console.error;
console.error = (...args) => {
	// Ignorer les erreurs "Extension context invalidated" provenant de content.js
	// Ces erreurs sont générées par des extensions de navigateur et ne sont pas critiques
	const errorMessage = args.join(' ');
	if (errorMessage.includes('Extension context invalidated') || 
		errorMessage.includes('content.js')) {
		// Ignorer silencieusement ces erreurs
		return;
	}
	// Pour toutes les autres erreurs, utiliser le comportement par défaut
	originalError.apply(console, args);
};

// Filtrer également les erreurs non capturées dans window.onerror
window.addEventListener('error', (event) => {
	// Ignorer les erreurs provenant de content.js (extensions de navigateur)
	if (event.filename?.includes('content.js') || 
		event.message?.includes('Extension context invalidated')) {
		event.preventDefault();
		return false;
	}
});

// Filtrer les erreurs non capturées dans window.onunhandledrejection
window.addEventListener('unhandledrejection', (event) => {
	// Ignorer les erreurs provenant de content.js
	if (event.reason?.message?.includes('Extension context invalidated') ||
		String(event.reason).includes('Extension context invalidated')) {
		event.preventDefault();
		return false;
	}
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
