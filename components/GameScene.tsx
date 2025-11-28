
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Stars } from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GameState, CityLayout } from '../types';
import { BLOCK_TYPES, MAP_SIZE } from '../constants';
import { audioManager } from '../services/audioService';

// --- Physics Components ---

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid" friction={2} restitution={0.1}>
      {/* Replacing Plane with a thick Box to prevent tunneling bugs */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[MAP_SIZE, 4, MAP_SIZE]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Grid Pattern sits slightly above the floor visual */}
      <gridHelper args={[MAP_SIZE, MAP_SIZE, 0x444444, 0x111111]} position={[0, 0.01, 0]} />
    </RigidBody>
  );
};

const MonsterHand = ({ isSmashing }: { isSmashing: boolean }) => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const { viewport } = useThree(); 
  const vec = new THREE.Vector3();

  useFrame((state) => {
    if (rigidBody.current) {
      // Dynamic mapping using viewport size to ensure mouse sync at all zoom levels
      const targetX = (state.mouse.x * viewport.width) / 2;
      const targetZ = -(state.mouse.y * viewport.height) / 2;

      // Raise height significantly when not smashing so we don't accidentally knock over towers
      // When smashing, push down to y=0.5
      const height = isSmashing ? 0.5 : 12; 
      
      // Use setNextKinematicTranslation for smooth movement of kinematic bodies
      vec.set(targetX, height, targetZ); 
      rigidBody.current.setNextKinematicTranslation(vec);
    }
  });

  return (
    <RigidBody 
        ref={rigidBody} 
        type="kinematicPosition" 
        colliders="ball" 
        restitution={1.2}
        friction={0.5}
    >
      <mesh castShadow>
        <sphereGeometry args={[isSmashing ? 1.5 : 0.8, 32, 32]} />
        <meshStandardMaterial 
            color={isSmashing ? "#ff0000" : "#00ffcc"} 
            emissive={isSmashing ? "#ff0000" : "#0044aa"} 
            emissiveIntensity={2} 
            wireframe 
        />
      </mesh>
      <pointLight color={isSmashing ? "#ff0000" : "#00ffff"} intensity={2} distance={15} decay={2} />
    </RigidBody>
  );
};

interface BlockInstanceData {
  key: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  type: string;
  color: string;
  mass: number;
}

interface BlockProps {
  data: BlockInstanceData;
  onFall: (score: number) => void;
}

const Block: React.FC<BlockProps> = ({ data, onFall }) => {
    const ref = useRef<RapierRigidBody>(null);
    const [hasFallen, setHasFallen] = useState(false);
    const lastVel = useRef(0);
    
    useFrame(() => {
        if (!hasFallen && ref.current) {
            const pos = ref.current.translation();
            // CRITICAL FIX: Only kill block if it falls WAY below the map (-20)
            if (pos.y < -20) {
                 setHasFallen(true);
                 onFall(BLOCK_TYPES[data.type as keyof typeof BLOCK_TYPES].score * 2);
            }
        }
    });

    const handleCollision = ({ other, totalForceMagnitude }: any) => {
        // Lowered threshold for more responsive sound (was 15)
        if (totalForceMagnitude > 2) {
            // Volume depends on impact force
            audioManager.playSmash(Math.min(1, totalForceMagnitude / 50));
        }
        if (data.type === 'EXPLOSIVE' && totalForceMagnitude > 40) {
             audioManager.playExplosion();
             if (ref.current) {
                 ref.current.applyImpulse({ x: 0, y: 10, z: 0 }, true);
             }
        }
    };

    return (
        <RigidBody 
            ref={ref} 
            position={data.position} 
            mass={data.mass} 
            colliders="cuboid"
            friction={0.8} // Increased friction to make stacks more stable initially
            restitution={data.type === 'EXPLOSIVE' ? 1.1 : 0.1}
            onCollisionEnter={handleCollision}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={data.color} />
            </mesh>
        </RigidBody>
    )
}

const City = ({ layout, onBlockFall }: { layout: CityLayout, onBlockFall: (score: number) => void }) => {
    const instances = useMemo<BlockInstanceData[]>(() => {
        if (!layout || !layout.blocks) return [];
        return layout.blocks.map(block => ({
            key: block.id,
            position: block.position,
            rotation: [0, 0, 0],
            scale: [0.98, 0.98, 0.98], // Slightly smaller scale avoids initial overlap jitter
            type: block.type,
            color: block.color,
            mass: block.mass
        }));
    }, [layout]);
    
    return (
        <group>
            {instances.map((data) => (
                <Block key={data.key} data={data} onFall={onBlockFall} />
            ))}
        </group>
    );
};

// --- Main Scene ---

interface GameSceneProps {
    gameState: GameState;
    cityLayout: CityLayout;
    onScoreUpdate: (score: number) => void;
}

export const GameScene = ({ gameState, cityLayout, onScoreUpdate }: GameSceneProps) => {
  const [isSmashing, setIsSmashing] = useState(false);
  const [zoom, setZoom] = useState(30);

  // Initialize Audio on interaction just in case
  const ensureAudio = () => {
    audioManager.init();
  };

  useEffect(() => {
    const down = () => {
        ensureAudio();
        setIsSmashing(true);
        audioManager.playSwing();
    };
    const up = () => setIsSmashing(false);
    
    // Zoom handler
    const handleWheel = (e: WheelEvent) => {
        setZoom((prev) => {
            // Slower zoom speed for better control
            const newZoom = prev - e.deltaY * 0.02;
            return Math.max(10, Math.min(80, newZoom));
        });
    };

    // Prevent context menu to allow Right Click usage
    const preventContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchstart', down);
    window.addEventListener('touchend', up);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('contextmenu', preventContext);

    return () => {
        window.removeEventListener('mousedown', down);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchstart', down);
        window.removeEventListener('touchend', up);
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('contextmenu', preventContext);
    };
  }, []);

  return (
    <Canvas shadows dpr={[1, 2]} onClick={ensureAudio}>
      <OrthographicCamera 
        makeDefault 
        position={[20, 30, 20]} 
        zoom={zoom} 
        near={-100} 
        far={500} 
        onUpdate={c => c.lookAt(0, 0, 0)} 
      />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 5, -10]} color="#00ffcc" intensity={0.5} />

      <Physics gravity={[0, -20, 0]}> 
        {/* Increased gravity for weightier feel */}
        <Floor />
        {gameState.isLevelActive && cityLayout && (
            <City layout={cityLayout} onBlockFall={onScoreUpdate} />
        )}
        <MonsterHand isSmashing={isSmashing} />
      </Physics>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.2} radius={0.4} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
};
