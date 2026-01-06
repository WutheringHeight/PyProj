  import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
  import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
  import { OBJLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
  import { MTLLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/MTLLoader.js";

  let currentObject = null;
  // Lấy kích thước container 3D
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

  // LIGHTS
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Load khi tạo model mới
  function loadModel(meshUrl, mtlUrl) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtlUrl, (materials) => {
      materials.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);

      objLoader.load(meshUrl, (object) => {
        // Xóa mô hình cũ nếu có
        if (currentObject) {
          scene.remove(currentObject);
        }

        // Chuẩn hóa kích thước và căn giữa
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 2 / size;
        object.scale.setScalar(scale);

        // Thêm vào scene
        scene.add(object);
        currentObject = object;
      });
    });
  }

  // LOAD MODEL
  const meshUrl = container.dataset.mesh;
  const mtlUrl = container.dataset.mtl;
  if (meshUrl && mtlUrl) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtlUrl, (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);

      objLoader.load(meshUrl, (object) => {
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
  // Load OBJ MTL IMAGE do người dùng nhập
  function loadLocalOBJ(objFile, mtlFile, textureFiles) {
    const manager = new THREE.LoadingManager();

    manager.setURLModifier((url) => {
      if (textureFiles[url]) {
        return URL.createObjectURL(textureFiles[url]);
      }
      return url;
    });

    const readerMTL = new FileReader();
    readerMTL.onload = () => {
      const mtlLoader = new MTLLoader(manager);
      const materials = mtlLoader.parse(readerMTL.result);
      materials.preload();

      const readerOBJ = new FileReader();
      readerOBJ.onload = () => {
        const objLoader = new OBJLoader(manager);
        objLoader.setMaterials(materials);

        const object = objLoader.parse(readerOBJ.result);
        scene.add(object);
      };

      readerOBJ.readAsText(objFile);
    };

    readerMTL.readAsText(mtlFile);
  }



  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize theo container
  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  //Load model
  document.getElementById("loadLocalModel").onclick = () => {
    const objFile = objInput.files[0];
    const mtlFile = mtlInput.files[0];
    const textures = {};

    for (const file of textureInput.files) {
      textures[file.name] = file;
    }

    loadLocalOBJ(objFile, mtlFile, textures);
  };

  // Submit prompt
  document.getElementById("promptForm").addEventListener("submit", function (e) {
    e.preventDefault(); // chặn reload

    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "⏳ Đang tạo mô hình...";

    const formData = new FormData(this);
    const apiUrl = container.dataset.url;
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(apiUrl, {
      method: "POST",
      headers: { "X-CSRFToken": csrftoken },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        statusDiv.innerText = "✅ Tạo xong!";
        loadModel(data.mesh, data.mtl); // gọi hàm load Three.js
      })
      .catch((err) => {
        statusDiv.innerText = "❌ Lỗi khi tạo mô hình";
        console.error(err);
      });
  });
