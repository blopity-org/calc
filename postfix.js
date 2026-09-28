import { isNumberString, monads } from './core.js';
import { prec } from './parser.js';

export function topostfix(split) {
  let postfix = [];
  let stack = [];
  let c;
  for (let i = 0; i < split.length; i++) {
    c = split[i];
    if (isNumberString(c)) {
      postfix.push(c);
    } else if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        postfix.push(stack.pop());
      }
      stack.pop();
    } else if (c === '!') {
      postfix.push(c);
    } else {
      while (stack.length > 0 && prec(c) < prec(stack[stack.length - 1])) {
        postfix.push(stack.pop());
      }
      stack.push(c);
    }
  }
  while (stack.length > 0) {
    postfix.push(stack.pop());
  }
  return postfix;
}
