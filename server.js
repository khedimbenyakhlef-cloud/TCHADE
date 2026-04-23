/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          SAHEL SENTINEL — SYSTÈME C2 MULTIDOMAINE              ║
 * ║     Fondé par KHEDIM BENYAKHLEF dit BENY-JOE                  ║
 * ║     Dédié au Peuple du Tchad & du Sahel                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-Memory Data Store (stockage en mémoire RAM) ────
const dataStore = {
  alerts: [],
  detections: [],
  reports: [],
  assets: [
    { id: 'SAT-001', type: 'satellite', name: 'SENTINEL-SAT-1', status: 'ACTIF', lat: 15.4542, lon: 18.7322, altitude: 36000, coverage: 'Zone Nord Tchad' },
    { id: 'UAV-001', type: 'drone', name: 'UAV-SAHEL-ALPHA', status: 'ACTIF', lat: 12.1348, lon: 15.0557, altitude: 5000, coverage: 'N\'Djamena Périphérie' },
    { id: 'UAV-002', type: 'drone', name: 'UAV-SAHEL-BETA', status: 'EN MISSION', lat: 13.4531, lon: 14.4524, altitude: 3500, coverage: 'Lac Tchad' },
    { id: 'RAD-001', type: 'radar', name: 'RADAR-NDJAMENA', status: 'ACTIF', lat: 12.1348, lon: 15.0557, portee: '300km', coverage: 'Centre' },
    { id: 'RAD-002', type: 'radar', name: 'RADAR-ABÉCHÉ', status: 'ACTIF', lat: 13.8298, lon: 20.8324, portee: '200km', coverage: 'Est Tchad' },
    { id: 'THERM-001', type: 'thermique', name: 'CAPTEUR-THERM-1', status: 'ACTIF', lat: 14.1190, lon: 15.3022, coverage: 'Frontière Niger' },
    { id: 'INT-001', type: 'renseignement', name: 'CELLULE-RENS-A', status: 'ACTIF', lat: 12.1348, lon: 15.0557, coverage: 'National' }
  ],
  threatZones: [
    { id: 'TZ-001', name: 'Zone Lac Tchad', risk: 'CRITIQUE', lat: 13.3, lon: 14.1, radius: 80, threats: ['terrorisme', 'trafic'] },
    { id: 'TZ-002', name: 'Frontière Libye', risk: 'ÉLEVÉ', lat: 22.5, lon: 15.2, radius: 120, threats: ['contrebande', 'armes'] },
    { id: 'TZ-003', name: 'Frontière Soudan', risk: 'ÉLEVÉ', lat: 13.5, lon: 22.0, radius: 100, threats: ['trafic_humain', 'terrorisme'] },
    { id: 'TZ-004', name: 'Corridor Central', risk: 'MODÉRÉ', lat: 15.0, lon: 18.0, radius: 150, threats: ['narcotrafic', 'blanchiment'] }
  ]
};

