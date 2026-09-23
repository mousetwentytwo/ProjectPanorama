// Tunables for the installation. Edit freely on site.
window.WH = window.WH || {};
WH.config = {
  leapUrl: 'ws://127.0.0.1:6437/v6.json',
  // Word sets; a grab (fist) cycles to the next set.
  wordSets: [
    ['CLOUD', 'DEVOPS', 'AI', 'KUBERNETES', 'API', 'CYBERSECURITY', 'DATA', 'EDGE', '5G',
     'MICROSERVICES', 'SERVERLESS', 'LINUX', 'OPEN SOURCE', 'CI/CD', 'MACHINE LEARNING'],
    ['NETWORK', 'FIREWALL', 'ENCRYPTION', 'ZERO TRUST', 'IDENTITY', 'SOC', 'VPN', 'TLS',
     'THREAT INTEL', 'SIEM', 'PATCH', 'BACKUP'],
    ['PYTHON', 'JAVASCRIPT', 'RUST', 'GO', 'JAVA', 'C#', 'SQL', 'GIT', 'DOCKER', 'TERRAFORM',
     'REACT', 'NODE'],
    ['DIGITAL TWIN', 'IOT', 'QUANTUM', 'BLOCKCHAIN', 'BIG DATA', 'ANALYTICS', 'LLM', 'AR/VR',
     'ROBOTICS', 'AUTOMATION', 'SAAS', 'HPC'],
  ],
  sky: { top: '#06204d', mid: '#1c5fae', bottom: '#8fc4f0' },
  bgWordCount: 70,
  // Leap interaction volume (mm) mapped to the screen. The sensor faces up on a podium,
  // so the TOP view (x, z) is projected: fingers pointing at the screen (-z) point up.
  // Hand height (y) above the sensor scales the silhouette.
  box: { xMin: -200, xMax: 200, zMin: -170, zMax: 170, yNear: 120, yFar: 400 },
  handScale: 2.6,          // outline thickness multiplier (big screen)
  rowHeightVh: 0.045,      // row height of words inside hands, fraction of screen height
  scrollSpeed: 90,         // px/s base scrolling speed inside hands
  idleToDemoMs: 5000,
  grabThreshold: 0.9,
};
