"use client";
import { useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import QuestionPopup from './QuestionPop';

/** Walkable radius — player is clamped to this; boundary wall at edge. Ground extends much farther and fades in fog. */
const PLAY_RADIUS = 50;

const TREE_COUNT = 12;

/** Random but deterministic tree positions within the play area (no distinct circle). */
function getTreePositions() {
  const positions = [];
  const margin = PLAY_RADIUS - 5;
  for (let i = 0; i < TREE_COUNT; i++) {
    const nx = noise2D(i * 2.1, i * 3.7);
    const nz = noise2D(i * 4.3 + 100, i * 1.9);
    const x = (nx * 2 - 1) * margin;
    const z = (nz * 2 - 1) * margin;
    positions.push([x, z]);
  }
  return positions;
}

/** Scatter positions for procedural flowers (fallback when FBX not loaded). */
const SCATTER_POSITIONS = [
  [-15, -10], [18, -12], [-22, 12], [25, 15], [-8, -25], [12, -8],
  [-18, 22], [8, 28], [5, -18], [-28, 5], [30, -5], [-5, 32],
  [15, 18], [-12, -15], [0, -8], [-20, -8], [22, 8], [-10, 25],
];

/** Generate flower positions across the full ground (within PLAY_RADIUS - 1). */
function getFlowerPositions() {
  const positions = [];
  const margin = PLAY_RADIUS - 2;
  for (let i = 0; i < 60; i++) {
    const t = (i * 0.61) % 1;
    const a = t * Math.PI * 2 * 5 + i * 0.3;
    const r = 4 + (i % 8) * 5 + ((i * 0.17) % 1) * margin * 0.6;
    const rr = Math.min(r, margin);
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    positions.push([x, z]);
  }
  return positions;
}

/** Simple noise for procedural textures (0..1). */
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Create a tileable ground texture: grass, dirt patches, subtle variation. */
function createGroundTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const tile = 32;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = px / size;
      const v = py / size;
      const n = noise2D(px * 0.02, py * 0.02);
      const n2 = noise2D(px * 0.1, py * 0.1);
      const tileX = (px % tile) / tile;
      const tileY = (py % tile) / tile;
      const edge = Math.max(0, 1 - Math.min(tileX, 1 - tileX, tileY, 1 - tileY) * 8);
      const isDirt = n > 0.55 || (n2 > 0.6 && n > 0.4);
      const isDarkGrass = n > 0.35 && n < 0.5;
      let r, g, b;
      if (isDirt) {
        r = 140 + n * 30;
        g = 110 + n * 25;
        b = 85 + n * 20;
      } else if (isDarkGrass) {
        r = 80 + n * 40;
        g = 130 + n * 30;
        b = 70 + n * 25;
      } else {
        r = 100 + n * 35;
        g = 155 + n * 30;
        b = 90 + n * 25;
      }
      const shade = 1 - edge * 0.15;
      const i = (py * size + px) * 4;
      data[i] = Math.min(255, r * shade);
      data[i + 1] = Math.min(255, g * shade);
      data[i + 2] = Math.min(255, b * shade);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Create a bark-like texture for tree trunks — visible grooves and ridges. */
function createBarkTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.5, py * 0.08);
      const groove = Math.sin(py * 0.25 + n * 8) * 0.5 + 0.5;
      const isGroove = groove < 0.35;
      const r = isGroove ? 45 + n * 15 : 95 + n * 35;
      const g = isGroove ? 28 + n * 12 : 65 + n * 25;
      const b = isGroove ? 18 + n * 8 : 42 + n * 18;
      const i = (py * size + px) * 4;
      data[i] = Math.min(255, Math.floor(r));
      data[i + 1] = Math.min(255, Math.floor(g));
      data[i + 2] = Math.min(255, Math.floor(b));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vermillion (shu-iro) texture for torii — traditional Japanese gate red with slight grain. */
function createVermillionTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const baseR = 200;
  const baseG = 50;
  const baseB = 40;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.25, py * 0.25);
      const r = Math.floor(THREE.MathUtils.clamp(baseR + (n - 0.5) * 55, 0, 255));
      const g = Math.floor(THREE.MathUtils.clamp(baseG + (n - 0.5) * 30, 0, 255));
      const b = Math.floor(THREE.MathUtils.clamp(baseB + (n - 0.5) * 25, 0, 255));
      const i = (py * size + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sky gradient texture for dome — blue at top, warm at horizon (stops "blocking" flat sky). */
function createSkyGradientTexture() {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#6eb5e0');
  gradient.addColorStop(0.25, '#9ecce8');
  gradient.addColorStop(0.5, '#c9ddf0');
  gradient.addColorStop(0.72, '#e8d8e8');
  gradient.addColorStop(0.88, '#e8c8b8');
  gradient.addColorStop(1, '#d4a898');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Distant scenery: warm sunset gradient (yellow/orange horizon → pink/purple/blue), soft hills. */
function createDistantBackgroundTexture() {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#87ceeb');
  gradient.addColorStop(0.2, '#c9b8e8');
  gradient.addColorStop(0.4, '#e8c8d8');
  gradient.addColorStop(0.6, '#e8b898');
  gradient.addColorStop(0.8, '#c89878');
  gradient.addColorStop(1, '#8b6b5a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    const x = (i / 20) * w * 1.15 - w * 0.08 + noise2D(i, 0) * 20;
    const treeH = 50 + noise2D(i * 2, 1) * 45;
    const treeTop = h - treeH;
    const alpha = 0.18 + noise2D(i * 3, 2) * 0.12;
    ctx.fillStyle = `rgba(80, 55, 65, ${alpha})`;
    ctx.beginPath();
    const spread = 14 + noise2D(i, 1) * 8;
    ctx.moveTo(x - spread * 0.5, h);
    ctx.quadraticCurveTo(x - spread, treeTop + 35, x, treeTop + 10);
    ctx.quadraticCurveTo(x + spread, treeTop + 35, x + spread * 0.5, h);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sakura petal texture — oval with center vein and soft edges (recreatable leaf detail). */
function createSakuraPetalTexture() {
  const w = 128;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
  gradient.addColorStop(0, '#ffd0e8');
  gradient.addColorStop(0.35, '#ff9fc0');
  gradient.addColorStop(0.65, '#e878a0');
  gradient.addColorStop(1, 'rgba(200, 80, 120, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.44, h * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 60, 95, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.38);
  ctx.lineTo(cx, cy + h * 0.38);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(180, 60, 95, 0.25)';
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + i * w * 0.25, cy + h * 0.15);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Foliage / leaf texture for tree canopies (sakura petals and leaves) — used as fallback. */
function createFoliageTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const baseR = 255;
  const baseG = 195;
  const baseB = 210;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.08, py * 0.08);
      const n2 = noise2D(px * 0.25, py * 0.25);
      const spot = (n > 0.55 || n < 0.45) && n2 > 0.4 ? 1.15 : 0.92;
      const r = Math.min(255, Math.floor(baseR * spot + (n - 0.5) * 40));
      const g = Math.min(255, Math.floor(baseG * spot + (n - 0.5) * 35));
      const b = Math.min(255, Math.floor(baseB * spot + (n - 0.5) * 30));
      const i = (py * size + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Single leaf texture for ground scatter (oval leaf shape). */
function createLeafTexture() {
  const w = 64;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.55);
  gradient.addColorStop(0, '#6b8e5a');
  gradient.addColorStop(0.7, '#4a6b3a');
  gradient.addColorStop(1, 'rgba(35,50,28,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(w/2, h/2, w * 0.42, h * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Grey stone texture for lanterns and traditional elements. */
function createStoneTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.15, py * 0.15);
      const grey = Math.floor(90 + (n - 0.5) * 50);
      const i = (py * size + px) * 4;
      data[i] = grey;
      data[i + 1] = grey;
      data[i + 2] = Math.min(255, grey + 5);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Try to load an image texture from a list of URLs; returns fallback on failure. */
function loadImageTexture(urls, fallbackTexture) {
  if (!urls.length) return Promise.resolve(fallbackTexture);
  const loader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    let tried = 0;
    function tryNext() {
      if (tried >= urls.length) {
        resolve(fallbackTexture);
        return;
      }
      const url = urls[tried++];
      loader.load(
        url,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        },
        undefined,
        () => tryNext()
      );
    }
    tryNext();
  });
}

/** Movement speed (units per frame). Increase for faster movement. */
const PLAYER_MOVE_SPEED = 0.28;

function addDefaultPlayerMeshes(player) {
  // Kimono body
  const kimonoGeometry = new THREE.CylinderGeometry(0.7, 1, 2.5, 8);
  const kimonoMaterial = new THREE.MeshStandardMaterial({
    color: 0xE040FB,
    roughness: 0.6,
    metalness: 0.1,
  });
  const kimono = new THREE.Mesh(kimonoGeometry, kimonoMaterial);
  kimono.position.y = 1.5;
  kimono.castShadow = true;
  player.add(kimono);

  // Obi belt
  const obiGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.4, 8);
  const obiMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF6B9D,
    roughness: 0.5,
  });
  const obi = new THREE.Mesh(obiGeometry, obiMaterial);
  obi.position.y = 1.8;
  player.add(obi);

  // Player head
  const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFDBAC,
    roughness: 0.6,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 3;
  head.castShadow = true;
  player.add(head);

  // Hair (black)
  const hairGeometry = new THREE.SphereGeometry(0.45, 16, 16);
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x1A1A1A,
    roughness: 0.7,
  });
  const hair = new THREE.Mesh(hairGeometry, hairMaterial);
  hair.position.y = 3.2;
  hair.scale.set(1, 0.8, 1);
  player.add(hair);
}

/**
 * Load a 3D model from URL (GLB/GLTF or OBJ). Returns a Group.
 * For OBJ, loads MTL from the same directory (default materials.mtl; pass mtlFile for e.g. tree.mtl).
 * @param {string} url - Path e.g. /models/tree.glb or /models/tree.obj
 * @param {number} maxDimension - Scale so model's max size is this (default 7 for trees).
 * @param {string} [mtlFile] - MTL filename for OBJ (default 'materials.mtl').
 */