// ─── Threat categories with icons & codes ─────────────────────────
const THREAT_TYPES = {
  terrorisme:      { label: 'Terrorisme',            labelAr: 'إرهاب',              icon: '💣', code: 'TER', color: '#ff1744', priority: 1 },
  narcotrafic:     { label: 'Narcotrafic',            labelAr: 'تهريب المخدرات',     icon: '💊', code: 'NAR', color: '#aa00ff', priority: 2 },
  blanchiment:     { label: 'Blanchiment d\'argent',  labelAr: 'غسيل الأموال',       icon: '💰', code: 'BLA', color: '#ffd600', priority: 2 },
  trafic_humain:   { label: 'Trafic d\'êtres humains',labelAr: 'الاتجار بالبشر',     icon: '👤', code: 'THU', color: '#d50000', priority: 1 },
  trafic_animal:   { label: 'Trafic d\'animaux',      labelAr: 'الاتجار بالحيوانات', icon: '🦁', code: 'TAN', color: '#ff6d00', priority: 3 },
  epidemie:        { label: 'Épidémie / Santé',        labelAr: 'وباء',               icon: '🦠', code: 'EPI', color: '#00bcd4', priority: 1 },
  corruption_jud:  { label: 'Corruption Judiciaire',  labelAr: 'فساد قضائي',         icon: '⚖️', code: 'CJU', color: '#795548', priority: 2 },
  corruption_bur:  { label: 'Corruption Bureaucratique', labelAr: 'فساد إداري',      icon: '📋', code: 'CBU', color: '#8d6e63', priority: 3 },
  contrebande:     { label: 'Contrebande',             labelAr: 'تهريب البضائع',      icon: '📦', code: 'CON', color: '#ff9100', priority: 2 },
  armes:           { label: 'Trafic d\'armes',         labelAr: 'الاتجار بالأسلحة',   icon: '🔫', code: 'ARM', color: '#b71c1c', priority: 1 },
  clandestin:      { label: 'Activité Clandestine',   labelAr: 'نشاط سري',           icon: '🕵️', code: 'CLA', color: '#455a64', priority: 2 },
  cybermenace:     { label: 'Cybermenace',             labelAr: 'تهديد إلكتروني',     icon: '💻', code: 'CYB', color: '#00e5ff', priority: 2 }
};

const DETECTION_SOURCES = ['SATELLITE', 'DRONE-UAV', 'RADAR', 'CAPTEUR-THERMIQUE', 'RENSEIGNEMENT-HUMAIN', 'ÉCOUTE-TELECOM', 'ANALYSE-RESEAUX', 'SIGNAL-INTELLIGENCE'];

// ─── Routes ────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// API: Get all detections
app.get('/api/detections', (req, res) => {
  const { type, priority, limit = 50 } = req.query;
  let result = [...dataStore.detections];
  if (type) result = result.filter(d => d.threatType === type);
  if (priority) result = result.filter(d => d.priority <= parseInt(priority));
  res.json({ success: true, count: result.length, data: result.slice(0, parseInt(limit)) });
});

// API: Create manual detection
app.post('/api/detections', (req, res) => {
  const { threatType, lat, lon, description, source, confidence } = req.body;
  const detection = createDetection({ threatType, lat, lon, description, source, confidence, manual: true });
  dataStore.detections.unshift(detection);
  io.emit('new_detection', detection);
  res.json({ success: true, data: detection });
});

// API: Get all alerts
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, count: dataStore.alerts.length, data: dataStore.alerts.slice(0, 100) });
});

// API: Get assets
app.get('/api/assets', (req, res) => {
  res.json({ success: true, data: dataStore.assets });
});

// API: Get threat zones
app.get('/api/threat-zones', (req, res) => {
  res.json({ success: true, data: dataStore.threatZones });
});

// API: Get stats
app.get('/api/stats', (req, res) => {
  const today = moment().startOf('day');
  const todayDetections = dataStore.detections.filter(d => moment(d.timestamp).isAfter(today));
  const byType = {};
  Object.keys(THREAT_TYPES).forEach(t => { byType[t] = dataStore.detections.filter(d => d.threatType === t).length; });
  res.json({
    success: true,
    data: {
      total_detections: dataStore.detections.length,
      today_detections: todayDetections.length,
      active_alerts: dataStore.alerts.filter(a => a.status === 'ACTIF').length,
      active_assets: dataStore.assets.filter(a => a.status === 'ACTIF').length,
      threat_zones: dataStore.threatZones.length,
      by_type: byType,
      last_update: new Date().toISOString()
    }
  });
});

// API: Generate PDF report
app.post('/api/reports/generate', (req, res) => {
  const { detectionIds, title, period } = req.body;
  const reportId = uuidv4();
  const detections = detectionIds
    ? dataStore.detections.filter(d => detectionIds.includes(d.id))
    : dataStore.detections.slice(0, 20);

  const report = {
    id: reportId,
    title: title || `Rapport Opérationnel — ${moment().format('DD/MM/YYYY HH:mm')}`,
    generated_at: new Date().toISOString(),
    generated_by: 'SAHEL SENTINEL C2',
    founder: 'KHEDIM BENYAKHLEF dit BENY-JOE',
    period: period || 'Dernières 24h',
    detections_count: detections.length,
    detections: detections,
    summary: generateReportSummary(detections),
    recommendations: generateRecommendations(detections)
  };

  dataStore.reports.unshift(report);
  res.json({ success: true, data: report });
});

