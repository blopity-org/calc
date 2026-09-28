import { mountCalculator } from './calculator-ui.js';

const screens = new Map(
  Array.from(document.querySelectorAll('[data-screen]'), (screen) => [
    screen.id,
    screen,
  ]),
);
const modes = [];
const mountedFeatures = new Set();
const pendingFeatures = new Set();
const modeGrid = document.getElementById('mode-grid');

function registerMode({ id, title, description, symbol, theme, mount }) {
  const screenId = `${id}-screen`;
  if (!screens.has(screenId)) {
    throw new Error(`Cannot register ${title}: #${screenId} is missing.`);
  }

  const mode = { id, title, screenId, description, symbol, theme, mount };
  modes.push(mode);
  modeGrid.append(createModeCard(mode, modes.length));
  return mode;
}

function createModeCard(mode, index) {
  const button = document.createElement('button');
  button.className = `tool-card ${mode.theme}`;
  button.type = 'button';
  button.dataset.navigate = mode.screenId;

  const top = document.createElement('span');
  top.className = 'tool-card-top';
  const label = document.createElement('span');
  label.textContent = `${String(index).padStart(2, '0')} / ${mode.id.toUpperCase()}`;
  const arrow = document.createElement('span');
  arrow.className = 'card-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  top.append(label, arrow);

  const symbol = document.createElement('span');
  symbol.className = 'tool-symbol';
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = mode.symbol;

  const copy = document.createElement('span');
  copy.className = 'tool-card-copy';
  const title = document.createElement('strong');
  title.textContent = mode.title;
  const description = document.createElement('span');
  description.textContent = mode.description;
  copy.append(title, description);
  button.append(top, symbol, copy);
  return button;
}

registerMode({
  id: 'numerical',
  title: 'Numerical',
  description: 'Expressions, evaluated.',
  symbol: '∑',
  theme: 'tool-card--numerical',
  mount: mountCalculator,
});
registerMode({
  id: 'statistics',
  title: 'Statistics',
  description: 'Describe, compare, and model data.',
  symbol: 'x̄',
  theme: 'tool-card--statistics',
  mount: () =>
    import('./statistics-ui.js').then(({ mountStatistics }) =>
      mountStatistics(),
    ),
});
registerMode({
  id: 'cnc',
  title: 'CNC',
  description: 'Complex Number Calculations.',
  symbol: 'a+bi',
  theme: 'tool-card--cnc',
  mount: () => import('./cnc-ui.js').then(({ mountCnc }) => mountCnc()),
});

document.querySelectorAll('[data-mode-count]').forEach((element) => {
  element.textContent = String(modes.length).padStart(2, '0');
});

function navigateTo(screenId) {
  const destination = screens.get(screenId);
  if (!destination) return;

  for (const screen of screens.values()) {
    screen.hidden = screen !== destination;
  }
  document.querySelectorAll('.primary-nav [data-navigate]').forEach((item) => {
    if (item.dataset.navigate === screenId)
      item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });

  const mode = modes.find((item) => item.screenId === screenId);
  if (!mode || mountedFeatures.has(screenId) || pendingFeatures.has(screenId))
    return;

  pendingFeatures.add(screenId);
  Promise.resolve()
    .then(mode.mount)
    .then(() => mountedFeatures.add(screenId))
    .catch((error) => {
      console.error(`Could not load ${screenId}.`, error);
      const status = destination.querySelector('[role="status"]');
      if (status)
        status.textContent = `This mode could not load: ${error.message}`;
    })
    .finally(() => pendingFeatures.delete(screenId));
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const navigationButton = event.target.closest('[data-navigate]');
  if (navigationButton instanceof HTMLElement)
    navigateTo(navigationButton.dataset.navigate);
});

navigateTo('home-screen');
