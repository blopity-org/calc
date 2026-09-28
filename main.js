import { splitExpression } from './parser.js';
import { topostfix } from './postfix.js';
import { evalpostfix, format_out } from './eval.js';

export function evaluate(expr, variables = {}) {
  if (expr === '') {
    return 'Error: Empty expression';
  }
  const tokens = splitExpression(expr.replace(/ /g, ''));
  if (
    tokens.length === 1 &&
    /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(tokens[0])
  ) {
    return parseFloat(expr);
  }
  let ans = evalpostfix(topostfix(tokens), variables);
  return ans;
}

export function parse(expr, variables = {}) {
  return format_out(evaluate(expr, variables));
}
