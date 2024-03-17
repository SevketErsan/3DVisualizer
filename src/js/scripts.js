import * as THREE from "three";
import { GUI } from "dat.gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//renderer.setClearColor(0x222222);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const params = {
  red: 1.0,
  green: 1.0,
  blue: 1.0,
  threshold: 0.5,
  strength: 0.5,
  radius: 0.8,
};

renderer.outputColorSpace = THREE.SRGBColorSpace;

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight)
);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

const outputPass = new OutputPass();
bloomComposer.addPass(outputPass);

camera.position.set(0, -2, 14);
camera.lookAt(0, 0, 0);

const uniforms = {
  u_time: { type: "f", value: 0.0 },
  u_frequency: { type: "f", value: 0.0 },
  u_red: { type: "f", value: 1.0 },
  u_green: { type: "f", value: 1.0 },
  u_blue: { type: "f", value: 1.0 },
};

const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: document.getElementById("vertexshader").textContent,
  fragmentShader: document.getElementById("fragmentshader").textContent,
});

const geo = new THREE.SphereGeometry(4, 128, 128);
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);
mesh.material.wireframe = false;

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load("./assets/public_sounds_memory.mp3", function (buffer) {
  sound.setBuffer(buffer);
  window.addEventListener("click", function () {
    sound.play();
  });
});

const analyser = new THREE.AudioAnalyser(sound, 32);

const gui = new GUI();

const colorsFolder = gui.addFolder("Colors");
colorsFolder.add(params, "red", 0, 1).onChange(function (value) {
  uniforms.u_red.value = Number(value);
});
colorsFolder.add(params, "green", 0, 1).onChange(function (value) {
  uniforms.u_green.value = Number(value);
});
colorsFolder.add(params, "blue", 0, 1).onChange(function (value) {
  uniforms.u_blue.value = Number(value);
});

const bloomFolder = gui.addFolder("Bloom");
bloomFolder.add(params, "threshold", 0, 1).onChange(function (value) {
  bloomPass.threshold = Number(value);
});
bloomFolder.add(params, "strength", 0, 3).onChange(function (value) {
  bloomPass.strength = Number(value);
});
bloomFolder.add(params, "radius", 0, 1).onChange(function (value) {
  bloomPass.radius = Number(value);
});

const clock = new THREE.Clock();
function animate() {
  camera.lookAt(scene.position);
  uniforms.u_time.value = clock.getElapsedTime();
  uniforms.u_frequency.value = analyser.getAverageFrequency();
  bloomComposer.render();
  requestAnimationFrame(animate);
}
animate();
