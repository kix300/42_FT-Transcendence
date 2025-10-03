import "./style.css";

import { Engine } from '@babylonjs/core/Engines/engine';
import { Game } from './Game';

/***********************************************************
 *
 *
 *    Part 1: Define CSS classes and apply them
 *
 *
 ***********************************************************/

const bodyClasses: string[] = ['bg-gray-100', 'overflow-hidden'];
const appDivClasses: string[] = ['w-screen', 'h-screen'];

// Style the body
const body = document.querySelector('body');
if (body) {
  for (const value of bodyClasses) {
    body.classList.add(value);
  }
}

// Style the #app div and add the canvas
const appDiv = document.querySelector<HTMLDivElement>('#app');
if (appDiv) {
  for (const value of appDivClasses) {
    appDiv.classList.add(value);
  }
  const canvasHtml = `<canvas id="renderCanvas" class="w-full h-full block focus:outline-none"></canvas>`;
  appDiv.innerHTML = canvasHtml;
}

/***********************************************************
 *
 *
 *    Part 2: Insert Fixed Header and Footer
 *
 *
 ***********************************************************/

if (body) {
  // --- HEADER (with updated button styles) ---
  const headerHtml = `
  <header id="page-header" class="fixed top-0 left-0 right-0 z-10
                          bg-white/50 backdrop-blur-sm shadow-md
                          transform -translate-y-full
                          transition-transform duration-300 ease-in-out">
    <nav class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex-shrink-0">
        <a href="/">
          <img src="/public/assets/images/logo.png" alt="Site Logo" class="h-8 w-auto" />
        </a>
      </div>
      <ul class="flex space-x-6">
        <li><a href="#" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Tournaments</a></li>
        <li><a href="#" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">Standings</a></li>
        <li><a href="#" class="font-medium text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-white/80 hover:shadow-xl hover:-translate-y-1">About</a></li>
      </ul>
    </nav>
  </header>`;

  // --- FOOTER ---
  const footerHtml = `
  <footer id="page-footer" class="fixed bottom-0 left-0 right-0 z-10
                         bg-gray-800/50 backdrop-blur-sm
                         transform translate-y-full
                         transition-transform duration-300 ease-in-out">
    <div class="container mx-auto px-4 text-center py-4">
      <p class="text-sm text-white">&copy; ${new Date().getFullYear()} MySite. All rights reserved.</p>
    </div>
  </footer>`;

  body.insertAdjacentHTML('beforeend', headerHtml);
  body.insertAdjacentHTML('beforeend', footerHtml);
}

/***********************************************************
 *
 *
 *    Part 3: Handle Mouse Movement for UI Visibility
 *
 *
 ***********************************************************/

const header = document.getElementById('page-header');
const footer = document.getElementById('page-footer');

if (header && footer) {
  // Set the initial state to hidden
  header.classList.add('-translate-y-full');
  footer.classList.add('translate-y-full');

  const threshold = 80; // pixels from the edge

  window.addEventListener('mousemove', (event) => {
    const mouseY = event.clientY;
    const screenHeight = window.innerHeight;

    // Show/Hide Header
    if (mouseY < threshold) {
      header.classList.add('translate-y-0');
      header.classList.remove('-translate-y-full');
    } else {
      header.classList.add('-translate-y-full');
      header.classList.remove('translate-y-0');
    }

    // Show/Hide Footer
    if (mouseY > screenHeight - threshold) {
      footer.classList.add('translate-y-0');
      footer.classList.remove('translate-y-full');
    } else {
      footer.classList.add('translate-y-full');
      footer.classList.remove('translate-y-0');
    }
  });
}
/***********************************************************
 *
 *      Game Logic
 *
 *
 ***********************************************************/

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new Engine(canvas, true);

const game = new Game(engine, canvas);

game.start();

window.addEventListener('resize', () => {
    engine.resize();
});
