import { regressionModels as builtInRegressionModels } from './regression-models.js';
import { saveRegressionModel } from './app-store.js';

const statisticsUrl =
  'https://cdn.jsdelivr.net/npm/simple-statistics@7.8.8/+esm';
const chartUrl = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.9/auto/+esm';

const chartColors = {
  green: '#17483d',
  coral: '#e87355',
  muted: '#718078',
  grid: '#dce2d9',
};

const regressionTypes = [];

export function registerRegressionType(regressionType) {
  if (
    !regressionType.id ||
    !regressionType.label ||
    typeof regressionType.fit !== 'function'
  ) {
    throw new Error('A regression type needs an id, label, and fit function.');
  }
  if (regressionTypes.some(({ id }) => id === regressionType.id)) {
    throw new Error(
      `Regression type "${regressionType.id}" is already registered.`,
    );
  }
  regressionType.minimumObservations ??= 2;
  regressionTypes.push(regressionType);
  const selector = document.getElementById('regression-model');
  if (
    selector &&
    !selector.querySelector(`option[value="${regressionType.id}"]`)
  ) {
    const option = document.createElement('option');
    option.value = regressionType.id;
    option.textContent = regressionType.label;
    selector.append(option);
  }
  return regressionType;
}

builtInRegressionModels.forEach(registerRegressionType);

export async function mountStatistics() {
  const [statistics, chartModule] = await Promise.all([
    import(statisticsUrl),
    import(chartUrl),
  ]);
  const elements = getElements();
  const histogram = createHistogram(chartModule.Chart, elements.histogram);
  let regressionChart;
  function analyze() {
    const parsed = parseDataset(elements.input.value);
    if (parsed.error) {
      elements.error.textContent = parsed.error;
      elements.error.hidden = false;
      return;
    }

    elements.error.hidden = true;
    elements.error.textContent = '';
    renderSummary(statistics, parsed.data, elements);
    renderHistogram(statistics, histogram, parsed.data);
    renderBoxPlot(statistics, parsed.data, elements);
    elements.count.textContent = `${parsed.data.length} ${parsed.data.length === 1 ? 'VALUE' : 'VALUES'}`;
    elements.status.textContent = `Updated from ${parsed.data.length} values.`;
  }

  elements.analyze.addEventListener('click', analyze);
  elements.type.addEventListener('change', analyze);
  const charts = { summary: histogram };
  function activateView(view) {
    setStatisticsView(view, elements, charts);
    if (view === 'regression') {
      regressionChart ??= createRegressionChart(
        chartModule.Chart,
        elements.regressionChart,
      );
      charts.regression = regressionChart;
      analyzeRegression(statistics, regressionChart, elements);
    }
  }

  elements.tabs.forEach((tab) =>
    tab.addEventListener('click', () => activateView(tab.dataset.statTab)),
  );
  elements.tabs.forEach((tab, index) =>
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? elements.tabs.length - 1
            : (index +
                (event.key === 'ArrowRight' ? 1 : -1) +
                elements.tabs.length) %
              elements.tabs.length;
      elements.tabs[nextIndex].focus();
      activateView(elements.tabs[nextIndex].dataset.statTab);
    }),
  );
  elements.regressionAnalyze.addEventListener('click', () =>
    analyzeRegression(statistics, regressionChart, elements),
  );
  elements.regressionModel.addEventListener('change', () =>
    analyzeRegression(statistics, regressionChart, elements),
  );
  elements.groupedAnalyze.addEventListener('click', () =>
    analyzeGrouped(elements),
  );
  analyze();
  analyzeRegression(statistics, null, elements);
  analyzeGrouped(elements);
}