// API: Get reports
app.get('/api/reports', (req, res) => {
  res.json({ success: true, data: dataStore.reports });
});

// API: Threat types reference
app.get('/api/threat-types', (req, res) => {
  res.json({ success: true, data: THREAT_TYPES });
});

// ─── Helper Functions ──────────────────────────────────────────────
function createDetection({ threatType, lat, lon, description, source, confidence, manual = false }) {
  const threat = THREAT_TYPES[threatType] || THREAT_TYPES.clandestin;
  const id = uuidv4();
  const detection = {
    id,
    threatType,
    threat_info: threat,
    lat: lat || (10 + Math.random() * 14),
    lon: lon || (13 + Math.random() * 11),
    description: description || generateDescription(threatType),
    source: source || DETECTION_SOURCES[Math.floor(Math.random() * DETECTION_SOURCES.length)],
    confidence: confidence || Math.floor(65 + Math.random() * 35),
    priority: threat.priority,
    status: 'ACTIF',
    timestamp: new Date().toISOString(),
    manual,
    report_required: threat.priority <= 2
  };

  // Create alert if high priority
  if (detection.priority === 1) {
    const alert = {
      id: uuidv4(),
      detection_id: id,
      level: 'CRITIQUE',
      message: `⚠️ ALERTE CRITIQUE: ${threat.label} détecté — ${detection.source}`,
      messageAr: `⚠️ تنبيه حرج: ${threat.labelAr} تم اكتشافه`,
      timestamp: new Date().toISOString(),
      status: 'ACTIF'
    };
    dataStore.alerts.unshift(alert);
    io.emit('critical_alert', alert);
  }

  return detection;
}

function generateDescription(type) {
  const descriptions = {
    terrorisme: 'Mouvement suspect de groupe armé détecté aux coordonnées. Analyse thermique confirme présence humaine multiple. Vérification en cours.',
    narcotrafic: 'Convoi non identifié détecté en dehors des voies officielles. Signature radar anormale. Interception recommandée.',
    blanchiment: 'Transactions financières anormales détectées via analyse des réseaux. Montants suspects. Transmission aux autorités financières.',
    trafic_humain: 'Groupe de personnes détecté en zone désertique isolée. Conditions de déplacement suspectes. Assistance humanitaire et investigation requises.',
    trafic_animal: 'Véhicule transportant charges biologiques non déclarées détecté. Inspection vétérinaire requise.',
    epidemie: 'Concentration anormale de cas signalés dans le secteur. Protocole sanitaire d\'urgence activé.',
    corruption_jud: 'Comportement atypique détecté dans les flux de données judiciaires. Audit interne requis.',
    corruption_bur: 'Irrégularité administrative signalée. Vérification des procédures en cours.',
    contrebande: 'Marchandises non déclarées détectées au passage. Analyse douanière requise.',
    armes: 'Transport d\'objets métalliques denses détecté par radar. Interception prioritaire.',
    clandestin: 'Activité nocturne suspecte détectée. Surveillance renforcée activée.',
    cybermenace: 'Tentative d\'intrusion détectée sur infrastructure critique. Contre-mesures activées.'
  };
  return descriptions[type] || 'Activité suspecte détectée. Investigation en cours.';
}

function generateReportSummary(detections) {
  const criticals = detections.filter(d => d.priority === 1).length;
  const byType = {};
  detections.forEach(d => { byType[d.threatType] = (byType[d.threatType] || 0) + 1; });
  return {
    total: detections.length,
    criticals,
    by_type: byType,
    zones_affected: [...new Set(detections.map(d => `${d.lat.toFixed(1)},${d.lon.toFixed(1)}`))].length,
    recommendation: criticals > 0 ? 'INTERVENTION IMMÉDIATE REQUISE' : 'SURVEILLANCE CONTINUE RECOMMANDÉE'
  };
}

