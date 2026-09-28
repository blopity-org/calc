export const regressionModels = [
  {
    id: 'linear',
    label: 'Linear',
    minimumObservations: 2,
    fit: (points) => fitPolynomial(points, 1),
  },
  {
    id: 'quadratic',
    label: 'Quadratic',
    minimumObservations: 3,
    fit: (points) => fitPolynomial(points, 2),
  },
  {
    id: 'cubic',
    label: 'Cubic',
    minimumObservations: 4,
    fit: (points) => fitPolynomial(points, 3),
  },
  {
    id: 'quartic',
    label: 'Quartic',
    minimumObservations: 5,
    fit: (points) => fitPolynomial(points, 4),
  },
  {
    id: 'exponential',
    label: 'ExpReg',
    minimumObservations: 2,
    fit: (points) =>
      fitTransformed(
        points,
        (point) => point.x,
        (point) => {
          if (point.y <= 0)
            throw new Error('ExpReg requires positive y values.');
          return Math.log(point.y);
        },
        ([intercept, slope]) => ({
          equation: `y = ${format(intercept)} · e^(${format(slope)}x)`,
          expression: `exp(${intercept}+${slope}*x)`,
          predict: (x) => Math.exp(intercept + slope * x),
        }),
      ),
  },
  {
    id: 'power',
    label: 'PowerReg',
    minimumObservations: 2,
    fit: (points) =>
      fitTransformed(
        points,
        (point) => {
          if (point.x <= 0)
            throw new Error('PowerReg requires positive x values.');
          return Math.log(point.x);
        },
        (point) => {
          if (point.y <= 0)
            throw new Error('PowerReg requires positive y values.');
          return Math.log(point.y);
        },
        ([intercept, exponent]) => ({
          equation: `y = ${format(Math.exp(intercept))}x^${format(exponent)}`,
          expression: `exp(${intercept})*x^${exponent}`,
          predict: (x) => Math.exp(intercept) * x ** exponent,
        }),
      ),
  },
  {
    id: 'logarithmic',
    label: 'LnReg',
    minimumObservations: 2,
    fit: (points) =>
      fitTransformed(
        points,
        (point) => {
          if (point.x <= 0)
            throw new Error('LnReg requires positive x values.');
          return Math.log(point.x);
        },
        (point) => point.y,
        ([intercept, slope]) => ({
          equation: `y = ${format(intercept)} + ${format(slope)} ln(x)`,
          expression: `${intercept}+${slope}*ln(x)`,
          predict: (x) => intercept + slope * Math.log(x),
        }),
      ),
  },
  {
    id: 'logistic',
    label: 'Logistic',
    minimumObservations: 3,
    fit: (points) => {
      const maximumY = Math.max(...points.map(({ y }) => y));
      const limit = maximumY > 0 ? maximumY * 1.1 : 0;
      if (limit <= 0 || points.some(({ y }) => y <= 0 || y >= limit)) {
        throw new Error('Logistic regression requires positive y values.');
      }
      const line = fitPolynomial(
        points.map(({ x, y }) => ({ x, y: Math.log(limit / y - 1) })),
        1,
      );
      const [intercept, slope] = line.coefficients;
      return {
        equation: `y = ${format(limit)} / (1 + e^(${format(intercept)} + ${format(slope)}x))`,
        expression: `${limit}/(1+exp(${intercept}+${slope}*x))`,
        predict: (x) => limit / (1 + Math.exp(intercept + slope * x)),
      };
    },
  },
];

function fitTransformed(points, transformX, transformY, buildModel) {
  const line = fitPolynomial(
    points.map((point) => ({ x: transformX(point), y: transformY(point) })),
    1,
  );
  return buildModel(line.coefficients);
}

function fitPolynomial(points, degree) {
  const size = degree + 1;
  const matrix = Array.from({ length: size }, (_, row) => {
    const values = Array.from({ length: size }, (_, column) =>
      points.reduce((sum, point) => sum + point.x ** (row + column), 0),
    );
    values.push(
      points.reduce((sum, point) => sum + point.y * point.x ** row, 0),
    );
    return values;
  });
  const coefficients = solveLinearSystem(matrix);
  const terms = coefficients
    .map((coefficient, power) => `${coefficient}*x^${power}`)
    .reverse();
  const equation = coefficients
    .map((coefficient, power) => ({ coefficient, power }))
    .reverse()
    .map(({ coefficient, power }, index) => {
      const sign = coefficient < 0 ? '−' : index ? '+' : '';
      const magnitude = format(Math.abs(coefficient));
      const variable = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`;
      return `${index ? ` ${sign} ` : sign}${magnitude}${variable}`;
    })
    .join('');
  return {
    coefficients,
    predict: (x) =>
      coefficients.reduce(
        (sum, coefficient, power) => sum + coefficient * x ** power,
        0,
      ),
    equation: `y = ${equation}`,
    expression: terms.join('+'),
  };
}

function solveLinearSystem(matrix) {
  const size = matrix.length;
  for (let pivot = 0; pivot < size; pivot += 1) {
    let bestRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][pivot]) > Math.abs(matrix[bestRow][pivot]))
        bestRow = row;
    }
    [matrix[pivot], matrix[bestRow]] = [matrix[bestRow], matrix[pivot]];
    if (Math.abs(matrix[pivot][pivot]) < Number.EPSILON) {
      throw new Error(
        'Regression cannot be fit: the x values do not vary enough.',
      );
    }
    const divisor = matrix[pivot][pivot];
    for (let column = pivot; column <= size; column += 1)
      matrix[pivot][column] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = matrix[row][pivot];
      for (let column = pivot; column <= size; column += 1)
        matrix[row][column] -= factor * matrix[pivot][column];
    }
  }
  return matrix.map((row) => row[size]);
}

function format(value) {
  return Number(value.toPrecision(12)).toString();
}
