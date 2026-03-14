"use client";
import { useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import QuestionPopup from './QuestionPop';

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

export default function GameCanvas3D({ questions, onComplete, onScoreUpdate }) {
  const mountRef = useRef(null);
  const [checkpoints, setCheckpoints] = useState(() => generateCheckpoints(questions));
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [nearCheckpoint, setNearCheckpoint] = useState(null);

  const checkpointsRef = useRef(checkpoints);
  
  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);

  useEffect(() => {
    const currentMount = mountRef.current;
    
    // Scene setup - Japanese village pink sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0D0E8);
    scene.fog = new THREE.Fog(0xF0D0E8, 30, 80);

    // Camera — aspect updated on resize
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);

    // Renderer — size set from container
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground - stone tile pattern (Japanese style)
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 40, 40);
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.sin(vertices[i] * 0.08) * Math.cos(vertices[i + 1] * 0.08) * 0.8;
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xE0D5C8,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Tile grid pattern
    const gridHelper = new THREE.GridHelper(100, 40, 0xB8ADA0, 0xC8BDB0);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Cherry blossom trees and traditional structures
    const treePositions = [
      [-30, -20], [28, -22], [-32, 18], [30, 20],
      [-20, -30], [22, -15], [-25, 28], [20, 30],
      [0, -35], [-35, 0], [35, 0], [0, 35],
    ];
    
    treePositions.forEach(([x, z]) => {
      const tree = createCherryTree();
      tree.position.set(x, 0, z);
      scene.add(tree);
    });
    
    // Add torii gates
    const toriiPositions = [[-40, 0], [40, 0], [0, -40]];
    toriiPositions.forEach(([x, z]) => {
      const torii = createTorii();
      torii.position.set(x, 0, z);
      scene.add(torii);
    });

    // Player character - kimono style
    const player = new THREE.Group();
    
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
    
    player.position.y = 0;
    player.castShadow = true;
    scene.add(player);

    // Checkpoint markers (store reference map)
    const checkpointMeshes = [];
    const checkpointMap = new Map();
    
    checkpoints.forEach((cp) => {
      const checkpoint = createCheckpoint(cp.id);
      checkpoint.position.set(cp.x, cp.y, cp.z);
      checkpoint.userData = { id: cp.id };
      checkpoint.visible = !cp.answered;
      scene.add(checkpoint);
      checkpointMeshes.push(checkpoint);
      checkpointMap.set(cp.id, checkpoint);
    });

    // Movement
    const keys = {};
    const velocity = new THREE.Vector3();
    const speed = 0.15;

    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Player movement
      velocity.set(0, 0, 0);
      if (keys['w'] || keys['arrowup']) velocity.z -= speed;
      if (keys['s'] || keys['arrowdown']) velocity.z += speed;
      if (keys['a'] || keys['arrowleft']) velocity.x -= speed;
      if (keys['d'] || keys['arrowright']) velocity.x += speed;

      if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(speed);
        player.position.add(velocity);
        
        // Face movement direction
        if (velocity.x !== 0 || velocity.z !== 0) {
          const angle = Math.atan2(velocity.x, velocity.z);
          player.rotation.y = angle;
        }

        // Bobbing animation
        player.position.y = Math.sin(Date.now() * 0.01) * 0.08;
      }

      // Constrain player bounds
      player.position.x = Math.max(-45, Math.min(45, player.position.x));
      player.position.z = Math.max(-45, Math.min(45, player.position.z));

      // Camera follow
      camera.position.x = player.position.x;
      camera.position.z = player.position.z + 20;
      camera.lookAt(player.position.x, 5, player.position.z);

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
      timeouts.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onWindowResize);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      currentMount?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);
  
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
    
    // Close popup and allow continued gameplay
    setActiveQuestion(null);

    if (newAnswered >= questions.length) {
      setTimeout(() => onComplete(newScore, questions.length), 500);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen min-h-screen min-w-0" style={{ minHeight: '100dvh' }}>
      <div ref={mountRef} className="absolute inset-0 top-0 left-0 w-full h-full overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      
      {/* Controls UI — raised so not cut off at bottom */}
      <div className="absolute bottom-6 left-4 max-w-[200px] bg-black/70 text-white px-3 py-2.5 rounded-lg text-xs">
        <div className="font-semibold mb-1">Controls</div>
        <div>WASD or arrows — Move</div>
        {nearCheckpoint !== null && (
          <div className="text-yellow-300 font-bold mt-1.5 animate-pulse">
            SPACE — interact
          </div>
        )}
      </div>

      {/* Progress only (score shown in header) — top-right below header area */}
      <div className="absolute top-14 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
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

// Create cherry blossom tree
function createCherryTree() {
  const tree = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.4, 5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a3520,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  tree.add(trunk);
  
  // Pink blossom foliage
  const blossomPositions = [
    [0, 5.5, 0, 2.5],
    [-1.8, 5, 0, 2.2],
    [1.8, 5, 0, 2.2],
    [0, 7, 0, 2],
    [-1, 6.5, 0, 1.8],
    [1, 6.5, 0, 1.8],
  ];
  
  blossomPositions.forEach(([x, y, z, size]) => {
    const blossomGeometry = new THREE.SphereGeometry(size, 12, 12);
    const blossomMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFB0D0,
      roughness: 0.7,
      emissive: 0xFF80B0,
      emissiveIntensity: 0.1,
    });
    const blossom = new THREE.Mesh(blossomGeometry, blossomMaterial);
    blossom.position.set(x, y, z);
    blossom.castShadow = true;
    tree.add(blossom);
  });
  
  return tree;
}

// Create torii gate
function createTorii() {
  const torii = new THREE.Group();
  
  // Left pillar
  const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.35, 6, 8);
  const pillarMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xCC2200,
    roughness: 0.6,
  });
  const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
  leftPillar.position.set(-3, 3, 0);
  leftPillar.castShadow = true;
  torii.add(leftPillar);
  
  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
  rightPillar.position.set(3, 3, 0);
  rightPillar.castShadow = true;
  torii.add(rightPillar);
  
  // Top beam
  const topBeamGeometry = new THREE.BoxGeometry(8, 0.5, 0.5);
  const beamMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1A1A1A,
    roughness: 0.7,
  });
  const topBeam = new THREE.Mesh(topBeamGeometry, beamMaterial);
  topBeam.position.set(0, 6.5, 0);
  topBeam.castShadow = true;
  torii.add(topBeam);
  
  // Middle beam (red)
  const midBeamGeometry = new THREE.BoxGeometry(6.5, 0.4, 0.4);
  const midBeam = new THREE.Mesh(midBeamGeometry, pillarMaterial);
  midBeam.position.set(0, 5.5, 0);
  midBeam.castShadow = true;
  torii.add(midBeam);
  
  return torii;
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