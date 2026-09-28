export const is_degrees = false;
export const monads = [
    "!", "sqrt", "neg", "sin", "cos", "tan",
    "ln", "log", "exp",
    "sinh", "cosh", "tanh", "asin", "acos", "atan",
    "asinh", "acosh", "atanh", "gamma"
];

export function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Lanczos approximation for the gamma function
export function gamma(z) {
    const g = 7;
    const p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];
    if (z < 0.5) {
        // Reflection formula
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    } else {
        z -= 1;
        let x = p[0];
        for (let i = 1; i < g + 2; i++) {
            x += p[i] / (z + i);
        }
        let t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }
}


export function sqrt(n) { return Math.sqrt(n); }
export function neg(n) { return -n; }

export function trigop(_angle, _trigop) {
    return is_degrees ? _trigop(degToRad(_angle)) : _trigop(_angle);
}
export function atrigop(_value, _atrigop) {
    return is_degrees ? radToDeg(_atrigop(_value)) : _atrigop(_value);
}
export function degToRad(deg) { return deg * Math.PI / 180; }
export function radToDeg(rad) { return rad * 180 / Math.PI; }

// Trigonometric functions
export function sin(angle)   { return trigop(angle, Math.sin); }
export function cos(angle)   { return trigop(angle, Math.cos); }
export function tan(angle)   { return trigop(angle, Math.tan); }
export function sinh(angle)  { return trigop(angle, Math.sinh); }
export function cosh(angle)  { return trigop(angle, Math.cosh); }
export function tanh(angle)  { return trigop(angle, Math.tanh); }

// Inverse trigonometric functions
export function asin(value)  { return atrigop(value, Math.asin); }
export function acos(value)  { return atrigop(value, Math.acos); }
export function atan(value)  { return atrigop(value, Math.atan); }
export function asinh(value) { return atrigop(value, Math.asinh); }
export function acosh(value) { return atrigop(value, Math.acosh); }
export function atanh(value) { return atrigop(value, Math.atanh); }

export function isNumberString(str) {
    // Matches integers, decimals, and scientific notation (e.g., 5e5, 1.2e-3)
    return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(str);
}

export function isDigit(ch) {
    return ch >= '0' && ch <= '9';
}