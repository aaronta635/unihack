"use client";

import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { X, Search } from "lucide-react";

/** Default ground: one large plane extending in all directions; arena sits on it. */
const GROUND_SIZE = 6000;
const PLAY_RADIUS = GROUND_SIZE / 2 - 20;
const PLAYER_MOVE_SPEED = 0.28;

const CHECKPOINT_INTERACT_RADIUS = 5;

const LANTERN_POSITION = { x: 2.5, z: 0, y: 0 };

const TREE_COUNT_SCATTERED = 60;
const TREE_MARGIN = 280;
const ARENA_NO_TREE_RADIUS = 52;
const ARENA_RING_TREE_COUNT = 40;
const ARENA_RING_INNER = 55;
const ARENA_RING_OUTER = 140;

/** Random tree positions surrounding the area; none inside the arena. */
function getTreePositions() {
  const positions = [];
  let attempts = 0;
  const maxAttempts = TREE_COUNT_SCATTERED * 4;
  while (positions.length < TREE_COUNT_SCATTERED && attempts < maxAttempts) {
    attempts++;
    const i = positions.length + attempts * 0.5;
    const nx = noise2D(i * 2.1, i * 3.7);
    const nz = noise2D(i * 4.3 + 100, i * 1.9);
    const x = (nx * 2 - 1) * TREE_MARGIN;
    const z = (nz * 2 - 1) * TREE_MARGIN;
    const dist = Math.sqrt(x * x + z * z);
    if (dist >= ARENA_NO_TREE_RADIUS) positions.push([x, z]);
  }
  return positions;
}

/** Trees in a ring around the outer arena (outside ARENA_NO_TREE_RADIUS). */
function getArenaRingTreePositions() {
  const positions = [];
  for (let i = 0; i < ARENA_RING_TREE_COUNT; i++) {
    const t = i / ARENA_RING_TREE_COUNT;
    const angle = t * Math.PI * 2 + noise2D(i * 5, i * 7) * 0.4;
    const r = ARENA_RING_INNER + (noise2D(i * 3, i * 11) * (ARENA_RING_OUTER - ARENA_RING_INNER));
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    positions.push([x, z]);
  }
  return positions;
}

/** Stone lantern (tōrō) from main game — optional emissive for interactable checkpoint. */
function createStoneLantern(stoneTexture, emissive = false) {
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
  const boxMat = emissive
    ? new THREE.MeshStandardMaterial({
        color: 0xffaa44,
        emissive: 0xff6600,
        emissiveIntensity: 0.5,
        roughness: 0.6,
      })
    : stoneMat;
  const boxGeom = new THREE.BoxGeometry(0.35, 0.4, 0.35);
  const box = new THREE.Mesh(boxGeom, boxMat);
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

/** Interactable checkpoint: stone lantern design with glow (main game style). */
function createCheckpointMarker(stoneTex) {
  return createStoneLantern(stoneTex, true);
}

function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function createGroundTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const tile = 32;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
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

function createBarkTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
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
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVermillionTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const baseR = 200, baseG = 50, baseB = 40;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.25, py * 0.25);
      data[(py * size + px) * 4] = Math.floor(THREE.MathUtils.clamp(baseR + (n - 0.5) * 55, 0, 255));
      data[(py * size + px) * 4 + 1] = Math.floor(THREE.MathUtils.clamp(baseG + (n - 0.5) * 30, 0, 255));
      data[(py * size + px) * 4 + 2] = Math.floor(THREE.MathUtils.clamp(baseB + (n - 0.5) * 25, 0, 255));
      data[(py * size + px) * 4 + 3] = 255;
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

function createSakuraPetalTexture() {
  const w = 128, h = 192;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
  gradient.addColorStop(0, "#ffd0e8");
  gradient.addColorStop(0.35, "#ff9fc0");
  gradient.addColorStop(0.65, "#e878a0");
  gradient.addColorStop(1, "rgba(200, 80, 120, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.44, h * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 60, 95, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.38);
  ctx.lineTo(cx, cy + h * 0.38);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStoneTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const n = noise2D(px * 0.15, py * 0.15);
      const grey = Math.floor(90 + (n - 0.5) * 50);
      const i = (py * size + px) * 4;
      data[i] = data[i + 1] = grey;
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
    petal.rotation.order = "YXZ";
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
  const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.15 });
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 0.5), beamMaterial);
  topBeam.position.set(0, 6.5, 0);
  topBeam.castShadow = true;
  torii.add(topBeam);
  const midBeam = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 0.4), pillarMaterial);
  midBeam.position.set(0, 5.5, 0);
  midBeam.castShadow = true;
  torii.add(midBeam);
  return torii;
}

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
          if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        },
        undefined,
        () => tryNext()
      );
    }
    tryNext();
  });
}

