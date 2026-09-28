import { monads, isNumberString, isDigit } from './core.js';

export function splitExpression(exp) {
  let split = [];
  let e = exp.trim();
  let i = 0;
  while (i < e.length) {
    if ('()'.includes(e[i])) {
      split.push(e[i]);
      i++;
    } else {
      let match_found = false;
      for (let length = 7; length >= 2; length--) {
        if (monads.includes(e.slice(i, i + length))) {
          split.push(e.slice(i, i + length));
          i += length;
          match_found = true;
          break;
        }
      }
      if (!match_found) {
        if (
          isDigit(e[i]) ||
          (e[i] === '.' && i + 1 < e.length && isDigit(e[i + 1]))
        ) {
          let num = '';
          let hasDot = false;
          while (i < e.length && (isDigit(e[i]) || (!hasDot && e[i] === '.'))) {
            if (e[i] === '.') hasDot = true;
            num += e[i];
            i++;
          }
          // Handle scientific notation
          if (i < e.length && (e[i] === 'e' || e[i] === 'E')) {
            num += e[i++];
            if (i < e.length && (e[i] === '+' || e[i] === '-')) {
              num += e[i++];
            }
            while (i < e.length && isDigit(e[i])) {
              num += e[i++];
            }
          }
          split.push(num);
        } else if (
          e[i] === '-' &&
          (i === 0 || !isNumberString(e[i - 1])) &&
          i < e.length - 1 &&
          isNumberString(e[i + 1])
        ) {
          split.push('neg');
          i++;
        } else {
          split.push(e[i]);
          i++;
        }
      }
    }
  }
  return split.map((s) => s.trim());
}

export function prec(c) {
  if (['%', '//'].includes(c)) {
    return 4;
  } else if (['^', 'rt'].includes(c)) {
    return 3;
  } else if (['/', '*'].includes(c)) {
    return 2;
  } else if (['+', '-'].includes(c)) {
    return 1;
  } else if (monads.includes(c)) {
    return 5;
  } else {
    return -1;
  }
}
