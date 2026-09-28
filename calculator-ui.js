import { parse } from './main.js';
import { getCustomCalculators, getRegressionModels } from './app-store.js';

export function mountCalculator() {
  const input = document.getElementById('numerical-input');
  const calculateButton = document.getElementById('numerical-calculate');
  const output = document.getElementById('numerical-output');
  const modelSelect = document.getElementById('numerical-model');
  const xInput = document.getElementById('numerical-x');
  const xField = document.getElementById('numerical-x-field');

  if (!input || !calculateButton || !output) {
    throw new Error(
      'The numerical screen is missing a required calculator element.',
    );
  }

  function refreshModels() {
    const selectedId = modelSelect.value;
    const models = [
      ...getRegressionModels().map((model) => ({
        ...model,
        kind: 'Regression',
      })),
      ...getCustomCalculators().map((model) => ({ ...model, kind: 'Custom' })),
    ];
    modelSelect.replaceChildren(new Option('Enter an expression', ''));
    for (const model of models) {
      const option = new Option(`${model.kind} / ${model.name}`, model.id);
      modelSelect.append(option);
    }
    if (models.some((model) => model.id === selectedId)) {
      modelSelect.value = selectedId;
    }
  }

  modelSelect.addEventListener('change', () => {
    const selected = [...getRegressionModels(), ...getCustomCalculators()].find(
      (model) => model.id === modelSelect.value,
    );
    if (selected) input.value = selected.expression;
    xField.hidden = !selected && !/\bx\b/i.test(input.value);
  });
  input.addEventListener('input', () => {
    if (!modelSelect.value) xField.hidden = !/\bx\b/i.test(input.value);
  });
  calculateButton.addEventListener('click', () => {
    try {
      const usesX = /\bx\b/i.test(input.value);
      const x = Number(xInput.value);
      if (usesX && !Number.isFinite(x)) {
        throw new Error('Enter a finite value for x.');
      }
      output.textContent = parse(input.value, usesX ? { x } : {});
    } catch (error) {
      output.textContent = `Error: ${error.message}`;
    }
  });
  window.addEventListener('numberlab:changed', (event) => {
    if (event.detail === 'calculators') refreshModels();
  });
  refreshModels();
}
