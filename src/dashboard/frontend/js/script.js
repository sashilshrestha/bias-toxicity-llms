const data = [
  {
    "condition": "baseline",
    "model_name": "GPT",
    "toxicity": 0.005884908373387097,
    "severe_toxicity": 0.00012695215,
    "obscene": 0.0004921195677419355,
    "threat": 0.00025573235241935487,
    "insult": 0.0004709244669354839,
    "identity_attack": 0.00023901445322580645,
    "n_rows": 124
  },
  {
    "condition": "baseline",
    "model_name": "Gemini",
    "toxicity": 0.002528549203225806,
    "severe_toxicity": 0.00012305541048387097,
    "obscene": 0.000263110789516129,
    "threat": 0.00017747016693548385,
    "insult": 0.00025617977741935485,
    "identity_attack": 0.00038137866451612906,
    "n_rows": 124
  },
  {
    "condition": "baseline",
    "model_name": "Grok",
    "toxicity": 0.03982019214112903,
    "severe_toxicity": 0.000289097004032258,
    "obscene": 0.008949446737096774,
    "threat": 0.00031535330645161293,
    "insult": 0.014162135816129032,
    "identity_attack": 0.0006978537903225806,
    "n_rows": 124
  },
  {
    "condition": "social_eng",
    "model_name": "GPT",
    "toxicity": 0.011490127098387096,
    "severe_toxicity": 0.00013998064677419355,
    "obscene": 0.0008021687040322581,
    "threat": 0.0003352070379032258,
    "insult": 0.002060136295967742,
    "identity_attack": 0.0003460644943548387,
    "n_rows": 124
  },
  {
    "condition": "social_eng",
    "model_name": "Gemini",
    "toxicity": 0.014309387133064516,
    "severe_toxicity": 0.00014783890806451612,
    "obscene": 0.001362301218548387,
    "threat": 0.0002656711443548387,
    "insult": 0.0037565558693548385,
    "identity_attack": 0.0003434129572580645,
    "n_rows": 124
  },
  {
    "condition": "social_eng",
    "model_name": "Grok",
    "toxicity": 0.07497640004032258,
    "severe_toxicity": 0.005784373463709678,
    "obscene": 0.035341752177419354,
    "threat": 0.007671447271774193,
    "insult": 0.04104980433064516,
    "identity_attack": 0.006154076312903226,
    "n_rows": 124
  }
];

const metrics = ['toxicity', 'severe_toxicity', 'obscene', 'threat', 'insult', 'identity_attack'];
const conditions = ['baseline', 'social_eng'];
const models = [...new Set(data.map(d => d.model_name))];

function generateChartData(metric) {
  return {
	labels: models,
	datasets: conditions.map((condition) => {
	  return {
		label: condition === 'baseline' ? 'Baseline' : 'Social Engagement',
		data: models.map(model => {
		  const item = data.find(d => d.model_name === model && d.condition === condition);
		  return item ? item[metric] : null;
		}),
		borderColor: condition === 'baseline' ? '#4a90e2' : '#e27d60',
		backgroundColor: condition === 'baseline' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(226, 125, 96, 0.1)',
		fill: true,
		tension: 0.3,
		borderWidth: 3,
		pointRadius: 5,
		pointHoverRadius: 7,
		pointBackgroundColor: condition === 'baseline' ? '#4a90e2' : '#e27d60',
	  };
	})
  };
}

function createChartConfig(metric) {
  return {
	type: 'line',
	data: generateChartData(metric),
	options: {
	  responsive: true,
	  maintainAspectRatio: false,
	  plugins: {
		title: { display: false },
		legend: { display: false },
		tooltip: { mode: 'index', intersect: false },
	  },
	  scales: {
		y: { beginAtZero: true },
		x: { grid: { display: false } },
	  },
	},
  };
}

function initializeCharts() {
  const chartsGridContainer = document.getElementById('charts-grid-container');
  metrics.forEach(metric => {
	const chartTitle = metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' ');
	const chartCard = document.createElement('div');
	chartCard.classList.add('chart-card');

	chartCard.innerHTML = `
	  <div class="chart-header">
		<div class="chart-title">${chartTitle}</div>
	  </div>
	  <div class="chart-container">
		<canvas id="${metric}Chart"></canvas>
	  </div>
	`;
	chartsGridContainer.appendChild(chartCard);

	const ctx = document.getElementById(`${metric}Chart`).getContext('2d');
	new Chart(ctx, createChartConfig(metric));
  });
}

initializeCharts();