function generateRecommendations(detections) {
  const recs = [];
  if (detections.some(d => d.threatType === 'terrorisme')) recs.push('Déploiement d\'unités spécialisées anti-terrorisme recommandé');
  if (detections.some(d => d.threatType === 'trafic_humain')) recs.push('Coordination avec organisations humanitaires internationales requise');
  if (detections.some(d => d.threatType === 'epidemie')) recs.push('Activation protocole sanitaire d\'urgence OMS');
  if (detections.some(d => d.threatType === 'narcotrafic')) recs.push('Coordination avec INTERPOL et agences anti-drogue internationales');
  if (recs.length === 0) recs.push('Maintenir surveillance standard selon protocole en vigueur');
  return recs;
}

// ─── Simulation Engine (désactivable en prod réelle) ──────────────
let simulationActive = true;
const TCHAD_BOUNDS = { latMin: 7.5, latMax: 23.5, lonMin: 13.4, lonMax: 24.0 };

function generateSimulatedDetection() {
  if (!simulationActive) return;
  const types = Object.keys(THREAT_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const lat = TCHAD_BOUNDS.latMin + Math.random() * (TCHAD_BOUNDS.latMax - TCHAD_BOUNDS.latMin);
  const lon = TCHAD_BOUNDS.lonMin + Math.random() * (TCHAD_BOUNDS.lonMax - TCHAD_BOUNDS.lonMin);
  const detection = createDetection({ threatType: type, lat, lon });
  dataStore.detections.unshift(detection);
  if (dataStore.detections.length > 500) dataStore.detections = dataStore.detections.slice(0, 500);
  io.emit('new_detection', detection);
}

// Génère des détections toutes les 15-45 secondes
cron.schedule('*/30 * * * * *', () => { if (Math.random() > 0.3) generateSimulatedDetection(); });

// Mise à jour positions assets toutes les 10s
cron.schedule('*/10 * * * * *', () => {
  dataStore.assets = dataStore.assets.map(asset => {
    if (asset.type === 'drone' && asset.status !== 'HORS SERVICE') {
      return { ...asset, lat: asset.lat + (Math.random() - 0.5) * 0.05, lon: asset.lon + (Math.random() - 0.5) * 0.05 };
    }
    return asset;
  });
  io.emit('assets_update', dataStore.assets);
});

// ─── Socket.IO ────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[SENTINEL] Opérateur connecté: ${socket.id}`);
  socket.emit('init_data', {
    detections: dataStore.detections.slice(0, 50),
    alerts: dataStore.alerts.slice(0, 20),
    assets: dataStore.assets,
    threatZones: dataStore.threatZones,
    threatTypes: THREAT_TYPES
  });

  socket.on('toggle_simulation', (state) => {
    simulationActive = state;
    io.emit('simulation_status', simulationActive);
  });

  socket.on('manual_detection', (data) => {
    const detection = createDetection({ ...data, manual: true });
    dataStore.detections.unshift(detection);
    io.emit('new_detection', detection);
  });

  socket.on('resolve_alert', (alertId) => {
    const alert = dataStore.alerts.find(a => a.id === alertId);
    if (alert) { alert.status = 'RÉSOLU'; io.emit('alert_updated', alert); }
  });

  socket.on('disconnect', () => console.log(`[SENTINEL] Opérateur déconnecté: ${socket.id}`));
});

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         SAHEL SENTINEL — SYSTÈME C2 MULTIDOMAINE        ║
║   Fondé par KHEDIM BENYAKHLEF dit BENY-JOE              ║
║   Serveur opérationnel sur http://localhost:${PORT}       ║
╚══════════════════════════════════════════════════════════╝
  `);
  // Pré-charger quelques détections initiales
  for (let i = 0; i < 15; i++) generateSimulatedDetection();
});
