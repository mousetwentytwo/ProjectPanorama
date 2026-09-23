// Tunables for the installation. Edit freely on site.
window.WH = window.WH || {};
WH.config = {
  // Display mode: hands | rain | burst | constellation | ripple | puppet | wave (set in the menu, or ?mode=...)
  mode: 'hands',
  rainCount: 170,
  // Wave mode (fluid dot plane + banners); all multipliers, 1 = default.
  wave: { amplitude: 1, wavelength: 1, speed: 1, choppiness: 0.5, density: 1, banners: 5,
          colors: ['#8a5cff', '#34e7ff'] },          // particles in the rain / swarm mode
  leapUrl: 'ws://127.0.0.1:6437/v6.json',
  // Default word sets (AI summit / IT / software company vocabulary). A grab (fist) cycles sets.
  // Can be overridden at runtime via the config menu (press C), stored in this browser.
  wordSets: [
    ['ARTIFICIAL INTELLIGENCE', 'GENERATIVE AI', 'LLM', 'FOUNDATION MODELS', 'AGENTS', 'AGENTIC AI',
     'PROMPT ENGINEERING', 'RAG', 'EMBEDDINGS', 'VECTOR DATABASE', 'FINE-TUNING', 'INFERENCE',
     'TRANSFORMERS', 'MULTIMODAL', 'COMPUTER VISION', 'NLP', 'REINFORCEMENT LEARNING',
     'NEURAL NETWORKS', 'DEEP LEARNING', 'MACHINE LEARNING', 'CONTEXT WINDOW', 'TOKENS',
     'REASONING', 'ALIGNMENT', 'AI SAFETY', 'RESPONSIBLE AI', 'EVALS', 'GUARDRAILS', 'COPILOT',
     'MCP', 'TOOL USE', 'SYNTHETIC DATA', 'MLOPS', 'GPU', 'TPU', 'EDGE AI', 'SMALL MODELS',
     'OPEN WEIGHTS', 'AI GOVERNANCE', 'EXPLAINABILITY'],
    ['SOFTWARE ENGINEERING', 'CLOUD NATIVE', 'KUBERNETES', 'MICROSERVICES', 'SERVERLESS', 'API',
     'DEVOPS', 'PLATFORM ENGINEERING', 'CI/CD', 'GITOPS', 'INFRASTRUCTURE AS CODE', 'TERRAFORM',
     'DOCKER', 'OBSERVABILITY', 'SRE', 'OPEN SOURCE', 'AGILE', 'SCRUM', 'PRODUCT', 'UX', 'SAAS',
     'PAAS', 'MULTI-CLOUD', 'HYBRID CLOUD', 'EVENT DRIVEN', 'DISTRIBUTED SYSTEMS', 'SCALABILITY',
     'LOW CODE', 'AUTOMATION', 'TESTING', 'CODE REVIEW', 'TECH DEBT', 'ARCHITECTURE'],
    ['CYBERSECURITY', 'ZERO TRUST', 'IDENTITY', 'ENCRYPTION', 'DEVSECOPS', 'THREAT DETECTION',
     'SOC', 'SIEM', 'XDR', 'COMPLIANCE', 'GDPR', 'PRIVACY', 'RESILIENCE', 'DISASTER RECOVERY',
     'BACKUP', 'PASSKEYS', 'POST-QUANTUM', 'SUPPLY CHAIN', 'SBOM', 'PENTEST', 'FIREWALL', 'VPN',
     'SASE', 'RISK', 'AUDIT', 'TRUST'],
    ['DATA', 'BIG DATA', 'DATA LAKE', 'LAKEHOUSE', 'DATA MESH', 'ANALYTICS', 'BUSINESS INTELLIGENCE',
     'STREAMING', 'ETL', 'SQL', 'DATA ENGINEERING', 'DATA SCIENCE', 'DIGITAL TWIN', 'IOT', '5G',
     'EDGE COMPUTING', 'QUANTUM COMPUTING', 'ROBOTICS', 'AR/VR', 'SPATIAL COMPUTING', 'BLOCKCHAIN',
     'HPC', 'GREEN IT', 'SUSTAINABILITY', 'DIGITAL TRANSFORMATION', 'INNOVATION', 'FUTURE OF WORK',
     'STARTUPS', 'SCALE-UP', 'TALENT', 'COMMUNITY', 'KEYNOTE', 'HACKATHON', 'SUMMIT'],
    ['PYTHON', 'TYPESCRIPT', 'JAVASCRIPT', 'RUST', 'GO', 'JAVA', 'KOTLIN', 'C#', '.NET', 'C++',
     'SWIFT', 'REACT', 'NODE.JS', 'PYTORCH', 'JAX', 'CUDA', 'WEBASSEMBLY', 'GRAPHQL', 'REST', 'GRPC',
     'POSTGRES', 'REDIS', 'KAFKA', 'SPARK', 'LINUX', 'GIT', 'VS CODE', 'NOTEBOOKS'],
  ],
  sky: { top: '#06204d', mid: '#1c5fae', bottom: '#8fc4f0' },
  bgWordCount: 160,      // background density
  // Leap interaction volume (mm) mapped to the screen. The sensor faces up on a podium,
  // so the TOP view (x, z) is projected: fingers pointing at the screen (-z) point up.
  // Hand height (y) above the sensor scales the silhouette.
  box: { xMin: -200, xMax: 200, zMin: -170, zMax: 170, yNear: 120, yFar: 400 },
  handScale: 2.6,          // outline thickness multiplier (big screen)
  rowHeightVh: 0.028,      // row height of words inside hands, fraction of screen height (smaller = denser)
  scrollSpeed: 90,         // px/s base scrolling speed inside hands
  idleToDemoMs: 5000,
  grabThreshold: 0.9,
  // Text gradient stops, animated across the screen (hand words) and per word (background).
  gradient: ['#7df9ff', '#4aa8ff', '#b388ff', '#ffffff'],
};
