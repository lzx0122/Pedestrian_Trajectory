import * as THREE from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { color, temp } from "three/tsl";

let text = document.querySelector("#text");
let makerTemps = [];
// 初始化場景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  100,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 加入燈光
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// 建立格子地板
const gridSize = 20;
const gridDivisions = 20;
const gridHelper = new THREE.GridHelper(
  gridSize,
  gridDivisions,
  0x888888,
  0x444444
);
//gridHelper.rotation.x = Math.PI / 2; // YZ 平面 → XY 平面
scene.add(gridHelper);

// 設定相機

let cameraMode = "FPP"
//俯瞰
// camera.position.set(3, 5, -1);
// camera.rotateY(Math.PI / -2);
// camera.rotateX(-90 * (Math.PI / 180)); // 20 度角度轉弧度
//第一人視角
camera.position.set(-3, 1, -1);
camera.rotateY(Math.PI / -2);
camera.rotateX(-20 * (Math.PI / 180)); // 20 度角度轉弧度
//camera.lookAt(0, 0, 0);


// 建立地面參考格線（每個整數格子）
for (let x = -10; x <= 10; x++) {
  for (let z = -10; z <= 10; z++) {
    const boxGeo = new THREE.BoxGeometry(0.95, 0.01, 0.95);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
    const tile = new THREE.Mesh(boxGeo, boxMat);
    tile.position.set(x, 0, z);
    scene.add(tile);
  }
}

// 模擬的座標資料
const ped = {
  name: "行人1",
  color: 0x00ff00,
  steps: [
    { x: -3, z: 1 },
    { x: -2, z: 1 },
    { x: -1, z: 1 },
    { x: 0, z: 1 },
    { x: 1, z: 1 },
    { x: 2, z: 1 },
    { x: 2, z: 0 },
    { x: 2, z: -1 },
    { x: 2, z: -2 },
    { x: 2, z: -3 },
    { x: 2, z: -4 },
    { x: 2, z: -5 },
  ], collistionScope: { length: 1, width: 1 }

};

const car = {
  name: "車",
  color: 0x007bff,
  steps: [
    { x: -3, z: -1 },
    { x: -2.9, z: -1 },
    { x: -2.5, z: -1 },
    { x: -2.2, z: -1 },
    { x: -1, z: -1 },
    { x: 0, z: -1 },
    { x: 1, z: -1 },
    { x: 2, z: -1 },
    { x: 3, z: -1 },
    { x: 4, z: -1 },
    { x: 5, z: -1 },
    { x: 6, z: -1 },
  ], collistionScope: { length: 4, width: 3 },
};


function setFPP() {
  camera.rotation.set(0, 0, 0);
  camera.position.set(-3, 1, -1);
  camera.rotateY(Math.PI / -2);
  camera.rotateX(-20 * (Math.PI / 180));
}

function setTPP() {
  camera.rotation.set(0, 0, 0);
  camera.position.set(0, 10, 0);
  camera.rotateY(Math.PI / -2);
  camera.rotateX(-90 * (Math.PI / 180));
}

//畫線
function drawLine(point1, point2, color = 0x178bfd) {
  let extension = 0.3; // 延長線段的長度
  const distance = new THREE.Vector2(point1.x, point1.z).distanceTo(new THREE.Vector2(point2.x, point2.z));
  // 計算方向向量
  const direction = new THREE.Vector2(point2.x - point1.x, point2.z - point1.z).normalize();

  // 延長線段兩端
  const extendedPoint1 = new THREE.Vector3(
    point1.x - direction.x * extension,
    point1.y,
    point1.z - direction.y * extension
  );

  const extendedPoint2 = new THREE.Vector3(
    point2.x + direction.x * extension,
    point2.y,
    point2.z + direction.y * extension
  );

  const extendedDistance = distance + extension * 2;

  // 創建扁平的幾何體
  const geometry = new THREE.PlaneGeometry(0.7, extendedDistance);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });

  const route = new THREE.Mesh(geometry, material);

  // 計算中心點
  const center = new THREE.Vector3(
    (extendedPoint1.x + extendedPoint2.x) / 2,
    0.03,
    (extendedPoint1.z + extendedPoint2.z) / 2
  );
  route.position.copy(center);

  // 計算旋轉角度
  const angle = Math.atan2(point2.x - point1.x, point2.z - point1.z);
  route.rotation.x = -Math.PI / 2;
  route.rotation.z = angle;
  point2.line = route; // 將線段與點關聯

  scene.add(route);
  makerTemps.push(route)
  return route;
}

// 動態顯示座標點
function showTrajectory(obj, step, color = 0x00ff00) {
  if (step > 0)
    drawLine(obj.steps[step - 1], obj.steps[step], color);
  let point = obj.steps[step];
  const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color, opacity: 0.5, transparent: true });
  const marker = new THREE.Mesh(sphereGeo, sphereMat);
  marker.position.set(point.x, -0.1, point.z);
  marker.obj = obj
  scene.add(marker);
  makerTemps.push(marker)
  return marker;
}