function loadModel(url, maxDimension = 7, mtlFile = "materials.mtl") {
  const lower = url.toLowerCase();
  const isObj = lower.endsWith(".obj");
  return new Promise((resolve, reject) => {
    const apply = (group) => {
      const box = new THREE.Box3().setFromObject(group);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      group.scale.setScalar(maxDimension / maxDim);
      group.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      resolve(group);
    };
    if (isObj) {
      const basePath = url.includes("/") ? url.slice(0, url.lastIndexOf("/") + 1) : "";
      const mtlLoader = new MTLLoader();
      mtlLoader.load(
        basePath + mtlFile,
        (materials) => {
          materials.preload();
          const objLoader = new OBJLoader();
          objLoader.setMaterials(materials);
          objLoader.load(url, apply, undefined, reject);
        },
        undefined,
        () => {
          new OBJLoader().load(url, apply, undefined, reject);
        }
      );
    } else {
      new GLTFLoader().load(url, ({ scene }) => apply(scene), undefined, reject);
    }
  });
}

function loadFBX(url, maxDimension = 1.2) {
  return new Promise((resolve, reject) => {
    new FBXLoader().load(
      url,
      (group) => {
        const box = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        group.scale.setScalar(maxDimension / maxDim);
        group.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        resolve(group);
      },
      undefined,
      reject
    );
  });
}

function addDefaultPlayerMeshes(player) {
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xe040fb, roughness: 0.6 })
  );
  body.position.y = 1.5;
  player.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 })
  );
  head.position.y = 3;
  player.add(head);
}

function BattleModelsView({ playerModelUrl, visible, role = "pikachu" }) {
  const containerRef = useRef(null);
  const isCharmander = role === "charmander";

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa8d0e8);
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    camera.position.set(0, 0.8, 4);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    const w = container.clientWidth || 400;
    const h = Math.max(container.clientHeight || 280, 220);
    renderer.setSize(w, h);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 5);
    scene.add(dir);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a8c4a,
      roughness: 0.95,
    });
    const platformGeom = new THREE.CylinderGeometry(0.65, 0.72, 0.08, 24);
    const platformP = new THREE.Mesh(platformGeom, groundMat);
    platformP.position.set(-1.1, -0.04, 0.7);
    scene.add(platformP);
    const platformC = new THREE.Mesh(platformGeom.clone(), groundMat.clone());
    platformC.position.set(1.5, -0.04, -0.3);
    scene.add(platformC);

    let cancelled = false;
    let animId;

    const scale = 0.9;
    Promise.all([
      loadModel(playerModelUrl || "/model.obj", scale),
      loadModel("/models/charmander/model.obj", scale, "materials.mtl"),
    ])
      .then(([pikachu, charmander]) => {
        if (cancelled) return;
        const boxP = new THREE.Box3().setFromObject(pikachu);
        const boxC = new THREE.Box3().setFromObject(charmander);
        if (isCharmander) {
          charmander.position.set(-1.1, -boxC.min.y, 0.7);
          charmander.rotation.y = Math.PI * 0.2;
          scene.add(charmander);
          pikachu.position.set(1.5, -boxP.min.y, -0.3);
          pikachu.rotation.y = Math.PI;
          scene.add(pikachu);
        } else {
          pikachu.position.set(-1.1, -boxP.min.y, 0.7);
          pikachu.rotation.y = Math.PI * 0.2;
          scene.add(pikachu);
          charmander.position.set(1.5, -boxC.min.y, -0.3);
          charmander.rotation.y = Math.PI;
          scene.add(charmander);
        }
      })
      .catch(() => {});

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (cancelled) return;
      const cw = container.clientWidth || 400;
      const ch = container.clientHeight || 250;
      if (renderer.domElement.width !== cw || renderer.domElement.height !== ch) {
        renderer.setSize(cw, ch);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [visible, playerModelUrl, role]);

  if (!visible) return null;
  return (
    <div
      ref={containerRef}
      className="w-full flex-1 min-h-[220px] rounded-xl overflow-hidden bg-sky-200/80 mx-4"
      style={{ minHeight: 220 }}
    />
  );
}

const PIKACHU_HP = 83;
const ENEMY_HP = 50;
const PIKACHU_MOVES = [
  { name: "Thunder Shock", power: 12, type: "electric" },
  { name: "Quick Attack", power: 8, type: "normal" },
  { name: "Tail Whip", power: 5, type: "normal" },
  { name: "Growl", power: 4, type: "normal" },
];
const ENEMY_MOVES = [
  { name: "Scratch", power: 10 },
  { name: "Ember", power: 12 },
  { name: "Growl", power: 4 },
];

/** Lower damage so battles last longer (scaled down from original formula). */
function damage(power, level = 25) {
  const base = Math.floor((((2 * level) / 5 + 2) * power * 50) / 50) + 2;
  const scaled = Math.max(1, Math.floor(base / 5) + Math.floor(Math.random() * 2));
  return scaled;
}

