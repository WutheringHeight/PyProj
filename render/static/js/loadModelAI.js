import * as THREE from "https://unpkg.com/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/MTLLoader.js";

/* =======================
   INIT SCENE
======================= */
const container = document.getElementById("container3D");
if (!container) throw new Error("container3D not found");

const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(0, 1, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

/* =======================
   LIGHTS + CONTROLS
======================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let currentObject = null;

/* =======================
   LOAD MODEL FUNCTION
======================= */
function loadModel(meshUrl, mtlUrl) {
  const mtlLoader = new MTLLoader();
  mtlLoader.load(mtlUrl, (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);

    objLoader.load(meshUrl, (object) => {
      if (currentObject) scene.remove(currentObject);

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      const size = box.getSize(new THREE.Vector3()).length();
      object.scale.setScalar(2 / size);

      scene.add(object);
      currentObject = object;
    });
  });
}

/* =======================
   AUTO LOAD (CLICK OUTPUT)
======================= */
const meshUrl = container.dataset.mesh;
const mtlUrl = container.dataset.mtl;

if (meshUrl && mtlUrl) {
  loadModel(meshUrl, mtlUrl);
}

/* =======================
   SUBMIT PROMPT (AI)
======================= */
const form = document.getElementById("promptForm");
const statusDiv = document.getElementById("status");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (statusDiv) statusDiv.innerText = "⏳ Đang tạo mô hình...";

    const formData = new FormData(form);
    const apiUrl = container.dataset.url;
    const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]").value;

    fetch(apiUrl, {
      method: "POST",
      headers: { "X-CSRFToken": csrftoken },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (statusDiv) statusDiv.innerText = "✅ Tạo xong!";
        loadModel(data.mesh, data.mtl);
      })
      .catch((err) => {
        if (statusDiv) statusDiv.innerText = "❌ Lỗi tạo mô hình";
        console.error(err);
      });
  });
}

/* =======================
   ANIMATION LOOP
======================= */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* =======================
   RESIZE
======================= */
window.addEventListener("resize", () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