//設置碰撞點
function setPoint(tempPoints, maker, step) {
  let point1 = { x: maker.position.x - ((maker.obj.collistionScope.length - 1) / 2), z: maker.position.z - ((maker.obj.collistionScope.width - 1) / 2) };
  let point2 = { x: maker.position.x + ((maker.obj.collistionScope.length - 1) / 2), z: maker.position.z + ((maker.obj.collistionScope.width - 1) / 2) };

  if (maker.obj.name === "車") {
    tempPoints.set(step, { carObj: { maker, collistionScopePoint: { point1, point2 } }, pedObjs: [] });
  } else {

    let carCollistionScopePoint = tempPoints.get(step).carObj.collistionScopePoint;
    // 檢查行人是否在車輛的碰撞範圍內
    if (
      point1.x <= carCollistionScopePoint.point2.x &&
      point2.x >= carCollistionScopePoint.point1.x &&
      point1.z <= carCollistionScopePoint.point2.z &&
      point2.z >= carCollistionScopePoint.point1.z
    ) {
      tempPoints.get(step).pedObjs.push({ maker, collistionScopePoint: { point1, point2 } });
    }
  }

  // if (!tempPoints.get(`${maker.position.x},${maker.position.z}`)) {
  //   tempPoints.get(`${maker.position.x},${maker.position.z}`).push(maker);
  // } else {
  //   tempPoints.set(`${maker.position.x},${maker.position.z}`, [maker]);
  // }
}

//預先顯示車輛和行人的軌跡

async function preShowTrajectory() {
  let tempPoints = new Map();
  for (let step = 0; step < car.steps.length; step++) {
    let makerTemp = showTrajectory(car, step, car.color); // 開始顯示車輛軌跡
    car.steps[step].maker = makerTemp; // 將車輛的步數與顯示的物件關聯
    setPoint(tempPoints, makerTemp, step);
  }
  let isCollision = false;
  for (let step = 0; step < car.steps.length; step++) {

    let makerTemp = showTrajectory(ped, step, ped.color); // 開始顯示
    ped.steps[step].maker = makerTemp; // 將行人的步數與顯示的物件關聯
    setPoint(tempPoints, makerTemp, step);
    if (isCollision) continue;
    // 檢查是否有碰撞
    for (let [key, value] of tempPoints) {

      if (value.pedObjs.length >= 1) {
        let str = `(${step + 1}秒後)碰撞物體: `;

        text.innerHTML = str + value.pedObjs.map((v) => v.maker.obj.name).join(", ");
        value.pedObjs.forEach((v) => v.maker.material.color.set(0xff0000)) // 將行人設定紅色(行人碰撞點)
        //創建紅色碰撞區
        let carMaker = value.carObj.maker;
        carMaker.material.color.set(0x000000); // 將車輛顏色改為紅色
        const boxGeo = new THREE.BoxGeometry(carMaker.obj.collistionScope.length, 0.02, carMaker.obj.collistionScope.width);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
        const box = new THREE.Mesh(boxGeo, boxMat);
        let carPosition = carMaker.obj.steps[step];
        box.position.set(carPosition.x, 0, carPosition.z);
        box.name = "collisionBox";
        scene.add(box);
        makerTemps.push(box)
        isCollision = true;
        break;
      }
    }

    //await new Promise((resolve) => setTimeout(resolve, 1000)); // 每點延遲 1 秒
  }

}

preShowTrajectory();



async function play(car, peds, model = "FPP") {
  if (model == "FPP") {
    setFPP();
  } else {
    setTPP();
  }

  for (let step = 0; step < car.steps.length; step++) {
    let carStep = car.steps[step];
    carStep.maker.material.opacity = 1; // 設置車輛透明度
    if (step > 0) {
      carStep.line.material.opacity = 1; // 設置車輛軌跡透明度
    }

    if (model == "FPP") {
      camera.position.set(carStep.x, 1, carStep.z); // 更新視角
    }

    peds.forEach(ped => {
      let pedStep = ped.steps[step];
      pedStep.maker.material.opacity = 1; // 重置行人透明度
      if (step > 0) {
        pedStep.line.material.opacity = 1; // 設置行人軌跡透明度
      }

    });
    document.querySelector("#step").innerHTML = step + 1;
    // 等待 1 秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

  }
}



// 動畫渲染
function animate() {
  requestAnimationFrame(animate);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

animate();

function clearMaker() {

  makerTemps.forEach((maker) => {
    scene.remove(maker);

  })
  if (cameraMode.toLocaleUpperCase() == "FPP") {
    setFPP();
  } else {
    setTPP();
  }

}



//事件監聽

//更改視角
document.querySelector("#perspective").addEventListener("change", (e) => {
  camera.rotation.set(0, 0, 0);
  if (!e.target.checked) {
    cameraMode = "FPP"
    setFPP();

  } else {
    cameraMode = "TPP"
    setTPP();
  }
});

//重新運行
document.querySelector("#restart").addEventListener("click", () => {
  clearMaker()
  preShowTrajectory()
})

//開始播放
document.querySelector("#start").addEventListener("click", () => {
  play(car, [ped], cameraMode.toLocaleUpperCase());
});