/** Demo questions when no course/week (same shape as API). */
const DEMO_QUESTIONS = [
  { question: "What is the time complexity of binary search on a sorted array of n elements?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct_index: 1 },
  { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Array", "Linked List"], correct_index: 1 },
  { question: "In a binary tree, max number of nodes at level k?", options: ["k", "2k", "2^k", "k²"], correct_index: 2 },
  { question: "Which sorting has O(n log n) average?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], correct_index: 2 },
  { question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyper Transfer Text Protocol", "High Text Transfer Protocol"], correct_index: 0 },
];

/** Throttle position sync over WebSocket (ms). */
const POSITION_SYNC_INTERVAL_MS = 80;

export default function GameCanvasFight({
  playerModelUrl = "/model.obj",
  courseId,
  weekNumber,
  /** WebSocket URL for 2-player. When set, connect and sync positions. Other device uses ?player=charmander and same wsUrl. */
  wsUrl,
  /** "pikachu" | "charmander" – who this client controls. Default pikachu. Use charmander on the other device. */
  role: roleProp,
}) {
  const mountRef = useRef(null);
  const [nearLantern, setNearLantern] = useState(false);
  const [showBattleView, setShowBattleView] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(true);

  const socketRef = useRef(null);
  const remotePositionRef = useRef({ x: 0, z: 50, rotationY: 0 });
  const lastSendTimeRef = useRef(0);
  const sendPositionRef = useRef(() => {});

  const role = roleProp ?? "pikachu";
  const isCharmander = role === "charmander";

  const [battlePhase, setBattlePhase] = useState("menu");
  const [battleMessage, setBattleMessage] = useState("");
  const [playerHp, setPlayerHp] = useState(PIKACHU_HP);
  const [playerMaxHp, setPlayerMaxHp] = useState(PIKACHU_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_HP);
  const [enemyMaxHp, setEnemyMaxHp] = useState(ENEMY_HP);

  const [questions, setQuestions] = useState([]);
  const [showBattleQuestion, setShowBattleQuestion] = useState(false);
  const [battleQuestion, setBattleQuestion] = useState(null);
  const [questionRevealed, setQuestionRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const pendingMoveRef = useRef(null);

  const battleOpenRef = useRef(false);

  useEffect(() => {
    battleOpenRef.current = showBattleView;
  }, [showBattleView]);

  useEffect(() => {
    if (showBattleView) {
      setBattlePhase("menu");
      setBattleMessage("");
      setPlayerHp(PIKACHU_HP);
      setPlayerMaxHp(PIKACHU_HP);
      setEnemyHp(ENEMY_HP);
      setEnemyMaxHp(ENEMY_HP);
    }
  }, [showBattleView]);

  useEffect(() => {
    if (courseId && weekNumber) {
      const base = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== "undefined" ? "" : "http://localhost:3000");
      const url = `${base}/api/questions?course_id=${encodeURIComponent(courseId)}&week_number=${weekNumber}`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : { questions: [] }))
        .then((json) => {
          const list = Array.isArray(json.questions) && json.questions.length > 0 ? json.questions : DEMO_QUESTIONS;
          setQuestions(list);
        })
        .catch(() => setQuestions(DEMO_QUESTIONS));
    } else {
      setQuestions(DEMO_QUESTIONS);
    }
  }, [courseId, weekNumber]);

  // WebSocket 2-player sync: connect to wsUrl; send our position (role + x, z, rotationY).
  // Server should broadcast each client's messages to the other client in the same room.
  // Incoming message shape: { type: "position", role: "pikachu"|"charmander", x, z, rotationY }
  useEffect(() => {
    if (!wsUrl || typeof window === "undefined") return;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "position" && msg.role && msg.role !== role) {
          remotePositionRef.current = {
            x: Number(msg.x) || 0,
            z: Number(msg.z) ?? 50,
            rotationY: Number(msg.rotationY) || 0,
          };
        }
      } catch (_) {}
    };
    ws.onerror = () => {};
    sendPositionRef.current = (x, z, rotationY) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const now = Date.now();
      if (now - lastSendTimeRef.current < POSITION_SYNC_INTERVAL_MS) return;
      lastSendTimeRef.current = now;
      ws.send(JSON.stringify({ type: "position", role, x, z, rotationY }));
    };
    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [wsUrl, role]);

  const playerName = isCharmander ? "Charmander" : "Pikachu";
  const opponentName = isCharmander ? "Pikachu" : "Charmander";
  const playerMoves = isCharmander ? ENEMY_MOVES : PIKACHU_MOVES;

  const applyMoveResult = (hit, move) => {
    const dmg = hit ? damage(move.power) : 0;
    const newEnemyHp = Math.max(0, enemyHp - dmg);
    if (hit) {
      setEnemyHp(newEnemyHp);
      setBattleMessage(`${playerName} used ${move.name}! (-${dmg})`);
    } else {
      setBattleMessage(`${playerName} used ${move.name}! But it missed!`);
    }
    setBattlePhase("message");
    setTimeout(() => {
      if (newEnemyHp <= 0) {
        setBattlePhase("won");
        setBattleMessage(`${opponentName} fainted! You win!`);
        return;
      }
      setBattleMessage("");
      const enemyMove = isCharmander ? PIKACHU_MOVES[Math.floor(Math.random() * PIKACHU_MOVES.length)] : ENEMY_MOVES[Math.floor(Math.random() * ENEMY_MOVES.length)];
      const enemyDmg = damage(enemyMove.power, isCharmander ? 25 : 17);
      const newPlayerHp = Math.max(0, playerHp - enemyDmg);
      setPlayerHp(newPlayerHp);
      setBattleMessage(`${opponentName} used ${enemyMove.name}! (-${enemyDmg})`);
      setBattlePhase("message");
      setTimeout(() => {
        setBattleMessage("");
        if (newPlayerHp <= 0) {
          setBattlePhase("lost");
          setBattleMessage(`${playerName} fainted! You lost...`);
        } else {
          setBattlePhase("menu");
        }
      }, 1800);
    }, 1800);
  };

  const resolveQuestion = (correct) => {
    setQuestionRevealed(true);
    const move = pendingMoveRef.current;
    setTimeout(() => {
      setShowBattleQuestion(false);
      setBattleQuestion(null);
      setQuestionRevealed(false);
      setSelectedOption(null);
      pendingMoveRef.current = null;
      if (move) applyMoveResult(correct, move);
    }, 800);
  };

  const handleFight = () => setBattlePhase("fight");
  const handleMove = (move) => {
    const list = questions.length > 0 ? questions : DEMO_QUESTIONS;
    const q = list[Math.floor(Math.random() * list.length)];
    pendingMoveRef.current = move;
    setBattleQuestion(q);
    setQuestionRevealed(false);
    setSelectedOption(null);
    setShowBattleQuestion(true);
  };

  const onQuestionOptionSelect = (optionIndex) => {
    if (!battleQuestion || questionRevealed) return;
    setSelectedOption(optionIndex);
    const correct = optionIndex === battleQuestion.correct_index;
    resolveQuestion(correct);
  };

  const backToMenu = () => setBattlePhase("menu");

  useEffect(() => {
    const t = setTimeout(() => setShowControlsHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    let cancelled = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ecce8);

    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 9, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    const setSize = () => {
      const w = currentMount.clientWidth || 800;
      const h = currentMount.clientHeight || 450;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();
    currentMount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    window.addEventListener("resize", setSize);

    scene.add(new THREE.AmbientLight(0xffeedd, 0.65));
    const dir = new THREE.DirectionalLight(0xffe8d8, 0.85);
    dir.position.set(40, 80, 60);
    dir.castShadow = true;
    dir.shadow.camera.left = dir.shadow.camera.bottom = -GROUND_SIZE / 2;
    dir.shadow.camera.right = dir.shadow.camera.top = GROUND_SIZE / 2;
    scene.add(dir);

    const groundGeom = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 32, 32);
    const fallbackGroundTex = createGroundTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: fallbackGroundTex,
      color: 0xeed8c8,
      roughness: 0.92,
      metalness: 0.05,
      side: THREE.FrontSide,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const groundTextureUrls = [
      "/textures/ground.jpg",
      "/textures/grass.jpg",
      process.env.NEXT_PUBLIC_GROUND_TEXTURE_URL,
    ].filter(Boolean);
    loadImageTexture(groundTextureUrls, fallbackGroundTex).then((tex) => {
      if (cancelled) return;
      if (tex !== fallbackGroundTex) {
        tex.repeat.set(24, 24);
        if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
        groundMat.map = tex;
      }
    });

    loadModel("/models/colosseum.glb", 140)
      .then((arena) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(arena);
        arena.position.y = -box.min.y -10;
        arena.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        scene.add(arena);
      })
      .catch((err) => {
        if (!cancelled) console.warn("Colosseum not found", err);
      });

    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3();
    const rayDir = new THREE.Vector3(0, -1, 0);
    const groundOffset = 0;

    const player = new THREE.Group();
    if (playerModelUrl) {
      loadModel(playerModelUrl, 3.6)
        .then((model) => {
          if (cancelled) return;
          const box = new THREE.Box3().setFromObject(model);
          model.position.y = -box.min.y;
          player.add(model);
        })
        .catch(() => {
          if (cancelled) return;
          addDefaultPlayerMeshes(player);
        });
    } else {
      addDefaultPlayerMeshes(player);
    }
    /** Spawn well outside the arena so camera is not inside arena geometry. */
    const spawnZ = 50;
    player.position.set(0, groundOffset, spawnZ);
    scene.add(player);

    const charmanderGroup = new THREE.Group();
    loadModel("/models/charmander/model.obj", 3.6)
      .then((model) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(model);
        model.position.y = -box.min.y;
        charmanderGroup.add(model);
      })
      .catch(() => {});
    const spawnZCharmander = spawnZ;
    charmanderGroup.position.set(2.5, groundOffset, spawnZCharmander);
    charmanderGroup.rotation.y = -Math.PI / 2;
    scene.add(charmanderGroup);

    const charmanderTarget = new THREE.Vector3(2.5, groundOffset, spawnZCharmander);
    let charmanderRotationY = -Math.PI / 2;

    loadFBX("/models/megakit/Grass_Common_Short.fbx", 1.5)
      .then((grass) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(grass);
        grass.position.set(-3, -box.min.y, 2);
        scene.add(grass);
      })
      .catch(() => {});

    const stoneTex = createStoneTexture();
    const barkTex = createBarkTexture();
    const sakuraPetalTex = createSakuraPetalTexture();
    const sharedTrunkMaterial = new THREE.MeshStandardMaterial({
      map: barkTex,
      color: 0xffffff,
      roughness: 0.9,
    });

    const lantern = createCheckpointMarker(stoneTex);
    lantern.scale.setScalar(2.2);
    lantern.position.set(LANTERN_POSITION.x, LANTERN_POSITION.y, LANTERN_POSITION.z);
    scene.add(lantern);

    const lanternPositions = [[-60, -60], [70, -50], [-70, 55], [55, 65], [0, -70], [-65, 30], [68, -25]];
    lanternPositions.forEach(([x, z]) => {
      const deco = createStoneLantern(stoneTex, false);
      deco.position.set(x, 0, z);
      deco.rotation.y = noise2D(x, z) * Math.PI * 0.3;
      scene.add(deco);
    });

    const treeRefs = [];
    const applySakuraFoliage = (group) => {
      const sakuraPink = new THREE.Color(0xffb7c5);
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (!m || !m.color) return;
            const sum = m.color.r + m.color.g + m.color.b;
            if (sum >= 0.25) {
              m.color.copy(sakuraPink);
              if (m.emissive) m.emissive.setHex(0xe88aa0);
            }
          });
        }
      });
    };
    const allTreePositions = [...getTreePositions(), ...getArenaRingTreePositions()];
    (async () => {
      try {
        const treeTemplate = await loadModel("/models/tree.obj", 11, "tree.mtl");
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(treeTemplate);
        const treeBaseY = -box.min.y;
        treeTemplate.position.y = treeBaseY;
        applySakuraFoliage(treeTemplate);
        allTreePositions.forEach(([x, z], index) => {
          const tree = treeTemplate.clone(true);
          applySakuraFoliage(tree);
          tree.position.set(x, treeBaseY, z);
          tree.userData.windPhase = index * 0.7;
          scene.add(tree);
          treeRefs.push(tree);
        });
      } catch (err) {
        if (cancelled) return;
        allTreePositions.forEach(([x, z], index) => {
          const tree = createCherryTree(sharedTrunkMaterial, sakuraPetalTex, index);
          tree.position.set(x, 0, z);
          tree.userData.windPhase = index * 0.7;
          scene.add(tree);
          treeRefs.push(tree);
        });
      }
    })();

    const toriiPositions = [[-120, 0], [120, 0], [0, -120]];
    loadModel("/models/torii/model.obj", 16)
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
      .catch(() => {
        if (cancelled) return;
        const vermillionTex = createVermillionTexture();
        if (vermillionTex.colorSpace !== undefined) vermillionTex.colorSpace = THREE.SRGBColorSpace;
        toriiPositions.forEach(([x, z]) => {
          const torii = createTorii(vermillionTex);
          torii.position.set(x, 0, z);
          scene.add(torii);
        });
      });

    loadModel("/models/fox/model.obj", 1.35)
      .then((foxModel) => {
        if (cancelled) return;
        const box = new THREE.Box3().setFromObject(foxModel);
        foxModel.position.set(-8, -box.min.y, 30);
        foxModel.rotation.y = -Math.PI * 0.4;
        scene.add(foxModel);
      })
      .catch(() => {});

    const flowerPositions = [];
    for (let i = 0; i < 40; i++) {
      const t = (i * 0.61) % 1;
      const a = t * Math.PI * 2 * 5 + i * 0.3;
      const r = Math.min(15 + (i % 8) * 25 + ((i * 0.17) % 1) * 180, TREE_MARGIN - 5);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      flowerPositions.push([x, z]);
    }
    loadFBX("/models/Flowers.fbx", 1.4)
      .then((flowerTemplate) => {
        if (cancelled) return;
        const baseY = (() => {
          const b = new THREE.Box3().setFromObject(flowerTemplate);
          return -b.min.y;
        })();
        flowerPositions.forEach(([x, z], i) => {
          const flower = flowerTemplate.clone(true);
          flower.position.set(x, baseY, z);
          flower.rotation.y = (i * 0.7) % (Math.PI * 2);
          flower.scale.multiplyScalar(0.85 + (i % 4) * 0.08);
          scene.add(flower);
        });
      })
      .catch(() => {});

    const keys = {};
    const velocity = new THREE.Vector3();
    const playerTarget = new THREE.Vector3(0, groundOffset, spawnZ);
    const cameraTarget = new THREE.Vector3(0, 9, spawnZ + 25);
    const lookAtTarget = new THREE.Vector3(0, 3, 0);
    let targetRotationY = 0;
    const moveDamp = 0.18;
    const cameraDamp = 0.08;
    const rotationDamp = 0.15;

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (e.code) keys[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      if (e.code) keys[e.code.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const battleOpen = battleOpenRef.current;

      const controlledPos = isCharmander ? charmanderGroup.position : player.position;
      const distToLantern = controlledPos.distanceTo(lantern.position);
      setNearLantern(distToLantern < CHECKPOINT_INTERACT_RADIUS);

      velocity.set(0, 0, 0);
      if (!battleOpen) {
        if (keys["w"] || keys["arrowup"] || keys["keyw"]) velocity.z -= 1;
        if (keys["s"] || keys["arrowdown"] || keys["keys"]) velocity.z += 1;
        if (keys["a"] || keys["arrowleft"] || keys["keya"]) velocity.x -= 1;
        if (keys["d"] || keys["arrowright"] || keys["keyd"]) velocity.x += 1;
      }

      if (isCharmander) {
        if (velocity.length() > 0) {
          velocity.normalize().multiplyScalar(PLAYER_MOVE_SPEED);
          charmanderTarget.x += velocity.x;
          charmanderTarget.z += velocity.z;
          charmanderRotationY = Math.atan2(-velocity.x, -velocity.z);
        }
        charmanderTarget.x = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, charmanderTarget.x));
        charmanderTarget.z = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, charmanderTarget.z));
        charmanderGroup.position.x += (charmanderTarget.x - charmanderGroup.position.x) * moveDamp;
        charmanderGroup.position.z += (charmanderTarget.z - charmanderGroup.position.z) * moveDamp;
        let cy = charmanderGroup.rotation.y;
        while (cy > Math.PI) cy -= Math.PI * 2;
        while (cy < -Math.PI) cy += Math.PI * 2;
        let dcy = charmanderRotationY - cy;
        if (dcy > Math.PI) dcy -= Math.PI * 2;
        if (dcy < -Math.PI) dcy += Math.PI * 2;
        charmanderGroup.rotation.y = cy + dcy * rotationDamp;
        rayOrigin.set(charmanderGroup.position.x, 50, charmanderGroup.position.z);
        raycaster.set(rayOrigin, rayDir);
        const hitsC = raycaster.intersectObject(ground);
        charmanderGroup.position.y = hitsC.length > 0 ? hitsC[0].point.y + groundOffset : groundOffset;
        sendPositionRef.current(charmanderGroup.position.x, charmanderGroup.position.z, charmanderGroup.rotation.y);
        const remote = remotePositionRef.current;
        player.position.x += (remote.x - player.position.x) * moveDamp;
        player.position.z += (remote.z - player.position.z) * moveDamp;
        player.rotation.y = remote.rotationY;
        rayOrigin.set(player.position.x, 50, player.position.z);
        raycaster.set(rayOrigin, rayDir);
        const hitsP = raycaster.intersectObject(ground);
        player.position.y = hitsP.length > 0 ? hitsP[0].point.y + groundOffset : groundOffset;
        cameraTarget.x = charmanderGroup.position.x;
        cameraTarget.z = charmanderGroup.position.z + 20;
        cameraTarget.y = charmanderGroup.position.y + 9;
        lookAtTarget.set(charmanderGroup.position.x, charmanderGroup.position.y + 3, charmanderGroup.position.z);
      } else {
        if (velocity.length() > 0) {
          velocity.normalize().multiplyScalar(PLAYER_MOVE_SPEED);
          playerTarget.x += velocity.x;
          playerTarget.z += velocity.z;
          targetRotationY = Math.atan2(-velocity.x, -velocity.z);
        }
        playerTarget.x = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, playerTarget.x));
        playerTarget.z = Math.max(-PLAY_RADIUS, Math.min(PLAY_RADIUS, playerTarget.z));
        player.position.x += (playerTarget.x - player.position.x) * moveDamp;
        player.position.z += (playerTarget.z - player.position.z) * moveDamp;
        let currentY = player.rotation.y;
        while (currentY > Math.PI) currentY -= Math.PI * 2;
        while (currentY < -Math.PI) currentY += Math.PI * 2;
        let dy = targetRotationY - currentY;
        if (dy > Math.PI) dy -= Math.PI * 2;
        if (dy < -Math.PI) dy += Math.PI * 2;
        player.rotation.y = currentY + dy * rotationDamp;
        rayOrigin.set(player.position.x, 50, player.position.z);
        raycaster.set(rayOrigin, rayDir);
        const hits = raycaster.intersectObject(ground);
        player.position.y = hits.length > 0 ? hits[0].point.y + groundOffset : groundOffset;
        sendPositionRef.current(player.position.x, player.position.z, player.rotation.y);
        const remote = remotePositionRef.current;
        charmanderGroup.position.x += (remote.x - charmanderGroup.position.x) * moveDamp;
        charmanderGroup.position.z += (remote.z - charmanderGroup.position.z) * moveDamp;
        charmanderGroup.rotation.y = remote.rotationY;
        rayOrigin.set(charmanderGroup.position.x, 50, charmanderGroup.position.z);
        raycaster.set(rayOrigin, rayDir);
        const hitsCh = raycaster.intersectObject(ground);
        charmanderGroup.position.y = hitsCh.length > 0 ? hitsCh[0].point.y + groundOffset : groundOffset;
        cameraTarget.x = player.position.x;
        cameraTarget.z = player.position.z + 20;
        cameraTarget.y = player.position.y + 9;
        lookAtTarget.set(player.position.x, player.position.y + 3, player.position.z);
      }

      const time = performance.now() * 0.001;
      treeRefs.forEach((tree) => {
        const phase = (tree.userData.windPhase || 0) + time;
        const sway = Math.sin(phase * 0.8) * 0.03;
        if (tree.userData.foliageGroup) {
          tree.userData.foliageGroup.rotation.z = sway;
          tree.userData.foliageGroup.rotation.x = Math.sin(phase * 0.5) * 0.02;
        }
        tree.rotation.z = sway * 0.6;
        tree.rotation.x = Math.sin(phase * 0.5) * 0.015;
      });

      camera.position.x += (cameraTarget.x - camera.position.x) * cameraDamp;
      camera.position.y += (cameraTarget.y - camera.position.y) * cameraDamp;
      camera.position.z += (cameraTarget.z - camera.position.z) * cameraDamp;
      camera.lookAt(lookAtTarget);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", setSize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [playerModelUrl, role]);

  useEffect(() => {
    const handleSpace = (e) => {
      if (e.key !== " " || !nearLantern || showBattleView) return;
      e.preventDefault();
      setShowBattleView(true);
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [nearLantern, showBattleView]);

  return (
    <>
      <div ref={mountRef} className="absolute inset-0 w-full h-full min-w-0 min-h-0" />
      {showControlsHint && (
        <div className="absolute bottom-6 left-4 max-w-[200px] bg-black/70 text-white px-3 py-2.5 rounded-lg text-xs pointer-events-none">
          <div className="font-semibold mb-1">Controls</div>
          <div>WASD — Move</div>
          {nearLantern && (
            <div className="text-amber-300 font-bold mt-1.5 animate-pulse">Press SPACE to interact</div>
          )}
        </div>
      )}
      {nearLantern && !showControlsHint && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/75 text-amber-300 px-4 py-2.5 rounded-lg text-sm font-bold animate-pulse pointer-events-none shadow-lg border border-amber-500/40">
          Press SPACE to interact
        </div>
      )}
      <AnimatePresence>
        {showBattleView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(to bottom, #a8c890 0%, #a8c890 32%, #6b8e5a 32%, #5a7a4a 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)" }} />
            <button
              type="button"
              onClick={() => setShowBattleView(false)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded bg-black/30 hover:bg-black/50 text-white transition-colors"
              aria-label="Close battle"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Opponent panel (top-left) */}
            <div
              className="absolute left-4 top-4 z-10 border-2 border-gray-800 bg-gray-300 px-3 py-2 shadow-lg"
              style={{ clipPath: "polygon(0 0, 100% 0, 96% 100%, 4% 100%)", minWidth: 160 }}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-black text-sm" style={{ fontFamily: "Georgia, serif" }}>{opponentName}</span>
                <span className="text-red-600 text-xs font-bold">♀</span>
                <span className="font-bold text-black text-xs" style={{ fontFamily: "Georgia, serif" }}>Lv.17</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full border border-gray-700 bg-red-500" />
                </div>
                <span className="text-amber-600 font-bold text-xs" style={{ fontFamily: "Georgia, serif" }}>HP</span>
                <div className="flex-1 h-3 bg-gray-500 rounded-sm overflow-hidden border border-gray-700">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${enemyHp / enemyMaxHp > 0.2 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right font-bold text-black text-xs mt-0.5" style={{ fontFamily: "Georgia, serif" }}>{enemyHp}/{enemyMaxHp}</div>
            </div>

            {/* Player panel (middle-right) - your Pokémon */}
            <div
              className="absolute right-4 top-24 z-10 border-2 border-gray-800 bg-gray-300 px-3 py-2 shadow-lg"
              style={{ clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)", minWidth: 160 }}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-bold text-black text-sm" style={{ fontFamily: "Georgia, serif" }}>{playerName}</span>
                <span className="text-blue-600 text-xs font-bold">♂</span>
                <span className="font-bold text-black text-xs" style={{ fontFamily: "Georgia, serif" }}>Lv.42</span>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-amber-600 font-bold text-xs" style={{ fontFamily: "Georgia, serif" }}>HP</span>
                <div className="flex-1 h-3 bg-gray-500 rounded-sm overflow-hidden border border-gray-700">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${playerHp / playerMaxHp > 0.2 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right font-bold text-black text-xs" style={{ fontFamily: "Georgia, serif" }}>{playerHp}/{playerMaxHp}</div>
            </div>

            {/* Pokémon 3D view (center) - your Pokémon on left when Charmander, on right when Pikachu */}
            <div className="flex-1 flex flex-col min-h-0 pt-14 pb-2">
              <BattleModelsView playerModelUrl={playerModelUrl} visible={showBattleView} role={role} />
            </div>

            {/* Battle question overlay: answer to land your move */}
            {showBattleQuestion && battleQuestion && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-gray-200 border-4 border-gray-800 rounded-lg shadow-xl max-w-lg w-full p-4" style={{ fontFamily: "Georgia, serif" }}>
                  <p className="text-sm font-bold text-amber-800 mb-2">Answer correctly to hit!</p>
                  <p className="font-bold text-black mb-3">{battleQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {battleQuestion.options.map((opt, idx) => {
                      const revealed = questionRevealed;
                      const isCorrect = idx === battleQuestion.correct_index;
                      const isSelected = selectedOption === idx;
                      let btnClass = "border-2 border-gray-800 py-2.5 px-2 font-bold text-sm rounded-sm text-left ";
                      if (revealed) {
                        if (isCorrect) btnClass += "bg-green-500 text-white border-green-700";
                        else if (isSelected) btnClass += "bg-red-500 text-white border-red-700";
                        else btnClass += "bg-gray-400 text-gray-600";
                      } else {
                        btnClass += "bg-amber-100 text-slate-900 hover:bg-amber-200";
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onQuestionOptionSelect(idx)}
                          disabled={questionRevealed}
                          className={btnClass}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Command menu (bottom) - FIGHT only */}
            <div className="border-4 border-gray-900 bg-gray-200 p-3 flex gap-3 shrink-0 mx-2 mb-2">
              <div className="flex-1 border-2 border-gray-800 bg-white p-4 flex items-center gap-2 relative min-h-[88px]">
                <p className="font-bold text-black text-base" style={{ fontFamily: "Georgia, serif" }}>
                  {battleMessage || (battlePhase === "fight" ? "Choose a move." : `What will ${playerName} do?`)}
                </p>
                {battlePhase === "menu" && <Search className="absolute bottom-2 left-2 w-5 h-5 text-gray-700 stroke-[2.5]" aria-hidden />}
              </div>
              {(battlePhase === "menu" || battlePhase === "fight" || battlePhase === "won" || battlePhase === "lost") && (
                <div className="flex flex-col gap-2.5 w-64">
                  {battlePhase === "menu" && (
                    <button type="button" onClick={handleFight} className="border-2 border-gray-800 py-3.5 px-4 font-bold text-white text-sm rounded-sm shadow-sm hover:brightness-110 w-full" style={{ background: "linear-gradient(to bottom, #e87070 0%, #c03030 100%)", fontFamily: "Georgia, serif" }}>FIGHT</button>
                  )}
                  {battlePhase === "fight" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {playerMoves.map((m) => (
                        <button key={m.name} type="button" onClick={() => handleMove(m)} disabled={enemyHp <= 0} className="border-2 border-gray-800 py-2.5 px-2 font-bold text-slate-900 text-xs rounded-sm shadow-sm hover:brightness-95 bg-amber-100" style={{ fontFamily: "Georgia, serif" }}>{m.name}</button>
                      ))}
                      <button type="button" onClick={backToMenu} className="col-span-2 border-2 border-gray-800 py-2 font-bold text-gray-800 text-sm rounded-sm bg-gray-300 hover:bg-gray-400" style={{ fontFamily: "Georgia, serif" }}>Back</button>
                    </div>
                  )}
                  {(battlePhase === "won" || battlePhase === "lost") && (
                    <button type="button" onClick={() => setShowBattleView(false)} className="border-2 border-gray-800 py-3.5 font-bold text-white text-sm rounded-sm" style={{ background: battlePhase === "won" ? "linear-gradient(to bottom, #50a050 0%, #308030 100%)" : "linear-gradient(to bottom, #a05050 0%, #803030 100%)", fontFamily: "Georgia, serif" }}>Close</button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
