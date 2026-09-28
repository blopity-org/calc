import { splitExpression } from './parser.js';
import { topostfix } from './postfix.js';
import { evalpostfix, format_out } from './eval.js';

export function evaluate(expr) {
  if (expr === '') {
    return 'Error: Empty expression';
  }
  if (splitExpression(expr.replace(/ /g, '')).length < 2) {
    return parseFloat(expr);
  }
  let ans = evalpostfix(topostfix(splitExpression(expr.replace(/ /g, ''))));
  return ans;
}

export function parse(expr) {
  return format_out(evaluate(expr));
}
