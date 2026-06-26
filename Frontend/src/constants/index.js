export const TRENDING_TOPICS = [
  'Eigenvalue Decomposition',
  'Stochastic Calculus',
  'Graph Theory',
  'Fourier Transform',
  'Bayesian Inference',
  'Topology'
];

export const ANALYTICS_DATA = [
  { name: 'Mon', searches: 400, ai: 240 },
  { name: 'Tue', searches: 300, ai: 139 },
  { name: 'Wed', searches: 200, ai: 980 },
  { name: 'Thu', searches: 278, ai: 390 },
  { name: 'Fri', searches: 189, ai: 480 },
  { name: 'Sat', searches: 239, ai: 380 },
  { name: 'Sun', searches: 349, ai: 430 },
];

export const TOPIC_DISTRIBUTION = [
  { name: 'Algebra', value: 400 },
  { name: 'Calculus', value: 300 },
  { name: 'Statistics', value: 300 },
  { name: 'Discrete', value: 200 },
];

export const COLORS = ['#534AB7', '#7C3AED', '#A78BFA', '#DDD6FE'];

export const INGESTION_DATA = [
  { name: 'MON', phase1: 400, phase2: 240 },
  { name: 'TUE', phase1: 300, phase2: 139 },
  { name: 'WED', phase1: 200, phase2: 980 },
  { name: 'THU', phase1: 278, phase2: 390 },
  { name: 'FRI', phase1: 189, phase2: 480 },
  { name: 'SAT', phase1: 239, phase2: 380 },
  { name: 'SUN', phase1: 349, phase2: 430 },
];

export const PR_CURVE_DATA = [
  { recall: 0, precision: 100 },
  { recall: 10, precision: 95 },
  { recall: 20, precision: 92 },
  { recall: 30, precision: 88 },
  { recall: 40, precision: 85 },
  { recall: 50, precision: 80 },
  { recall: 60, precision: 75 },
  { recall: 70, precision: 68 },
  { recall: 80, precision: 55 },
  { recall: 90, precision: 35 },
  { recall: 100, precision: 10 },
];

export const INDEX_TERMS = [
  { term: '$\\\\lambda$-calculus', frequency: '14,201', docs: ['DOC_0011', 'DOC_1290', 'DOC_5532'], others: 502 },
  { term: 'Riemannian manifold', frequency: '8,912', docs: ['DOC_3311', 'DOC_0029'], others: 112 },
  { term: 'Stochastic gradient', frequency: '24,110', docs: ['DOC_9921', 'DOC_1111'], others: 2401 },
  { term: 'Quantum entanglement', frequency: '5,630', docs: ['DOC_7653', 'DOC_3342'], others: 89 },
  { term: 'Graph Laplacian', frequency: '12,450', docs: ['DOC_4421', 'DOC_9981'], others: 312 },
  { term: 'Monte Carlo', frequency: '19,230', docs: ['DOC_1211', 'DOC_2222'], others: 1205 },
];

export const EMBEDDING_DATA = Array.from({ length: 50 }, (_, i) => ({
  x: Math.round(Math.random() * 100 - 50),
  y: Math.round(Math.random() * 100 - 50),
  z: Math.round(Math.random() * 200 + 50),
  cluster: i < 15 ? 'Algebra' : i < 30 ? 'Calculus' : 'Statistics'
}));
