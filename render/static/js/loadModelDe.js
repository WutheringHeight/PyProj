import * as THREE from "https://unpkg.com/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/MTLLoader.js";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container3D");
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 1, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  let currentObject = null;
  let currentFolder = "{{ output|escapejs }}"; // folder từ Django

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

  // Load model lúc đầu nếu có
  const initialMesh = container.dataset.mesh;
  const initialMtl = container.dataset.mtl;
  if (initialMesh && initialMtl) {
    currentFolder = container.dataset.folder;
    loadModel(initialMesh, initialMtl);
  }

  // Click vào default object
  document.querySelectorAll(".object-item").forEach((item) => {
    item.addEventListener("click", () => {
      const folder = item.dataset.folder;
      if (!folder) return;
      currentFolder = folder;
      const mesh = `/media/${folder}/meshes/mesh_0/mesh.obj`;
      const mtl = `/media/${folder}/meshes/mesh_0/mesh.mtl`;
      loadModel(mesh, mtl);
    });
  });

  // Save output
  const saveForm = document.getElementById("saveForm");
  if (saveForm) {
    saveForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!currentFolder) {
        alert("Vui lòng chọn một object trước");
        return;
      }
      const formData = new FormData(saveForm);
      formData.append("source_folder", currentFolder);
      fetch(window.location.href, {
        method: "POST",
        headers: {
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        },
        body: formData,
      })
      .then((res) => res.json())
      .then((data) => alert("✅ Đã lưu output!"))
      .catch((err) => alert("❌ Lỗi khi lưu output"));
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
});
