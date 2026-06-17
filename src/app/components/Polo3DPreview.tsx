import { Suspense, useEffect, useMemo, useState } from 'react';
import { Bounds, ContactShadows, Decal, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  Color,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  SRGBColorSpace,
  Texture,
} from 'three';
import type { PreviewData } from './ProductPreview';

const MODEL_PATH = '/models/tshirt/shirt_baked.glb';
const BRAND_GREEN = '#1b4332';

type DesignCopy = {
  career: string;
  fullName: string;
  promoYear: string;
};

type Polo3DPreviewProps = {
  data: PreviewData;
};

function getPreviewYear(data: PreviewData) {
  return data['año'] ?? data['aÃ±o'] ?? data.ano ?? '';
}

function drawContainImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const drawWidth = imageRatio > targetRatio ? width : height * imageRatio;
  const drawHeight = imageRatio > targetRatio ? width / imageRatio : height;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontWeight: number,
  startSize: number,
  minimumSize: number,
) {
  let fontSize = startSize;

  do {
    context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > minimumSize);

  context.fillText(text, x, y);
}

function createBackDesignTexture(copy: DesignCopy, uploadedImage: HTMLImageElement | null) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;

  const context = canvas.getContext('2d');

  if (!context) {
    return new CanvasTexture(canvas);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = 'rgba(255, 255, 255, 0.72)';
  context.fillRect(178, 130, 668, 764);

  context.strokeStyle = BRAND_GREEN;
  context.lineWidth = 10;
  context.strokeRect(198, 150, 628, 724);

  context.fillStyle = BRAND_GREEN;
  drawCenteredText(context, 'Universidad Ricardo Palma', canvas.width / 2, 245, 650, 800, 58, 30);

  context.beginPath();
  context.moveTo(270, 320);
  context.lineTo(754, 320);
  context.stroke();

  if (uploadedImage) {
    drawContainImage(context, uploadedImage, 350, 355, 324, 218);
  } else {
    context.fillStyle = 'rgba(27, 67, 50, 0.1)';
    context.fillRect(350, 355, 324, 218);
    context.strokeStyle = BRAND_GREEN;
    context.lineWidth = 6;
    context.strokeRect(350, 355, 324, 218);
  }

  context.fillStyle = '#10251d';
  drawCenteredText(context, copy.fullName.toUpperCase(), canvas.width / 2, 650, 650, 800, 70, 30);
  drawCenteredText(context, copy.career, canvas.width / 2, 735, 630, 600, 50, 24);

  context.fillStyle = BRAND_GREEN;
  drawCenteredText(context, `Promo ${copy.promoYear}`, canvas.width / 2, 815, 560, 800, 64, 28);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function useLoadedImage(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return undefined;
    }

    let cancelled = false;
    const nextImage = new Image();

    nextImage.onload = () => {
      if (!cancelled) setImage(nextImage);
    };
    nextImage.onerror = () => {
      if (!cancelled) setImage(null);
    };
    nextImage.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return image;
}

function BackDesignDecal({
  copy,
  uploadedImage,
}: {
  copy: DesignCopy;
  uploadedImage: HTMLImageElement | null;
}) {
  const texture = useMemo(() => createBackDesignTexture(copy, uploadedImage), [copy, uploadedImage]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return (
    <Decal
      position={[0, 0.02, -0.13]}
      rotation={[0, Math.PI, 0]}
      scale={[0.32, 0.42, 0.32]}
      map={texture as Texture}
    />
  );
}

function ShirtModel({
  copy,
  uploadedImage,
}: {
  copy: DesignCopy;
  uploadedImage: HTMLImageElement | null;
}) {
  const gltf = useGLTF(MODEL_PATH);

  const shirtMesh = useMemo<Mesh | null>(() => {
    let selectedMesh: Mesh | null = null;

    gltf.scene.traverse((object) => {
      if (object instanceof Mesh && (!selectedMesh || object.name === 'T_Shirt_male')) {
        selectedMesh = object;
      }
    });

    return selectedMesh;
  }, [gltf.scene]);

  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color('#ffffff'),
        roughness: 0.86,
        metalness: 0,
        clearcoat: 0.08,
        clearcoatRoughness: 0.9,
      }),
    [],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  if (!shirtMesh) {
    return null;
  }

  return (
    <mesh castShadow receiveShadow geometry={shirtMesh.geometry} material={material} dispose={null}>
      <BackDesignDecal copy={copy} uploadedImage={uploadedImage} />
    </mesh>
  );
}

function CanvasResizeSync() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const parent = canvas.parentElement;

    if (!parent) {
      return undefined;
    }

    const syncSize = () => {
      const bounds = parent.getBoundingClientRect();
      const width = Math.max(Math.floor(bounds.width), 280);
      const height = Math.max(Math.floor(bounds.height), 320);

      canvas.width = width;
      canvas.height = height;
      gl.setSize(width, height, false);
    };

    syncSize();

    const observer = new ResizeObserver(syncSize);
    observer.observe(parent);

    return () => observer.disconnect();
  }, [gl]);

  return null;
}

function LoadingPreview() {
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-2xl bg-white text-sm font-medium text-gray-400">
      Cargando preview 3D...
    </div>
  );
}

function PoloScene({ data }: Polo3DPreviewProps) {
  const copy = useMemo(
    () => ({
      fullName: data.nombre.trim() || 'Nombre Completo',
      career: data.carrera.trim() || 'Carrera Profesional',
      promoYear: getPreviewYear(data) || '2026',
    }),
    [data],
  );
  const uploadedImage = useLoadedImage(data.foto);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.02, -1.35], fov: 32, near: 0.1, far: 10 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#ffffff']} />
      <CanvasResizeSync />
      <ambientLight intensity={0.92} />
      <directionalLight castShadow intensity={2.4} position={[-1.4, 1.8, -2.2]} />
      <directionalLight intensity={0.7} position={[1.6, 1.2, 1.8]} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.25}>
          <ShirtModel copy={copy} uploadedImage={uploadedImage} />
        </Bounds>
        <ContactShadows opacity={0.18} scale={1.2} blur={2.2} far={0.8} position={[0, -0.36, 0]} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={0.65}
        maxDistance={2}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.86}
        enablePan={false}
      />
    </Canvas>
  );
}

export function Polo3DPreview({ data }: Polo3DPreviewProps) {
  return (
    <div className="relative h-[380px] w-full max-w-full overflow-hidden rounded-2xl bg-white sm:h-[480px]">
      <Suspense fallback={<LoadingPreview />}>
        <PoloScene data={data} />
      </Suspense>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
