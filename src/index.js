import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GUI } from "dat.gui";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

// spector js
// var SPECTOR = require("spectorjs");
// var spector = new SPECTOR.Spector();
// spector.displayUI();

const debugObject = {};

// GUI
const gui = new GUI();

// scene
const scene = new THREE.Scene();

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// DRACO Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Textures
const bakedTexture = textureLoader.load("/baked.jpg");

//
// Materials
//
// Baked materials
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

// portal light material
debugObject.portalColorStart = "#ffffff";
debugObject.portalColorEnd = "#000000";
debugObject.portalStrength = 5.0;

gui
  .addColor(debugObject, "portalColorStart")
  .name("Portal Color A")
  .onChange(() => {
    portalLightMaterial.uniforms.uColorStart.value.set(
      debugObject.portalColorStart
    );
  });

gui
  .addColor(debugObject, "portalColorEnd")
  .name("Portal Color B")
  .onChange(() => {
    portalLightMaterial.uniforms.uColorEnd.value.set(
      debugObject.portalColorEnd
    );
  });

gui
  .add(debugObject, "portalStrength")
  .min(0)
  .max(10)
  .step(0.1)
  .onChange(() => {
    portalLightMaterial.uniforms.uStrength.value = debugObject.portalStrength;
  });

const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
    uStrength: { value: debugObject.portalStrength },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

// pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

gltfLoader.load(
  "portal.glb",
  (gltf) => {
    console.log(gltf);
    gltf.scene.traverse((child) => {
      // console.log(child.name);
      child.material = bakedMaterial;
    });

    const poleLight1Mesh = gltf.scene.children.find(
      (child) => child.name === "poleLight1"
    );
    const poleLigh2Mesh = gltf.scene.children.find(
      (child) => child.name === "poleLight2"
    );
    const portalLightMesh = gltf.scene.children.find(
      (child) => child.name === "portalLight"
    );

    poleLight1Mesh.material = poleLightMaterial;
    poleLigh2Mesh.material = poleLightMaterial;
    portalLightMesh.material = portalLightMaterial;

    scene.add(gltf.scene);
  },
  () => {},
  () => {}
);

//
//
//
// fireflies
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.9;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);

//Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending, // bad for performance though
  depthWrite: false,
});
gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");

//points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

// camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(2, 2, 1);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("0x000000");
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.outputEncoding = THREE.sRGBEncoding;

// renderer background
debugObject.clearColor = "#383e38";
renderer.setClearColor(debugObject.clearColor);
gui
  .addColor(debugObject, "clearColor")
  .onChange(() => renderer.setClearColor(debugObject.clearColor));

// orbit
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;

// lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

camera.position.z = 2;

function handleWindowResize() {
  // update sizes
  const w = window.innerWidth,
    h = window.innerHeight;

  // update camera
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // update renderer
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
}

const clock = new THREE.Clock();
function animate() {
  const elapseTime = clock.getElapsedTime();

  // call animate again on the next frame
  requestAnimationFrame(animate);

  // update material
  firefliesMaterial.uniforms.uTime.value = elapseTime;
  portalLightMaterial.uniforms.uTime.value = elapseTime;

  // update renderer
  renderer.render(scene, camera);

  // update controls
  controls.update();
}

window.addEventListener("resize", handleWindowResize);
animate();