function loadModel(url, maxDimension = 7, mtlFile = 'materials.mtl') {
  const lower = url.toLowerCase();
  const isObj = lower.endsWith('.obj');
  return new Promise((resolve, reject) => {
    const applyScaleAndShadows = (group) => {
      const box = new THREE.Box3().setFromObject(group);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = maxDimension / maxDim;
      group.scale.setScalar(scale);
      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            const mat = Array.isArray(child.material) ? child.material : [child.material];
            mat.forEach((m) => {
              if (m && m.roughness !== undefined) m.roughness = Math.min(0.85, (m.roughness ?? 0.5) + 0.15);
              if (m && m.metalness !== undefined) m.metalness = Math.max(0, (m.metalness ?? 0) - 0.05);
            });
          }
        }
      });
      resolve(group);
    };
    if (isObj) {
      const basePath = url.includes('/') ? url.slice(0, url.lastIndexOf('/') + 1) : '';
      const mtlUrl = basePath + mtlFile;
      const objLoader = new OBJLoader();
      const mtlLoader = new MTLLoader();
      mtlLoader.load(
        mtlUrl,
        (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);
          objLoader.load(url, applyScaleAndShadows, undefined, reject);
        },
        undefined,
        () => {
          objLoader.load(url, applyScaleAndShadows, undefined, reject);
        }
      );
    } else {
      const loader = new GLTFLoader();
      loader.load(url, ({ scene }) => applyScaleAndShadows(scene), undefined, reject);
    }
  });
}

/**
 * Load an FBX model, scale to maxDimension, apply shadows. Returns a Group.
 */
function loadFBX(url, maxDimension = 1.2) {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();
    loader.load(
      url,
      (group) => {
        const box = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = maxDimension / maxDim;
        group.scale.setScalar(scale);
        group.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mat = Array.isArray(child.material) ? child.material : [child.material];
              mat.forEach((m) => {
                if (m && m.roughness !== undefined) m.roughness = Math.min(0.85, (m.roughness ?? 0.5) + 0.15);
                if (m && m.metalness !== undefined) m.metalness = Math.max(0, (m.metalness ?? 0) - 0.05);
              });
            }
          }
        });
        resolve(group);
      },
      undefined,
      reject
    );
  });
}

