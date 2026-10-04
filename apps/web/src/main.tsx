import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import './styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (container !== null) {
  createRoot(container).render(
    <StrictMode>
      <main>Tablée</main>
    </StrictMode>,
  );
}
