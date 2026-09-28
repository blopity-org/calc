import { parse } from './main.js';

export function mountCalculator() {
  const input = document.getElementById('numerical-input');
  const calculateButton = document.getElementById('numerical-calculate');
  const output = document.getElementById('numerical-output');

  if (!input || !calculateButton || !output) {
    throw new Error(
      'The numerical screen is missing a required calculator element.',
    );
  }

  calculateButton.addEventListener('click', () => {
    output.textContent = parse(input.value);
  });
}
