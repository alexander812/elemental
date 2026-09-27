import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import '@elemental/ui-kit/tokens.css';

import App from './App.tsx';
import { ThemeRoot } from './ThemeRoot.tsx';
import { installGhostClickSuppressor } from './lib/ghostClick';

import './index.css';

installGhostClickSuppressor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeRoot>
      <App />
    </ThemeRoot>
  </StrictMode>,
);
