# Developer Notes

## App Structure

- `index.html` contains the Number Lab shell and its screens. Screen sections use `data-screen`; navigation controls use `data-navigate` with the target screen ID. The home, mode menu, and About screen are separate destinations.
- `app.js` owns screen navigation and the `registerMode(...)` catalog. Registration builds a menu card and lazy-mounts its feature the first time it opens.
- `calculator-ui.js` connects calculator controls to the expression engine. Keep DOM reads, event handlers, and display updates here.
- `statistics-ui.js` parses datasets and renders descriptive summaries, a histogram, box plot, regression, and grouped-frequency analysis. It loads pinned `simple-statistics` and Chart.js ESM builds from jsDelivr only when Statistics opens.
- `cnc-ui.js` connects the CNC interface to the pinned Math.js ESM build for complex-number operations; it is loaded only when CNC opens.
- `main.js`, `parser.js`, `postfix.js`, `eval.js`, and `core.js` implement expression evaluation. Keep this layer independent of the DOM so it can be tested and reused.
- `kb/` is a separate standalone application with its own `index.html` and `app.js`. Treat it as an independent app unless a change explicitly calls for integrating it.
- `style.css` owns the Number Lab visual system. Reuse its variables and responsive patterns when adding screens.

The root app uses native JavaScript modules and has no build step or package manager. Serve it over HTTP during development because browsers restrict module imports on `file://` pages:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Adding A Mode

1. Add a `<section class="screen" id="your-mode-screen" data-screen hidden>` to `index.html`, with labeled controls and a `[role="status"]` or `[role="alert"]` result area. Use `data-navigate` for navigation; do not add inline event handlers.
2. Create a focused module exporting `mountYourMode()`.
3. Add one `registerMode({...})` call in `app.js` with `id`, `title`, `description`, `symbol`, `theme`, and a lazy `mount` import. The helper creates the menu entry and hooks the screen into navigation.
4. Keep calculations in DOM-independent functions where practical. Add responsive styles to `style.css`, reusing its variables and focus styles.

## Adding A Regression Type

`statistics-ui.js` exports `registerRegressionType({ id, label, minimumObservations, fit })`. Add one registration call next to the built-in linear and quadratic registrations. `fit(points)` receives `{ x, y }` observations and must return `{ equation, predict(x) }`; the Statistics mode uses it for the equation, R-squared, and fitted curve. Keep IDs unique and require enough points for the model's parameters.

The Descriptive view accepts finite numbers separated by whitespace, commas, or semicolons. Its deviation/variance selector switches between population and sample formulas; sample deviation and variance need at least two observations. The box plot marks outliers beyond 1.5 times the interquartile range, and the histogram uses a bounded automatic bin count. Regression accepts one finite x/y pair per line. Grouped data accepts ordered class intervals and whole-number frequencies; its mean, median, and mode are grouped-data estimates.

## Larger Change Checklist

- Decide whether the change is a new screen, a new capability within an existing screen, or a change to shared navigation before editing.
- Keep each feature's UI wiring separate from its domain logic. Add shared abstractions only when more than one feature needs them.
- Keep the standalone `kb/` application independent unless cross-app integration is part of the requirement.
- Check all navigation paths, including returning to the launcher, and verify a feature is not mounted repeatedly after revisiting its screen.
- Test one representative success case and one invalid-input or empty-state case for changed behavior.
- For Statistics changes, include a tied-mode dataset, a known outlier, linear/quadratic fit checks, grouped frequencies with known totals, and both sample and population deviation settings.
- Check the launcher and affected screens at desktop and narrow mobile widths; confirm there is no horizontal overflow.
- For larger changes, update these notes when entry points, module responsibilities, or extension steps change.