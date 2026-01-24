

import * as THREE from "https://unpkg.com/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/MTLLoader.js";
import { TransformControls } from "https://unpkg.com/three@0.129.0/examples/jsm/controls/TransformControls.js";

/* =====================================================
   1. INIT SCENE
===================================================== */
const container = document.getElementById("container3D");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
scene.fog = new THREE.Fog(0xf0f0f0, 40, 150);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(10, 10, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

/* =====================================================
   2. LIGHTS & ENVIRONMENT
===================================================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const grid = new THREE.GridHelper(100, 100, 0xcccccc, 0xdddddd);
scene.add(grid);

const world = new THREE.Group();
scene.add(world);
window.world = world;

// Sàn tàng hình để click chính xác
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
const raycastFloor = new THREE.Mesh(floorGeo, floorMat);
raycastFloor.rotation.x = -Math.PI / 2;
scene.add(raycastFloor);

/* =====================================================
   3. CONTROLS
===================================================== */
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', (e) => {
    orbitControls.enabled = !e.value;
});

/* =====================================================
   4. STATE & RAYCASTER
===================================================== */
let selectedModelData = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* =====================================================
   5. FUNCTIONS
===================================================== */
function normalizeObject(object, scaleTarget = 3) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    object.position.sub(center); 
    object.position.y += size.y / 2; // Đặt đáy lên y=0
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = scaleTarget / maxDim;
    object.scale.setScalar(scale);
}


function loadModelAtPosition(meshUrl, mtlUrl, x, z,callback = null) {
    const currentObjectCount = world.children.length;

    if (window.USER_PLAN !== 'UNLIMITED' && currentObjectCount >= window.MAX_OBJECTS) {
        alert(`⚠️ Gói ${window.USER_PLAN} của bạn chỉ cho phép tối đa ${window.MAX_OBJECTS} vật thể.\n\nHãy nâng cấp lên UNLIMITED để không bị giới hạn!`);
    
        container.style.cursor = "default";
        selectedModelData = null; 
        return; 
    }
    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtlUrl, (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(meshUrl, (object) => {
            normalizeObject(object);
            object.position.set(x, 0, z);
            object.userData.objUrl = meshUrl;
            object.userData.mtlUrl = mtlUrl;

            world.add(object);
            if (callback) {
                callback(object);
            } else {
                // Nếu nạp mới thủ công thì mới hiện gizmo chọn
                transformControls.attach(object);
            }
        });
    });
}
window.loadModelAtPosition = loadModelAtPosition;
/* =====================================================
   6. EVENT LISTENERS
===================================================== */
// Sử dụng 'click' để tránh xung đột với OrbitControls mousedown
renderer.domElement.addEventListener("click", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);

    // TRƯỜNG HỢP 1: ĐANG ĐỢI ĐẶT ĐỒ
    if (selectedModelData) {
        const hits = raycaster.intersectObject(raycastFloor);
        if (hits.length > 0) {
            const p = hits[0].point;
            loadModelAtPosition(selectedModelData.obj, selectedModelData.mtl, Math.round(p.x), Math.round(p.z));
            selectedModelData = null;
            container.style.cursor = "default";
        }
        return; 
    }

    // TRƯỜNG HỢP 2: CHỌN ĐỒ ĐỂ SỬA
    // Kiểm tra xem có đang click vào gizmo của transformControls không
    if (transformControls.object && raycaster.intersectObject(transformControls).length > 0) return;

    const intersects = raycaster.intersectObjects(world.children, true);
    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target.parent && target.parent !== world) {
            target = target.parent;
        }
        transformControls.attach(target);
    } else {
        transformControls.detach();
    }
});

window.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
        case "g": transformControls.setMode("translate"); break;
        case "r": transformControls.setMode("rotate"); break;
        case "s": transformControls.setMode("scale"); break;
        case "escape": 
            transformControls.detach(); 
            selectedModelData = null;
            container.style.cursor = "default";
            break;
        case "delete":
        case "backspace":
            if (transformControls.object) {
                world.remove(transformControls.object);
                transformControls.detach();
            }
            break;
    }
});

window.loadModelFromSidebar = function(objUrl, mtlUrl) {
    if(!objUrl || objUrl.includes('None')) return;
    selectedModelData = { obj: objUrl, mtl: mtlUrl };
    container.style.cursor = "crosshair";
    transformControls.detach(); // Bỏ chọn vật thể cũ khi chuẩn bị đặt cái mới
};

/* =====================================================
   7. ANIMATE
===================================================== */
window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}
/* =====================================================
   8. AUTO LOAD TEMPLATE (LOGIC MỚI)
===================================================== */

function initTemplateLoader() {
    const params = new URLSearchParams(window.location.search);
    const templateName = params.get('template'); 

    if (!templateName) return; 

    console.log("Đang khởi tạo mẫu:", templateName);

    const templates = {
        'bedroom': { 
            mtl: '/static/models/bedroom/obj.mtl', 
            obj: '/static/models/bedroom/tinker.obj' 
        },
        'kitchen': { 
            mtl: '/static/models/kitchen/obj.mtl', 
            obj: '/static/models/kitchen/tinker.obj' 
        },
        'livingroom': { 
            mtl: '/static/models/livingroom/obj.mtl', 
            obj: '/static/models/livingroom/tinker.obj' 
        }
    };

    const config = templates[templateName];

    if (config) {
        loadTemplateModel(config.obj, config.mtl);
    } else {
        console.warn("Không tìm thấy cấu hình cho mẫu này:", templateName);
    }
}

function loadTemplateModel(objUrl, mtlUrl) {
    const mtlLoader = new MTLLoader();
    
    mtlLoader.load(mtlUrl, (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load(objUrl, (object) => {
         
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center); 
 
            object.scale.set(0.1, 0.1, 0.1); 

            object.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(object);

            console.log("Đã tải xong Template!");

        }, undefined, (error) => {
            console.error("Lỗi tải OBJ:", error);
        });

    }, undefined, (error) => {
        console.error("Lỗi tải MTL:", error);
    });
}
initTemplateLoader();
animate();