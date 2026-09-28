import {
  monads,
  gamma,
  sqrt,
  neg,
  sin,
  cos,
  tan,
  sinh,
  cosh,
  tanh,
  asin,
  acos,
  atan,
  asinh,
  acosh,
  atanh,
  isNumberString,
} from './core.js';

export function evalpostfix(pf, variables = {}) {
  let stack = [];
  for (let i = 0; i < pf.length; i++) {
    if (isNumberString(pf[i])) {
      stack.push(parseFloat(pf[i]));
    } else {
      let operator = pf[i];
      let result = 0.0;
      if (monads.includes(operator)) {
        let n = parseFloat(stack.pop());
        if (operator === '!') {
          if (n < 0) {
            throw new Error('Factorial not defined for negative numbers');
          }
          if (n % 1 !== 0) {
            // Non-integer: use gamma
            result = gamma(n + 1);
            if (!isFinite(result) || isNaN(result)) {
              // Use Stirling's for very large non-integers
              let stirling =
                Math.sqrt(2 * Math.PI * n) * Math.pow(n / Math.E, n);
              result = stirling.toExponential();
            }
            stack.push(result);
          } else if (n < 142) {
            // Safe to use gamma for integers up to but not including 142
            // due to floating point precision and dividing by large numbers
            // in the gamma function
            // n < 142 is safe for gamma
            result = gamma(n + 1);
            stack.push(result);
          } else {
            // For very large n, use only logarithmic form to avoid Infinity
            let log10 =
              0.5 * Math.log10(2 * Math.PI * n) +
              n * (Math.log10(n) - Math.LOG10E);
            let mantissa = Math.pow(10, log10 % 1.0);
            result = mantissa + 'e+' + Math.floor(log10);
            stack.push(result);
          }
        } else if (operator === 'sqrt') result = sqrt(n);
        else if (operator === 'neg') result = neg(n);
        else if (operator === 'ln') result = Math.log(n);
        else if (operator === 'log') result = Math.log10(n);
        else if (operator === 'exp') result = Math.exp(n);
        else if (operator === 'sin') result = sin(n);
        else if (operator === 'cos') result = cos(n);
        else if (operator === 'tan') result = tan(n);
        else if (operator === 'sinh') result = sinh(n);
        else if (operator === 'cosh') result = cosh(n);
        else if (operator === 'tanh') result = tanh(n);
        else if (operator === 'asin') result = asin(n);
        else if (operator === 'acos') result = acos(n);
        else if (operator === 'atan') result = atan(n);
        else if (operator === 'asinh') result = asinh(n);
        else if (operator === 'acosh') result = acosh(n);
        else if (operator === 'atanh') result = atanh(n);
        else throw new Error('Unknown monad operator: ' + operator);
        if (operator !== '!') stack.push(result);
      } else if (Object.hasOwn(variables, operator)) {
        const value = Number(variables[operator]);
        if (!Number.isFinite(value)) {
          throw new Error(`Variable "${operator}" must be a finite number`);
        }
        stack.push(value);
      } else {
        if (!['+', '-', '*', '/', '^', '%', '//', 'rt'].includes(operator)) {
          throw new Error(`Unknown variable or operator: ${operator}`);
        }
        let n2 = stack.pop();
        let n1 = stack.pop();
        if (typeof n1 === 'string' || typeof n2 === 'string') {
          result = n1 + operator + n2;
          stack.push(result);
          continue;
        }
        n1 = parseFloat(n1);
        n2 = parseFloat(n2);
        if (operator === '+') result = n1 + n2;
        else if (operator === '-') result = n1 - n2;
        else if (operator === '*') result = n1 * n2;
        else if (operator === '/') result = n1 / n2;
        else if (operator === '^') {
          result = Math.pow(n1, n2);
          if (!isFinite(result) || isNaN(result)) {
            let logarithm = Math.log10(Math.abs(n1)) * n2;
            if (logarithm < 1e21) {
              let mantissa = Math.pow(10, logarithm % 1.0);
              let sign = n1 < 0 && n2 % 2 !== 0 ? '-' : '';
              result =
                sign + mantissa.toString() + 'e+' + Math.floor(logarithm);
            } else {
              result = '1e+' + logarithm.toString();
            }
          }
        } else if (operator === '%') result = n1 % n2;
        else if (operator === '//') result = Math.floor(n1 / n2);
        else if (operator === 'rt') {
          if (n2 === 0) throw new Error('Cannot take root of zero');
          result = Math.pow(n1, 1 / n2);
        } else throw new Error('Unknown operator: ' + operator);
        stack.push(result);
      }
    }
  }
  let result = stack[stack.length - 1];
  if (isNaN(result)) {
    throw new Error('Not a number');
  }
  return result;
}

export function format_out(flt) {
  if (typeof flt === 'string') {
    return flt;
  }
  if (typeof flt === 'number') {
    if (!isFinite(flt)) return 'Infinity';
    if (isNaN(flt)) return 'NaN';
    // Only round if it's a "safe" integer
    if (flt === Math.round(flt) && Math.abs(flt) < 1e16) {
      return Math.round(flt).toString();
    }
    return flt.toString();
  }
  return String(flt);
}