function generateCheckpoints(questions) {
  const checkpoints = [];
  const spacing = 15;
  const gridSize = Math.ceil(Math.sqrt(questions.length));
  
  questions.forEach((q, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    checkpoints.push({
      id: i,
      x: (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 5,
      z: (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 5,
      y: 3 + Math.sin(i) * 1.5,
      question: q,
      answered: false,
    });
  });
  return checkpoints;
}

export default function GameCanvas3D({
  questions,
  onComplete,
  onScoreUpdate,
  /** Optional: path to GLB/GLTF or OBJ model for the player (e.g. /model.obj for Pikachu). */
  playerModelUrl,
  /** Optional: path to GLB/GLTF or OBJ model for checkpoints (e.g. /models/checkpoint.glb). */
  checkpointModelUrl,
}) {
  const mountRef = useRef(null);
  const [checkpoints, setCheckpoints] = useState(() => generateCheckpoints(questions));
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [nearCheckpoint, setNearCheckpoint] = useState(null);

  const checkpointsRef = useRef(checkpoints);
  const questionOpenRef = useRef(false);

  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);

  useEffect(() => {
    questionOpenRef.current = !!activeQuestion;
  }, [activeQuestion]);

  useEffect(() => {
    const currentMount = mountRef.current;
    let cancelled = false;

    // Scene setup — warm sunset / sakura look (Unreal-style: warm horizon, pink/purple sky, soft fog)
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8d4dc, 28, 80);

    // Sky dome — gradient sky so it's not a flat blocking wall (blue above, warm at horizon)
    const skyTex = createSkyGradientTexture();
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(280, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      })
    );
    skyDome.position.y = 0;
    scene.add(skyDome);
    scene.background = new THREE.Color(0x9ecce8);

    // Camera — aspect updated on resize
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);

    // Renderer — size set from container
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    }
    const setSize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : (currentMount?.clientWidth || 800);
      const h = typeof window !== 'undefined' ? window.innerHeight : (currentMount?.clientHeight || 450);
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();
    currentMount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(currentMount);
    const onWindowResize = () => setSize();
    window.addEventListener('resize', onWindowResize);
    const timeouts = [0, 50, 150, 400].map((ms) => setTimeout(setSize, ms));

    // Lights — warm sunset tint (orange/pink like reference)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.65);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffe8d8, 0.85);
    directionalLight.position.set(40, 80, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground — large plane so it fades into fog with no visible edge (infinite feel); movement still clamped to PLAY_RADIUS
    const groundSize = 600;
    const groundSegments = 64;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundSegments, groundSegments);
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      vertices[i + 2] =
        Math.sin(x * 0.06) * Math.cos(y * 0.06) * 0.6 +
        noise2D(x * 0.15, y * 0.15) * 0.4;
    }
    groundGeometry.computeVertexNormals();

    // Ground: try image texture first (see public/textures/README.md), fallback procedural
    const fallbackGroundTex = createGroundTexture();
    fallbackGroundTex.colorSpace = THREE.SRGBColorSpace;
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: fallbackGroundTex,
      color: 0xeed8c8,
      roughness: 0.92,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Boundary wall at play area edge (limits walking, visible fence)
    const stoneTex = createStoneTexture();
    stoneTex.colorSpace = THREE.SRGBColorSpace;
    const wallSegmentCount = 48;
    const wallRadius = PLAY_RADIUS + 0.8;
    const wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: 0xffffff,
      roughness: 0.9,
    });
    for (let i = 0; i < wallSegmentCount; i++) {
      const angle = (i / wallSegmentCount) * Math.PI * 2;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.0, 0.6),
        wallMat
      );
      seg.position.x = Math.cos(angle) * wallRadius;
      seg.position.z = Math.sin(angle) * wallRadius;
      seg.position.y = 0.5;
      seg.rotation.y = -angle;
      seg.castShadow = true;
      seg.receiveShadow = true;
      scene.add(seg);
    }

    // Raycaster to get exact ground height from mesh (no formula mismatch = no sinking)
    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3();
    const rayDirection = new THREE.Vector3(0, -1, 0);
    const groundOffset = 0.24;

    // Fallback height (smooth wave only) for slope tilt when raycast is used for position
    function getGroundHeight(worldX, worldZ) {
      return (
        Math.sin(worldX * 0.06) * Math.cos(worldZ * 0.06) * 0.6
      );
    }

    const groundTextureUrls = [
      '/textures/ground.jpg',
      '/textures/grass.jpg',
      process.env.NEXT_PUBLIC_GROUND_TEXTURE_URL,
    ].filter(Boolean);
    loadImageTexture(groundTextureUrls, fallbackGroundTex).then((tex) => {
      if (cancelled) return;
      if (tex !== fallbackGroundTex) {
        tex.repeat.set(5, 5);
        tex.colorSpace = THREE.SRGBColorSpace;
        groundMaterial.map = tex;
      }
    });

    // Trees: shared bark material so one image texture applies to all trunks
    const fallbackBarkTex = createBarkTexture();
    fallbackBarkTex.colorSpace = THREE.SRGBColorSpace;
    const sharedTrunkMaterial = new THREE.MeshStandardMaterial({
      map: fallbackBarkTex,
      color: 0xffffff,
      roughness: 0.9,
    });
    const treeRefs = [];
    const barkTextureUrls = [
      '/textures/bark.jpg',
      '/textures/wood.jpg',
      process.env.NEXT_PUBLIC_BARK_TEXTURE_URL,
    ].filter(Boolean);
    loadImageTexture(barkTextureUrls, fallbackBarkTex).then((tex) => {
      if (cancelled) return;
      if (tex !== fallbackBarkTex) {
        tex.repeat.set(1, 2);
        sharedTrunkMaterial.map = tex;
      }
    });

    const sakuraPetalTex = createSakuraPetalTexture();
    // Use Poly Pizza tree model (CC-BY konta johanna) if available; else procedural sakura
    (async () => {
      try {
        const treeTemplate = await loadModel('/models/tree.obj', 11, 'tree.mtl');
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(treeTemplate);
        const treeBaseY = -box.min.y;
        treeTemplate.position.y = treeBaseY;
        const sakuraPink = new THREE.Color(0xffb7c5);
        const applySakuraFoliage = (group) => {
          group.traverse((child) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m) => {
                if (!m || !m.color) return;
                const c = m.color;
                const sum = c.r + c.g + c.b;
                const isTrunk = sum < 0.25;
                if (!isTrunk) {
                  m.color.copy(sakuraPink);
                  if (m.emissive) m.emissive.setHex(0xe88aa0);
                }
              });
            }
          });
        };
        applySakuraFoliage(treeTemplate);
        const treePositions = getTreePositions();
        treePositions.forEach(([x, z], index) => {
          const tree = treeTemplate.clone(true);
          applySakuraFoliage(tree);
          tree.position.set(x, treeBaseY, z);
          tree.userData.windPhase = index * 0.7;
          scene.add(tree);
          treeRefs.push(tree);
        });
      } catch (err) {
        if (cancelled) return;
        console.warn('Tree model not found, using procedural sakura trees', err);
        const treePositions = getTreePositions();
        treePositions.forEach(([x, z], index) => {
          const tree = createCherryTree(sharedTrunkMaterial, sakuraPetalTex, index);
          tree.position.set(x, 0, z);
          scene.add(tree);
          treeRefs.push(tree);
        });
      }
    })();

    // Scattered flowers — Quaternius FBX if available, else procedural
    const scatterRefs = [];
    const flowerPositions = getFlowerPositions();
    (async () => {
      try {
        const flowerTemplate = await loadFBX('/models/Flowers.fbx', 1.4);
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(flowerTemplate);
        flowerTemplate.position.y = -box.min.y;
        const baseY = -box.min.y;
        flowerPositions.forEach(([x, z], i) => {
          const flower = flowerTemplate.clone(true);
          flower.position.set(x, baseY, z);
          flower.rotation.y = (i * 0.7) % (Math.PI * 2);
          const scaleVar = 0.85 + (i % 4) * 0.08;
          flower.scale.multiplyScalar(scaleVar);
          scene.add(flower);
          scatterRefs.push(flower);
        });
      } catch (err) {
        if (cancelled) return;
        console.warn('Flowers.fbx not found, using procedural scatter', err);
        SCATTER_POSITIONS.forEach(([x, z], i) => {
          const scatter = createScatterFlower(i);
          scatter.position.set(x, 0, z);
          scatter.rotation.y = noise2D(i, i * 3) * Math.PI * 2;
          scene.add(scatter);
          scatterRefs.push(scatter);
        });
      }
    })();

    // Scattered leaves on ground (realistic detail)
    const leafTex = createLeafTexture();
    const leafPositions = [
      [-8, -5], [12, -10], [-14, 8], [10, 14], [5, -12], [-18, -8], [16, 4], [-6, 18],
      [0, -8], [-10, 2], [8, -6], [-12, -14], [14, 12], [3, 10], [-5, -18], [18, -4],
    ];
    leafPositions.forEach(([x, z], i) => {
      const leaf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.4, 1, 1),
        new THREE.MeshStandardMaterial({
          map: leafTex,
          color: 0xffffff,
          roughness: 0.9,
          transparent: true,
          alphaTest: 0.15,
          side: THREE.DoubleSide,
        })
      );
      leaf.rotation.x = -Math.PI / 2;
      leaf.rotation.z = noise2D(i, i * 2) * Math.PI * 0.4;
      leaf.position.set(x, 0.02, z);
      scene.add(leaf);
    });

    // Scattered rocks (Unreal-style: dark grey/brown, irregular sizes)
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x4a4540,
      roughness: 0.95,
      metalness: 0.02,
    });
    const rockPositions = [
      [-6, -4], [11, -7], [-12, 9], [8, 13], [4, -10], [-14, -6], [15, 3], [-3, 15],
      [10, -2], [-8, 5], [2, 8], [-10, -12], [13, 10], [0, -14], [16, -8], [-16, 2],
    ];
    rockPositions.forEach(([x, z], i) => {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35 + noise2D(i, i * 2) * 0.35, 0),
        rockMat
      );
      rock.position.set(x, 0.08, z);
      rock.rotation.set(noise2D(i, 0) * 0.4, noise2D(i, 1) * Math.PI, noise2D(i, 2) * 0.3);
      rock.scale.set(1, 0.6 + noise2D(i * 2, i) * 0.4, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    });

    // Torii gates — Poly Pizza model (Hattie Stroud, CC-BY) in distance, outside wall
    const toriiPositions = [[-40, 0], [40, 0], [0, -40]];
    loadModel('/models/torii/model.obj', 16)
      .then((toriiTemplate) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(toriiTemplate);
        const toriiBaseY = -box.min.y;
        toriiTemplate.position.y = toriiBaseY;
        toriiPositions.forEach(([x, z]) => {
          const torii = toriiTemplate.clone(true);
          torii.position.set(x, toriiBaseY, z);
          scene.add(torii);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Torii model not found, using procedural gate', err);
        const vermillionTex = createVermillionTexture();
        vermillionTex.colorSpace = THREE.SRGBColorSpace;
        toriiPositions.forEach(([x, z]) => {
          const torii = createTorii(vermillionTex);
          torii.position.set(x, 0, z);
          scene.add(torii);
        });
      });

    // Japanese White Fox (Aimi Sekiguchi, CC-BY) at character spawn — slightly smaller than Pikachu
    loadModel('/models/fox/model.obj', 1.35)
      .then((foxModel) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(foxModel);
        foxModel.position.set(2.2, -box.min.y, 0.8);
        foxModel.rotation.y = -Math.PI * 0.4;
        scene.add(foxModel);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Fox model not found', err);
      });

    // Stone lanterns (tōrō) — Japanese garden scenery (reuse stone texture)
    const lanternPositions = [[-20, -20], [22, -18], [-22, 18], [18, 22], [0, -24], [-24, 6], [24, -6]];
    lanternPositions.forEach(([x, z]) => {
      const lantern = createStoneLantern(stoneTex);
      lantern.position.set(x, 0, z);
      lantern.rotation.y = noise2D(x, z) * Math.PI * 0.3;
      scene.add(lantern);
    });

    // Player character - use custom model if provided, else kimono style
    const player = new THREE.Group();
    if (playerModelUrl) {
      loadModel(playerModelUrl, 3.6)
        .then((model) => {
          const box = new THREE.Box3().setFromObject(model);
          const minY = box.min.y;
          model.position.y = -minY;
          player.add(model);
        })
        .catch((err) => {
          console.error("Player model failed to load, using default:", err);
          addDefaultPlayerMeshes(player);
        });
    } else {
      addDefaultPlayerMeshes(player);
    }
    
    player.position.set(0, 0, 0);
    player.castShadow = true;
    scene.add(player);

    // Checkpoint markers — use custom model if checkpointModelUrl provided, else procedural
    const checkpointMap = new Map();
    if (checkpointModelUrl) {
      loadModel(checkpointModelUrl, 2.5)
        .then((model) => {
          checkpoints.forEach((cp) => {
            const clone = model.clone();
            clone.position.set(cp.x, cp.y, cp.z);
            clone.userData = { id: cp.id };
            clone.visible = !cp.answered;
            scene.add(clone);
            checkpointMap.set(cp.id, clone);
          });
        })
        .catch((err) => {
          console.error('Checkpoint model failed to load, using default:', err);
          checkpoints.forEach((cp) => {
            const checkpoint = createCheckpoint(cp.id);
            checkpoint.position.set(cp.x, cp.y, cp.z);
            checkpoint.userData = { id: cp.id };
            checkpoint.visible = !cp.answered;
            scene.add(checkpoint);
            checkpointMap.set(cp.id, checkpoint);
          });
        });
    } else {
      checkpoints.forEach((cp) => {
        const checkpoint = createCheckpoint(cp.id);
        checkpoint.position.set(cp.x, cp.y, cp.z);
        checkpoint.userData = { id: cp.id };
        checkpoint.visible = !cp.answered;
        scene.add(checkpoint);
        checkpointMap.set(cp.id, checkpoint);
      });
    }

    // Movement — smooth damping for realistic feel
    const keys = {};
    const velocity = new THREE.Vector3();
    const speed = PLAYER_MOVE_SPEED;
    const playerTarget = new THREE.Vector3(0, 0, 0);
    const cameraTarget = new THREE.Vector3(0, 15, 25);
    const lookAtTarget = new THREE.Vector3(0, 5, 0);
    let targetRotationY = 0;
    const moveDamp = 0.18;
    const cameraDamp = 0.08;
    const rotationDamp = 0.15;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      keys[key] = true;
      if (e.code) {
        keys[e.code.toLowerCase()] = true;
      }
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keys[key] = false;
      if (e.code) {
        keys[e.code.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Tree wind sway (foliage group for procedural; whole group for loaded OBJ)
      treeRefs.forEach((tree) => {
        const phase = (tree.userData.windPhase || 0) + time;
        const sway = Math.sin(phase * 0.8) * 0.04 + Math.sin(phase * 0.3) * 0.02;
        if (tree.userData.foliageGroup) {
          tree.userData.foliageGroup.rotation.z = sway;
          tree.userData.foliageGroup.rotation.x = Math.sin(phase * 0.5) * 0.02;
        } else {
          tree.rotation.z = sway * 0.6;
          tree.rotation.x = Math.sin(phase * 0.5) * 0.015;
        }
      });

      // Subtle bob for scatter flowers
      scatterRefs.forEach((scatter, i) => {
        scatter.position.y = Math.sin(time * 1.2 + i * 0.5) * 0.03;
      });

      // Player movement — disabled while question popup is open
      const questionOpen = questionOpenRef.current;
      if (!questionOpen) {
        velocity.set(0, 0, 0);
        if (keys['w'] || keys['arrowup'] || keys['keyw']) velocity.z -= speed;
        if (keys['s'] || keys['arrowdown'] || keys['keys']) velocity.z += speed;
        if (keys['a'] || keys['arrowleft'] || keys['keya']) velocity.x -= speed;
        if (keys['d'] || keys['arrowright'] || keys['keyd']) velocity.x += speed;

        if (velocity.length() > 0) {
          velocity.normalize().multiplyScalar(speed);
          playerTarget.x += velocity.x;
          playerTarget.z += velocity.z;
          const angle = Math.atan2(-velocity.x, -velocity.z);
          targetRotationY = angle;
        }

        playerTarget.x = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, playerTarget.x));
        playerTarget.z = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, playerTarget.z));
      }

      // Smooth lerp toward target position (always run so character eases to stop when question opens)
      player.position.x += (playerTarget.x - player.position.x) * moveDamp;
      player.position.z += (playerTarget.z - player.position.z) * moveDamp;

      // Smooth rotation toward movement direction
      let dy = targetRotationY - player.rotation.y;
      if (dy > Math.PI) dy -= Math.PI * 2;
      if (dy < -Math.PI) dy += Math.PI * 2;
      player.rotation.y += dy * rotationDamp;

      // Stick character to terrain (raycast at current position)
      const px = player.position.x;
      const pz = player.position.z;
      rayOrigin.set(px, 50, pz);
      raycaster.set(rayOrigin, rayDirection);
      const hits = raycaster.intersectObject(ground);
      if (hits.length > 0) {
        player.position.y = hits[0].point.y + groundOffset;
      } else {
        player.position.y = getGroundHeight(px, pz) + groundOffset;
      }

      const terrainY = getGroundHeight(px, pz);
      const d = 0.15;
      const slopeZ = (getGroundHeight(px, pz + d) - terrainY) / d;
      const slopeX = (getGroundHeight(px + d, pz) - terrainY) / d;
      const maxTilt = 0.25;
      player.rotation.x = THREE.MathUtils.clamp(-slopeZ, -maxTilt, maxTilt);
      player.rotation.z = THREE.MathUtils.clamp(slopeX, -maxTilt, maxTilt);

      // Smooth camera follow
      cameraTarget.x = player.position.x;
      cameraTarget.z = player.position.z + 20;
      cameraTarget.y = 15;
      lookAtTarget.set(player.position.x, 5, player.position.z);
      camera.position.x += (cameraTarget.x - camera.position.x) * cameraDamp;
      camera.position.y += (cameraTarget.y - camera.position.y) * cameraDamp;
      camera.position.z += (cameraTarget.z - camera.position.z) * cameraDamp;
      camera.lookAt(lookAtTarget);

      // Update checkpoints visibility and animation
      const currentCheckpoints = checkpointsRef.current;
      currentCheckpoints.forEach((cp, i) => {
        const mesh = checkpointMap.get(cp.id);
        if (mesh) {
          mesh.visible = !cp.answered;
          
          if (!cp.answered) {
            const time = Date.now() * 0.001;
            mesh.position.y = cp.y + Math.sin(time * 2 + i) * 0.5;
            mesh.rotation.y += 0.02;
            
            const dist = player.position.distanceTo(mesh.position);
            if (dist < 5) {
              mesh.scale.setScalar(1.2 + Math.sin(time * 5) * 0.1);
            } else {
              mesh.scale.setScalar(1);
            }
          }
        }
      });

      // Update near checkpoint
      let closestCheckpoint = null;
      let minDist = 5; // Increased detection range
      currentCheckpoints.forEach((cp) => {
        if (!cp.answered) {
          const mesh = checkpointMap.get(cp.id);
          if (mesh && mesh.visible) {
            const dist = player.position.distanceTo(mesh.position);
            if (dist < minDist) {
              minDist = dist;
              closestCheckpoint = cp.id;
            }
          }
        }
      });
      setNearCheckpoint(closestCheckpoint);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onWindowResize);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      currentMount?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [playerModelUrl, checkpointModelUrl]);
  
  // Handle space key interaction separately
  useEffect(() => {
    const handleSpaceKey = (e) => {
      if (e.key === ' ' && nearCheckpoint !== null && !activeQuestion) {
        e.preventDefault();
        const cp = checkpointsRef.current.find(c => c.id === nearCheckpoint && !c.answered);
        console.log('Space pressed. Near:', nearCheckpoint, 'Found:', cp, 'All checkpoints:', checkpointsRef.current);
        if (cp) {
          setActiveQuestion(cp);
        }
      }
    };
    
    window.addEventListener('keydown', handleSpaceKey);
    return () => window.removeEventListener('keydown', handleSpaceKey);
  }, [nearCheckpoint, activeQuestion]);

  const handleAnswer = (correct) => {
    const newScore = score + (correct ? 10 : 0);
    const newAnswered = answered + 1;
    setScore(newScore);
    setAnswered(newAnswered);
    onScoreUpdate?.(newScore);

    // Mark checkpoint as answered and remove from scene
    setCheckpoints(prev => prev.map(cp => 
      cp.id === activeQuestion.id ? { ...cp, answered: true } : cp
    ));

    if (newAnswered >= questions.length) {
      setTimeout(() => onComplete(newScore, questions.length), 500);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen min-h-screen min-w-0" style={{ minHeight: '100dvh' }}>
      <div ref={mountRef} className="absolute inset-0 top-0 left-0 w-full h-full overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      
      {/* Controls UI — raised so not cut off at bottom */}
      <div className="absolute bottom-6 left-4 max-w-[220px] bg-[#ffe6f0]/85 text-[#4a2b3e] px-3 py-2.5 rounded-lg text-xs shadow-md shadow-pink-200/60">
        <div className="font-semibold mb-1">Controls</div>
        <div>WASD or arrows — Move</div>
        {nearCheckpoint !== null && (
          <div className="text-[#c2185b] font-bold mt-1.5 animate-pulse">
            SPACE — interact
          </div>
        )}
      </div>

      {/* Progress only (score shown in header) — top-right below header area */}
      <div className="absolute top-14 right-4 bg-[#ffe6f0]/85 text-[#4a2b3e] px-3 py-1.5 rounded-lg text-sm font-bold shadow-md shadow-pink-200/60">
        {answered}/{questions.length} questions
      </div>

      <AnimatePresence>
        {activeQuestion && (
          <QuestionPopup
            target={activeQuestion}
            onAnswer={handleAnswer}
            onClose={() => setActiveQuestion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create cherry blossom tree — thick trunk + dense fluffy canopy (Unreal-style sakura)
function createCherryTree(trunkMaterial, petalTexture, seedIndex = 0) {
  const tree = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(0.32, 0.5, 5.5, 14);
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.75;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = 4.2;

  const blossomPink = new THREE.MeshStandardMaterial({
    color: 0xffa0c0,
    roughness: 0.88,
    emissive: 0xe87098,
    emissiveIntensity: 0.04,
  });

  const clusterGeom = new THREE.SphereGeometry(0.7, 8, 8);
  const clusterPositions = [
    [0, 1.6, 0], [-0.6, 1.1, 0.3], [0.5, 1.2, -0.3], [0.2, 2.0, 0.4],
    [-0.4, 1.7, -0.3], [0.4, 0.8, 0.4],
  ];
  clusterPositions.forEach(([x, y, z], i) => {
    const cluster = new THREE.Mesh(clusterGeom, blossomPink);
    cluster.position.set(x, y, z);
    cluster.scale.set(0.6 + noise2D(seedIndex + i, i) * 0.35, 0.65 + noise2D(i, seedIndex) * 0.3, 0.6 + noise2D(seedIndex + i * 2, i) * 0.35);
    cluster.castShadow = true;
    foliageGroup.add(cluster);
  });

  const petalMat = new THREE.MeshStandardMaterial({
    map: petalTexture || null,
    color: 0xffffff,
    roughness: 0.8,
    emissive: 0xe87098,
    emissiveIntensity: 0.05,
    transparent: true,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  const petalGeom = new THREE.PlaneGeometry(0.55, 0.85, 1, 1);
  const numPetals = 72;
  const radius = 2.6;
  const centerY = 1.6;

  for (let i = 0; i < numPetals; i++) {
    const t = i / numPetals;
    const phi = t * Math.PI * 2 * 3.5 + seedIndex;
    const theta = Math.PI * 0.18 + (noise2D(seedIndex, i) * 0.55) * Math.PI * 0.5;
    const r = radius * (0.35 + 0.65 * noise2D(i, seedIndex * 2));
    const px = Math.sin(theta) * Math.cos(phi) * r;
    const py = centerY + Math.cos(theta) * r * 0.95 + (noise2D(i * 2, seedIndex) - 0.5) * 0.9;
    const pz = Math.sin(theta) * Math.sin(phi) * r;

    const petal = new THREE.Mesh(petalGeom, petalMat);
    petal.position.set(px, py, pz);
    petal.rotation.order = 'YXZ';
    petal.rotation.y = -phi;
    petal.rotation.x = theta * 0.7 + (noise2D(i, i * 3) - 0.5) * 0.45;
    petal.rotation.z = (noise2D(seedIndex + i, i) - 0.5) * 0.65;
    petal.scale.setScalar(0.75 + noise2D(i * 1.5, seedIndex) * 0.65);
    foliageGroup.add(petal);
  }

  tree.add(foliageGroup);
  tree.userData.foliageGroup = foliageGroup;
  tree.userData.windPhase = seedIndex * 0.7;

  return tree;
}

// Small ground scatter (flowers/grass) for extra texture
function createScatterFlower(seed) {
  const group = new THREE.Group();
  const stemGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.y = 0.2;
  group.add(stem);
  const colors = [0xff69b4, 0xffb6c1, 0xffd700, 0xffffff, 0xe040fb];
  const color = colors[Math.floor(noise2D(seed, seed * 2) * colors.length) % colors.length];
  const headGeom = new THREE.SphereGeometry(0.12, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 0.42;
  group.add(head);
  return group;
}

// Create torii gate — traditional Japanese gate (vermillion pillars, black lacquer beams)
function createTorii(vermillionTexture) {
  const torii = new THREE.Group();

  const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.35, 6, 12);
  const pillarMaterial = new THREE.MeshStandardMaterial({
    map: vermillionTexture || null,
    color: vermillionTexture ? 0xffffff : 0xb42e1a,
    roughness: 0.55,
    metalness: 0.05,
  });

  const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
  leftPillar.position.set(-3, 3, 0);
  leftPillar.castShadow = true;
  torii.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeometry.clone(), pillarMaterial);
  rightPillar.position.set(3, 3, 0);
  rightPillar.castShadow = true;
  torii.add(rightPillar);

  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.15,
  });
  const topBeamGeometry = new THREE.BoxGeometry(8, 0.5, 0.5);
  const topBeam = new THREE.Mesh(topBeamGeometry, beamMaterial);
  topBeam.position.set(0, 6.5, 0);
  topBeam.castShadow = true;
  torii.add(topBeam);

  const midBeamGeometry = new THREE.BoxGeometry(6.5, 0.4, 0.4);
  const midBeam = new THREE.Mesh(midBeamGeometry, pillarMaterial);
  midBeam.position.set(0, 5.5, 0);
  midBeam.castShadow = true;
  torii.add(midBeam);

  return torii;
}

// Stone lantern (tōrō) — classic Japanese garden lantern
function createStoneLantern(stoneTexture) {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture || null,
    color: stoneTexture ? 0xffffff : 0x888888,
    roughness: 0.92,
  });

  const baseGeom = new THREE.CylinderGeometry(0.5, 0.65, 0.25, 8);
  const base = new THREE.Mesh(baseGeom, stoneMat);
  base.position.y = 0.125;
  base.castShadow = true;
  group.add(base);

  const postGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8);
  const post = new THREE.Mesh(postGeom, stoneMat);
  post.position.y = 0.525;
  post.castShadow = true;
  group.add(post);

  const roofGeom = new THREE.CylinderGeometry(0.55, 0.5, 0.12, 8);
  const roof = new THREE.Mesh(roofGeom, stoneMat);
  roof.position.y = 0.94;
  roof.castShadow = true;
  group.add(roof);

  const boxGeom = new THREE.BoxGeometry(0.35, 0.4, 0.35);
  const box = new THREE.Mesh(boxGeom, stoneMat);
  box.position.y = 1.14;
  box.castShadow = true;
  group.add(box);

  const topGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.1, 8);
  const top = new THREE.Mesh(topGeom, stoneMat);
  top.position.y = 1.39;
  top.castShadow = true;
  group.add(top);

  return group;
}