function setStatisticsView(view, elements, charts) {
  elements.tabs.forEach((tab) => {
    const selected = tab.dataset.statTab === view;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  elements.panels.forEach((panel) => {
    panel.hidden = panel.dataset.statPanel !== view;
  });
  requestAnimationFrame(() => charts[view]?.resize());
}

function getElements() {
  const ids = [
    'statistics-input',
    'statistics-analyze',
    'statistics-type',
    'statistics-error',
    'statistics-count',
    'statistics-mean',
    'statistics-median',
    'statistics-mode',
    'statistics-deviation',
    'statistics-variance',
    'statistics-range',
    'statistics-iqr',
    'statistics-outliers',
    'statistics-histogram',
    'statistics-boxplot',
    'statistics-five-number',
    'statistics-status',
    'regression-input',
    'regression-analyze',
    'regression-model',
    'regression-error',
    'regression-count',
    'regression-equation',
    'regression-r2',
    'regression-r',
    'regression-n',
    'regression-chart',
    'regression-status',
    'grouped-input',
    'grouped-analyze',
    'grouped-error',
    'grouped-count',
    'grouped-mean',
    'grouped-median',
    'grouped-mode',
    'grouped-total',
    'grouped-table-body',
    'grouped-status',
  ];
  const elements = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const missingElement = Object.entries(elements).find(
    ([, element]) => !element,
  );
  if (missingElement) {
    throw new Error(`Statistics screen is missing #${missingElement[0]}.`);
  }

  return {
    input: elements['statistics-input'],
    analyze: elements['statistics-analyze'],
    type: elements['statistics-type'],
    error: elements['statistics-error'],
    count: elements['statistics-count'],
    mean: elements['statistics-mean'],
    median: elements['statistics-median'],
    mode: elements['statistics-mode'],
    deviation: elements['statistics-deviation'],
    variance: elements['statistics-variance'],
    range: elements['statistics-range'],
    iqr: elements['statistics-iqr'],
    outliers: elements['statistics-outliers'],
    histogram: elements['statistics-histogram'],
    boxplot: elements['statistics-boxplot'],
    fiveNumber: elements['statistics-five-number'],
    status: elements['statistics-status'],
    tabs: Array.from(document.querySelectorAll('[data-stat-tab]')),
    panels: Array.from(document.querySelectorAll('[data-stat-panel]')),
    regressionInput: elements['regression-input'],
    regressionAnalyze: elements['regression-analyze'],
    regressionModel: elements['regression-model'],
    regressionError: elements['regression-error'],
    regressionCount: elements['regression-count'],
    regressionEquation: elements['regression-equation'],
    regressionR2: elements['regression-r2'],
    regressionR: elements['regression-r'],
    regressionN: elements['regression-n'],
    regressionChart: elements['regression-chart'],
    regressionStatus: elements['regression-status'],
    groupedInput: elements['grouped-input'],
    groupedAnalyze: elements['grouped-analyze'],
    groupedError: elements['grouped-error'],
    groupedCount: elements['grouped-count'],
    groupedMean: elements['grouped-mean'],
    groupedMedian: elements['grouped-median'],
    groupedMode: elements['grouped-mode'],
    groupedTotal: elements['grouped-total'],
    groupedTableBody: elements['grouped-table-body'],
    groupedStatus: elements['grouped-status'],
  };
}

function parseDataset(text) {
  const tokens = text
    .trim()
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (!tokens.length) {
    return { error: 'Enter at least one numeric value.' };
  }

  const data = tokens.map(Number);
  if (data.some((value) => !Number.isFinite(value))) {
    return {
      error:
        'Every item must be a finite number. Separate values with spaces, commas, or new lines.',
    };
  }

  return { data };
}

function renderSummary(statistics, data, elements) {
  const sorted = [...data].sort((left, right) => left - right);
  const population = elements.type.value === 'population';
  const deviation = population
    ? statistics.standardDeviation(data)
    : data.length > 1
      ? statistics.sampleStandardDeviation(data)
      : null;
  const variance = population
    ? statistics.variance(data)
    : data.length > 1
      ? statistics.sampleVariance(data)
      : null;
  const frequencies = new Map();
  for (const value of data) {
    frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
  }
  let highestFrequency = 0;
  for (const frequency of frequencies.values()) {
    highestFrequency = Math.max(highestFrequency, frequency);
  }
  const modes = [...frequencies]
    .filter(([, frequency]) => frequency === highestFrequency)
    .map(([value]) => value);
  const modeLabel =
    highestFrequency === 1
      ? 'No repeated value'
      : modes.map(formatNumber).join(', ');
  const q1 = statistics.quantileSorted(sorted, 0.25);
  const q3 = statistics.quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const outlierCount = sorted.filter(
    (value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr,
  ).length;

  elements.mean.value = formatNumber(statistics.mean(data));
  elements.median.value = formatNumber(statistics.median(sorted));
  elements.mode.value = modeLabel;
  elements.deviation.value = deviation === null ? '—' : formatNumber(deviation);
  elements.variance.value = variance === null ? '—' : formatNumber(variance);
  elements.range.value = formatNumber(sorted[sorted.length - 1] - sorted[0]);
  elements.iqr.value = formatNumber(iqr);
  elements.outliers.value = String(outlierCount);
}

function createHistogram(Chart, canvas) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: 'rgba(23, 72, 61, 0.78)',
          hoverBackgroundColor: chartColors.coral,
          borderColor: chartColors.green,
          borderWidth: 1,
          borderRadius: 3,
          maxBarThickness: 64,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 260 },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items) => `Values ${items[0].label}`,
            label: (item) =>
              `${item.raw} ${item.raw === 1 ? 'observation' : 'observations'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: chartColors.grid },
          ticks: {
            color: chartColors.muted,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: chartColors.muted },
          grid: { color: chartColors.grid },
          border: { display: false },
        },
      },
    },
  });
}

function renderHistogram(statistics, chart, data) {
  const sorted = [...data].sort((left, right) => left - right);
  const minimum = sorted[0];
  const maximum = sorted[sorted.length - 1];
  const iqr =
    statistics.quantileSorted(sorted, 0.75) -
    statistics.quantileSorted(sorted, 0.25);
  const fdWidth = iqr > 0 ? (2 * iqr) / Math.cbrt(data.length) : 0;
  const binCount =
    minimum === maximum
      ? 1
      : clamp(
          fdWidth > 0
            ? Math.ceil((maximum - minimum) / fdWidth)
            : Math.ceil(Math.log2(data.length) + 1),
          1,
          16,
        );
  const binWidth = minimum === maximum ? 1 : (maximum - minimum) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    start: minimum + index * binWidth,
    end: index === binCount - 1 ? maximum : minimum + (index + 1) * binWidth,
    count: 0,
  }));

  for (const value of data) {
    const index =
      minimum === maximum
        ? 0
        : Math.min(binCount - 1, Math.floor((value - minimum) / binWidth));
    bins[index].count += 1;
  }

  chart.data.labels = bins.map(
    (bin) => `${formatNumber(bin.start)}–${formatNumber(bin.end)}`,
  );
  chart.data.datasets[0].data = bins.map((bin) => bin.count);
  chart.update();
}

function renderBoxPlot(statistics, data, elements) {
  const sorted = [...data].sort((left, right) => left - right);
  const minimum = sorted[0];
  const maximum = sorted[sorted.length - 1];
  const q1 = statistics.quantileSorted(sorted, 0.25);
  const median = statistics.median(sorted);
  const q3 = statistics.quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  const whiskerLow = sorted.find((value) => value >= lowFence);
  const whiskerHigh = [...sorted].reverse().find((value) => value <= highFence);
  const outliers = data.filter(
    (value) => value < whiskerLow || value > whiskerHigh,
  );
  const span = maximum - minimum;
  const domainMinimum = span === 0 ? minimum - 1 : minimum - span * 0.08;
  const domainMaximum = span === 0 ? maximum + 1 : maximum + span * 0.08;
  const x = (value) =>
    54 + ((value - domainMinimum) / (domainMaximum - domainMinimum)) * 672;
  const plotY = 67;

  const svg = createSvg('svg', {
    viewBox: '0 0 780 140',
    role: 'img',
    'aria-label': `Box plot: minimum ${formatNumber(minimum)}, first quartile ${formatNumber(q1)}, median ${formatNumber(median)}, third quartile ${formatNumber(q3)}, maximum ${formatNumber(maximum)}; ${outliers.length} outliers.`,
  });
  svg.append(
    createSvg('line', {
      x1: 54,
      x2: 726,
      y1: 112,
      y2: 112,
      stroke: chartColors.grid,
      'stroke-width': 1,
    }),
  );
  svg.append(
    createSvg('line', {
      x1: x(whiskerLow),
      x2: x(whiskerHigh),
      y1: plotY,
      y2: plotY,
      stroke: chartColors.green,
      'stroke-width': 2,
    }),
  );
  svg.append(
    createSvg('line', {
      x1: x(whiskerLow),
      x2: x(whiskerLow),
      y1: 49,
      y2: 85,
      stroke: chartColors.green,
      'stroke-width': 2,
    }),
  );
  svg.append(
    createSvg('line', {
      x1: x(whiskerHigh),
      x2: x(whiskerHigh),
      y1: 49,
      y2: 85,
      stroke: chartColors.green,
      'stroke-width': 2,
    }),
  );
  svg.append(
    createSvg('rect', {
      x: x(q1),
      y: 38,
      width: Math.max(2, x(q3) - x(q1)),
      height: 58,
      rx: 3,
      fill: 'rgba(23, 72, 61, 0.12)',
      stroke: chartColors.green,
      'stroke-width': 2,
    }),
  );
  svg.append(
    createSvg('line', {
      x1: x(median),
      x2: x(median),
      y1: 38,
      y2: 96,
      stroke: chartColors.coral,
      'stroke-width': 3,
    }),
  );

  for (const [index, value] of outliers.entries()) {
    svg.append(
      createSvg('circle', {
        cx: x(value),
        cy: plotY + (index % 2 ? -5 : 5),
        r: 4,
        fill: chartColors.coral,
        stroke: '#fffefa',
        'stroke-width': 1.5,
      }),
    );
  }

  for (let index = 0; index < 5; index += 1) {
    const value = domainMinimum + ((domainMaximum - domainMinimum) * index) / 4;
    const position = x(value);
    svg.append(
      createSvg('line', {
        x1: position,
        x2: position,
        y1: 108,
        y2: 116,
        stroke: chartColors.muted,
        'stroke-width': 1,
      }),
    );
    const label = createSvg('text', {
      x: position,
      y: 132,
      'text-anchor': 'middle',
      fill: chartColors.muted,
      'font-family': 'DM Mono, monospace',
      'font-size': 10,
    });
    label.textContent = formatNumber(value);
    svg.append(label);
  }

  elements.boxplot.replaceChildren(svg);
  const summary = [
    ['MIN', minimum],
    ['Q1', q1],
    ['MEDIAN', median],
    ['Q3', q3],
    ['MAX', maximum],
  ];
  elements.fiveNumber.replaceChildren(
    ...summary.map(([label, value]) => {
      const item = document.createElement('div');
      const name = document.createElement('span');
      const result = document.createElement('output');
      name.textContent = label;
      result.value = formatNumber(value);
      item.append(name, result);
      return item;
    }),
  );
}

function createRegressionChart(Chart, canvas) {
  return new Chart(canvas, {
    type: 'scatter',
    data: { datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 220 },
      plugins: {
        legend: { labels: { color: chartColors.muted, usePointStyle: true } },
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'X', color: chartColors.muted },
          grid: { color: chartColors.grid },
          ticks: { color: chartColors.muted },
        },
        y: {
          title: { display: true, text: 'Y', color: chartColors.muted },
          grid: { color: chartColors.grid },
          ticks: { color: chartColors.muted },
        },
      },
    },
  });
}

function analyzeRegression(statistics, chart, elements) {
  const points = parsePairs(elements.regressionInput.value);
  if (points.error) {
    elements.regressionError.textContent = points.error;
    elements.regressionError.hidden = false;
    return;
  }
  if (points.data.length < 2) {
    elements.regressionError.textContent =
      'Enter at least two paired observations.';
    elements.regressionError.hidden = false;
    return;
  }

  const regressionType = regressionTypes.find(
    ({ id }) => id === elements.regressionModel.value,
  );
  if (!regressionType) {
    elements.regressionError.textContent =
      'Choose a registered regression type.';
    elements.regressionError.hidden = false;
    return;
  }
  if (points.data.length < regressionType.minimumObservations) {
    elements.regressionError.textContent = `${regressionType.label} regression needs at least ${regressionType.minimumObservations} observations.`;
    elements.regressionError.hidden = false;
    return;
  }

  try {
    const model = regressionType.fit(points.data);
    const meanY =
      points.data.reduce((sum, point) => sum + point.y, 0) / points.data.length;
    const totalSquares = points.data.reduce(
      (sum, point) => sum + (point.y - meanY) ** 2,
      0,
    );
    const residualSquares = points.data.reduce(
      (sum, point) => sum + (point.y - model.predict(point.x)) ** 2,
      0,
    );
    const rSquared =
      totalSquares === 0 ? 1 : 1 - residualSquares / totalSquares;
    const correlation = pearsonCorrelation(points.data);
    const minimumX = Math.min(...points.data.map((point) => point.x));
    const maximumX = Math.max(...points.data.map((point) => point.x));
    const curve = Array.from({ length: 81 }, (_, index) => {
      const x = minimumX + ((maximumX - minimumX) * index) / 80;
      return { x, y: model.predict(x) };
    });

    elements.regressionError.hidden = true;
    elements.regressionError.textContent = '';
    elements.regressionCount.textContent = `${points.data.length} PAIRS`;
    elements.regressionEquation.value = model.equation;
    elements.regressionR2.value = formatNumber(rSquared);
    elements.regressionR.value = Number.isNaN(correlation)
      ? '—'
      : formatNumber(correlation);
    elements.regressionN.value = String(points.data.length);
    elements.regressionStatus.textContent = `${regressionType.label} model fitted to ${points.data.length} paired observations.`;
    if (model.expression) {
      saveRegressionModel({
        id: `regression-${regressionType.id}`,
        name: `${regressionType.label} regression`,
        expression: model.expression,
        equation: model.equation,
      });
    }
    if (chart) {
      chart.data.datasets = [
        {
          label: 'Observed',
          data: points.data,
          backgroundColor: chartColors.coral,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Fitted model',
          data: curve,
          showLine: true,
          pointRadius: 0,
          borderColor: chartColors.green,
          borderWidth: 2,
          tension: 0,
        },
      ];
      chart.update();
    }
  } catch (error) {
    elements.regressionError.textContent = error.message;
    elements.regressionError.hidden = false;
  }
}

function parsePairs(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { error: 'Enter paired x and y values, one pair per line.' };
  }
  const data = [];
  for (const [index, line] of lines.entries()) {
    const parts = line.split(/[\s,;]+/).filter(Boolean);
    if (
      parts.length !== 2 ||
      parts.some((part) => !Number.isFinite(Number(part)))
    ) {
      return {
        error: `Line ${index + 1} must contain exactly two finite numbers (x, y).`,
      };
    }
    data.push({ x: Number(parts[0]), y: Number(parts[1]) });
  }
  return { data };
}

function pearsonCorrelation(points) {
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const covariance = points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const sumX = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const sumY = points.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  return sumX && sumY ? covariance / Math.sqrt(sumX * sumY) : Number.NaN;
}

function analyzeGrouped(elements) {
  const parsed = parseGroupedData(elements.groupedInput.value);
  if (parsed.error) {
    elements.groupedError.textContent = parsed.error;
    elements.groupedError.hidden = false;
    return;
  }
  const classes = parsed.data;
  const total = classes.reduce((sum, item) => sum + item.frequency, 0);
  const weightedTotal = classes.reduce(
    (sum, item) => sum + item.midpoint * item.frequency,
    0,
  );
  if (!total) {
    elements.groupedError.textContent =
      'The total frequency must be greater than zero.';
    elements.groupedError.hidden = false;
    return;
  }

  const mean = weightedTotal / total;
  let cumulative = 0;
  const medianClassIndex = classes.findIndex((item) => {
    cumulative += item.frequency;
    return cumulative >= total / 2;
  });
  const medianClass = classes[medianClassIndex];
  const beforeMedian = classes
    .slice(0, medianClassIndex)
    .reduce((sum, item) => sum + item.frequency, 0);
  const median =
    medianClass.lower +
    ((total / 2 - beforeMedian) / medianClass.frequency) * medianClass.width;
  const modalIndex = classes.reduce(
    (best, item, index) =>
      item.frequency > classes[best].frequency ? index : best,
    0,
  );
  const modalClass = classes[modalIndex];
  const previousFrequency = classes[modalIndex - 1]?.frequency ?? 0;
  const nextFrequency = classes[modalIndex + 1]?.frequency ?? 0;
  const modalDenominator =
    2 * modalClass.frequency - previousFrequency - nextFrequency;
  const mode =
    modalDenominator === 0
      ? modalClass.midpoint
      : modalClass.lower +
        ((modalClass.frequency - previousFrequency) / modalDenominator) *
          modalClass.width;

  elements.groupedError.hidden = true;
  elements.groupedError.textContent = '';
  elements.groupedCount.textContent = `${classes.length} CLASSES`;
  elements.groupedMean.value = formatNumber(mean);
  elements.groupedMedian.value = formatNumber(median);
  elements.groupedMode.value = formatNumber(mode);
  elements.groupedTotal.value = formatNumber(total);
  let runningTotal = 0;
  elements.groupedTableBody.replaceChildren(
    ...classes.map((item) => {
      runningTotal += item.frequency;
      const row = document.createElement('tr');
      for (const text of [
        item.label,
        formatNumber(item.midpoint),
        formatNumber(item.frequency),
        `${formatNumber((item.frequency / total) * 100)}%`,
        formatNumber(runningTotal),
      ]) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      }
      return row;
    }),
  );
  elements.groupedStatus.textContent = `Grouped estimates calculated from ${total} observations across ${classes.length} classes.`;
}

function parseGroupedData(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length)
    return {
      error: 'Enter class intervals and frequencies, one class per line.',
    };
  const data = [];
  for (const [index, line] of lines.entries()) {
    const match = line.match(
      /^\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*[-–]\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*[,;\s]+(\d+(?:\.\d*)?)\s*$/,
    );
    if (!match) return { error: `Line ${index + 1} must look like 10-20, 7.` };
    const lower = Number(match[1]);
    const upper = Number(match[2]);
    const frequency = Number(match[3]);
    if (!(upper > lower) || !Number.isInteger(frequency) || frequency < 0) {
      return {
        error: `Line ${index + 1} needs an increasing interval and a non-negative whole-number frequency.`,
      };
    }
    if (data.length && lower < data[data.length - 1].upper) {
      return { error: `Line ${index + 1} overlaps or is out of order.` };
    }
    data.push({
      lower,
      upper,
      width: upper - lower,
      frequency,
      midpoint: (lower + upper) / 2,
      label: `${formatNumber(lower)}–${formatNumber(upper)}`,
    });
  }
  return { data };
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 6,
  }).format(value);
}

function createSvg(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
