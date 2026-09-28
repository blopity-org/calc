const mathUrl = 'https://cdn.jsdelivr.net/npm/mathjs@14.8.1/+esm';

export async function mountCnc() {
  const math = await import(mathUrl);
  const first = document.getElementById('cnc-first');
  const second = document.getElementById('cnc-second');
  const secondWrap = document.getElementById('cnc-second-wrap');
  const operation = document.getElementById('cnc-operation');
  const button = document.getElementById('cnc-calculate');
  const error = document.getElementById('cnc-error');
  const output = document.getElementById('cnc-output');
  const real = document.getElementById('cnc-real');
  const imaginary = document.getElementById('cnc-imaginary');
  const modulus = document.getElementById('cnc-modulus');
  const argument = document.getElementById('cnc-argument');
  const unaryOperations = new Set(['magnitude', 'conjugate', 'argument']);

  function calculate() {
    try {
      const left = math.complex(first.value);
      const unary = unaryOperations.has(operation.value);
      const right = unary ? null : math.complex(second.value);
      let result;
      let resultLabel;

      switch (operation.value) {
        case 'add':
          result = math.add(left, right);
          break;
        case 'subtract':
          result = math.subtract(left, right);
          break;
        case 'multiply':
          result = math.multiply(left, right);
          break;
        case 'divide':
          result = math.divide(left, right);
          break;
        case 'power':
          result = math.pow(left, right);
          break;
        case 'magnitude':
          result = math.complex(math.abs(left), 0);
          resultLabel = `${formatNumber(result.re)}`;
          break;
        case 'conjugate':
          result = math.conj(left);
          break;
        case 'argument':
          result = math.complex(math.arg(left), 0);
          resultLabel = `${formatNumber(result.re)} rad`;
          break;
        default:
          throw new Error('Choose a supported complex operation.');
      }

      if (!Number.isFinite(result.re) || !Number.isFinite(result.im)) {
        throw new Error('The result is not finite. Check the input values.');
      }

      error.hidden = true;
      error.textContent = '';
      output.value = resultLabel ?? math.format(result, { precision: 12 });
      real.value = formatNumber(result.re);
      imaginary.value = formatNumber(result.im);
      modulus.value = formatNumber(math.abs(result));
      argument.value = `${formatNumber(math.arg(result))} rad`;
    } catch (exception) {
      error.textContent =
        exception.message || 'Could not parse that complex number.';
      error.hidden = false;
    }
  }

  operation.addEventListener('change', () => {
    secondWrap.hidden = unaryOperations.has(operation.value);
    calculate();
  });
  button.addEventListener('click', calculate);
  first.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') calculate();
  });
  second.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') calculate();
  });
  calculate();
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}