// Create floating checkpoint marker
function createCheckpoint(id) {
  const group = new THREE.Group();
  
  // Lantern style checkpoint
  // Top cap
  const topCapGeometry = new THREE.CylinderGeometry(0.8, 0.6, 0.3, 8);
  const capMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1A1A1A,
    roughness: 0.6,
  });
  const topCap = new THREE.Mesh(topCapGeometry, capMaterial);
  topCap.position.y = 1.2;
  group.add(topCap);
  
  // Lantern body
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 6);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xCC2200,
    emissive: 0xFF6600,
    emissiveIntensity: 0.5,
    roughness: 0.5,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.3;
  body.castShadow = true;
  group.add(body);
  
  // Glowing core
  const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const coreMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFD700,
    emissive: 0xFFAA00,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.9,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.y = 0.3;
  group.add(core);
  
  // Bottom cap
  const bottomCap = new THREE.Mesh(topCapGeometry, capMaterial);
  bottomCap.position.y = -0.6;
  group.add(bottomCap);
  
  // Vertical beam of light
  const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
  const beamMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFD700,
    transparent: true,
    opacity: 0.25,
  });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.y = -4;
  group.add(beam);
  
  // Question mark sprite
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.5, 1.5, 1);
  sprite.position.y = 0;
  group.add(sprite);
  
  return group;
}