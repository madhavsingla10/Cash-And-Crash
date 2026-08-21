import * as THREE from 'three';

export interface WorldMaterials {
  asphaltMat: THREE.MeshStandardMaterial;
  sidewalkMat: THREE.MeshStandardMaterial;
  roadMarkMat: THREE.MeshBasicMaterial;
  grassMat: THREE.MeshStandardMaterial;
  transitionGrassMat: THREE.MeshStandardMaterial;
  farmGrassMat: THREE.MeshStandardMaterial;
  wheatMat: THREE.MeshStandardMaterial;
  hayMat: THREE.MeshStandardMaterial;
  marbleMat: THREE.MeshStandardMaterial;
  waterMat: THREE.MeshStandardMaterial;
  neonCyanMat: THREE.MeshBasicMaterial;
  neonPinkMat: THREE.MeshBasicMaterial;
  neonGoldMat: THREE.MeshBasicMaterial;
  lampPostMat: THREE.MeshStandardMaterial;
  lampBulbMat: THREE.MeshBasicMaterial;
  woodPlankMat: THREE.MeshStandardMaterial;
  pavedTileMat: THREE.MeshStandardMaterial;
  treeMat: THREE.MeshStandardMaterial;
  trunkMat: THREE.MeshStandardMaterial;
  fenceMat: THREE.MeshStandardMaterial;
  windowTexture: THREE.CanvasTexture;
  buildingPalettes: number[];
  houseColors: number[];
  roofColors: number[];
  containerColors: number[];
  flowerbedColors: number[];
}

export function createWorldMaterials(): WorldMaterials {
  // 1. Procedural Window Texture for Skyscrapers
  const windowCanvas = document.createElement('canvas');
  windowCanvas.width = 128;
  windowCanvas.height = 128;
  const wctx = windowCanvas.getContext('2d')!;
  wctx.fillStyle = '#0a0f1d';
  wctx.fillRect(0, 0, 128, 128);
  for (let wy = 4; wy < 128; wy += 12) {
    for (let wx = 4; wx < 128; wx += 12) {
      wctx.fillStyle = Math.random() > 0.35 ? '#ffdd88' : (Math.random() > 0.5 ? '#38bdf8' : '#030712');
      wctx.fillRect(wx, wy, 8, 8);
    }
  }
  const windowTexture = new THREE.CanvasTexture(windowCanvas);
  windowTexture.wrapS = THREE.RepeatWrapping;
  windowTexture.wrapT = THREE.RepeatWrapping;

  // 2. Procedural Paved Tile Texture for Countryside Streets & Plaza
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = 128;
  tileCanvas.height = 128;
  const tctx = tileCanvas.getContext('2d')!;
  tctx.fillStyle = '#64748b'; // Slate gray paving
  tctx.fillRect(0, 0, 128, 128);
  tctx.strokeStyle = '#334155'; // Dark mortar lines
  tctx.lineWidth = 3;
  for (let ty = 0; ty <= 128; ty += 16) {
    tctx.beginPath();
    tctx.moveTo(0, ty);
    tctx.lineTo(128, ty);
    tctx.stroke();
  }
  for (let tx = 0; tx <= 128; tx += 32) {
    for (let ty = 0; ty < 128; ty += 32) {
      tctx.beginPath();
      tctx.moveTo(tx, ty);
      tctx.lineTo(tx, ty + 16);
      tctx.moveTo(tx + 16, ty + 16);
      tctx.lineTo(tx + 16, ty + 32);
      tctx.stroke();
    }
  }
  const tileTexture = new THREE.CanvasTexture(tileCanvas);
  tileTexture.wrapS = THREE.RepeatWrapping;
  tileTexture.wrapT = THREE.RepeatWrapping;
  tileTexture.repeat.set(6, 6);

  return {
    asphaltMat: new THREE.MeshStandardMaterial({
      color: 0x14161d,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    }),
    sidewalkMat: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
    roadMarkMat: new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3
    }),
    grassMat: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9 }),
    transitionGrassMat: new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.9 }),
    farmGrassMat: new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.95 }),
    wheatMat: new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.9 }),
    hayMat: new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.95 }),
    marbleMat: new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.3, metalness: 0.1 }),
    waterMat: new THREE.MeshStandardMaterial({ color: 0x005577, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.88 }),
    neonCyanMat: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
    neonPinkMat: new THREE.MeshBasicMaterial({ color: 0xff0077 }),
    neonGoldMat: new THREE.MeshBasicMaterial({ color: 0xffb703 }),
    lampPostMat: new THREE.MeshStandardMaterial({ color: 0x1e293b }),
    lampBulbMat: new THREE.MeshBasicMaterial({ color: 0xffea9f }),
    woodPlankMat: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 }),
    pavedTileMat: new THREE.MeshStandardMaterial({
      map: tileTexture,
      roughness: 0.65,
      metalness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    }),
    treeMat: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }),
    trunkMat: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 }),
    fenceMat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }),
    windowTexture,
    buildingPalettes: [
      0x1e293b, 0x0f172a, 0x1e1b4b, 0x172554, 0x042f2e, 0x311042, 0x2e1065, 0x334155, 0x1f2937, 0x111827
    ],
    houseColors: [0xf8fafc, 0xfef9c3, 0xfae8ff, 0xdbeafe, 0xffedd5, 0xe0e7ff],
    roofColors: [0x991b1b, 0x7c2d12, 0x1e293b, 0x312e81, 0x1e3a5f, 0x831843],
    containerColors: [0xe65100, 0x1d4ed8, 0xb91c1c, 0x15803d, 0xfacc15, 0x0f172a, 0x0284c7, 0x7c3aed],
    flowerbedColors: [0xff0054, 0x9b5de5, 0xf15bb5, 0xfee440, 0x00f5d4]
  };
}
