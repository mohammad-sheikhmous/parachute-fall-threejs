import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Cloud from './clouds.js';
import Model from './models.js';
import SkyShader from './sky.js';
import { Physics } from './physics.js';
import { Sound } from './sounds.js';



/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();


/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('dblclick', (event) => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
        if (canvas.requestFullscreen)
            canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen)
            canvas.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
    }
});


/**
 * Lights
 */
// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Light Sun
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
scene.add(directionalLightHelper);
directionalLight.castShadow = true;

// Optimization the light shadow
// directionalLight.shadow.radius = 2;
directionalLight.shadow.mapSize.set(128, 128);
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 2200;
directionalLight.shadow.camera.left = - 1200;
directionalLight.shadow.camera.top = 1200;
directionalLight.shadow.camera.right = 1200;
directionalLight.shadow.camera.bottom = - 1200;


/**
 * SkyShader
 */
const skyShader = new SkyShader(scene, gui, directionalLight, ambientLight);
skyShader.setProperties();

// Helper
const directionalLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(directionalLightShadowHelper);
directionalLight.position.copy(skyShader.sky.material.uniforms['sunPosition'].value.multiplyScalar(1600));
scene.add(directionalLight);

const actions = {
    offset: -1200,
    altitude: 1800,
    depth: 0
};


/**
 * Clouds
 */

// cumulus volumetric (near) and cirrus (far)
const cloudState = {
    time: 0,
    coverage: 0.45,   // 0 => سماء صافية في البداية
    density: 1,
    speed: 0.5,
    lightDir: directionalLight.position.clone().normalize()
};

// Add clouds properties to gui
const cloudFolder = gui.addFolder('Cloud Properties').close();
cloudFolder.add(cloudState, 'coverage', 0, 1, 0.01).name('coverage');
cloudFolder.add(cloudState, 'density', 0.1, 2.0, 0.01).name('density');
cloudFolder.add(cloudState, 'speed', 0, 3, 0.01).name('speed');

const cloud = new Cloud();

// create cumulus layer(volumetric - style using shader planes)
const cumulus = cloud.createVolumetricClouds(scene, cloudState);

// create cirrus layer (distant, slow planes)
const cirrus = cloud.createCirrusLayer(scene, cloudFolder);


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 3000);
camera.position.set(actions.offset - 12, actions.altitude + 8, actions.depth);
camera.lookAt(actions.offset, actions.altitude, actions.depth);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(actions.offset, actions.altitude, actions.depth);
controls.enableDamping = true;
controls.maxDistance = 2000;

let cameraOnFloor = false;
let setCameraOnFloor = null
let setCameraOnAirplane = null

// Two functions to convert between camera's positions.
const object = {
    setCameraOnFloor: function () {
        if (!model.stopParatrooperMotion) {
            cameraOnFloor = true;
            camera.position.set(0, 450, 30);
            camera.lookAt(0, 400, 0);
            controls.target.set(0, 400, 0);

            setCameraOnAirplane = gui.add(object, 'setCameraOnAirplane').name('Set Camera On Airplane')
            setCameraOnFloor.destroy();
        }
    },
    setCameraOnAirplane: function () {
        if (!model.stopParatrooperMotion) {
            cameraOnFloor = false;
            camera.position.set(-12, 8, 0).add(airplane.position);
            camera.lookAt(airplane.position);
            controls.target.copy(airplane.position);

            setCameraOnFloor = gui.add(object, 'setCameraOnFloor').name('Set Camera On Floor');
            setCameraOnAirplane.destroy();
        }
    }
}
setCameraOnFloor = gui.add(object, 'setCameraOnFloor').name('Set Camera On Floor');


/**
 * Sounds
 */
const sound = new Sound(actions, camera, gui, directionalLight);


/**
 * Models
 */
const model = new Model(scene, gui, actions);


/**
 * Floor Model
 */
let floor = null;
model.loadFloor((fl) => {
    floor = fl;
    floor.add(sound.windyInNatureSound);
    floor.add(sound.nightSound);
});


/**
 * Airplane Model
 */
let airplane = null;
model.loadAirplane((ap) => {
    airplane = ap;
    airplane.add(sound.airplaneInsideSound);
    airplane.add(sound.airplaneOutsideSound);
})


/**
 * Paratrooper Model
 */
let paratrooperGroup; // New group for the paratrooper and parachute
let paratrooperMesh;
let mixer;
let animations;

model.loadParatrooper((object) => {
    ({ paratrooperGroup, mixer, animations, paratrooperMesh } = object);
    paratrooperGroup.add(sound.highWindSound);
    paratrooperGroup.add(sound.fallImpactSound);
});


/**
 * Parachute Model
 */

// Add run and openParachute functions from model class to gui.
gui.add(model, 'run').name('Fall').onChange(() => {
    // Create physics object and pass it to model object. 
    model.physics = physics;
});

gui.add({
    openParachute: () => {
        if (!isParachuteOpen && model.stopParatrooperMotion) {
            model.loadParachute((object) => {
                parachuteMesh = object;
            });
            physics?.openParachute();
            isParachuteOpen = true;
        } else {
            alert("Parachute cannot be open else after falling");
        }
    }
}, 'openParachute').name('Open Parachute');


/**
 * Physics
 */
let physics = new Physics(actions);
let isParachuteOpen = false;

const airplanePosition = gui.addFolder("Airplane's Position").close();

// Offset
airplanePosition.add(actions, 'offset', -1000, 1000, 25).name('Offset').onFinishChange(() => {
    if (!model.stopParatrooperMotion) {
        airplane.position.x = actions.offset;
        physics.horizontalPosition = actions.offset;
        paratrooperGroup.position.x = actions.offset;
        camera.position.x = actions.offset - 12;
        camera.lookAt(airplane.position);
        controls.target.x = actions.offset;
        horizontalPositionDisplay.textContent = actions.offset;
    }
});

// Altitude
airplanePosition.add(actions, 'altitude', 100, 3000, 50).name('Altitude').onFinishChange(() => {
    if (!model.stopParatrooperMotion) {
        airplane.position.y = actions.altitude;
        physics.verticalPosition = actions.altitude + 0.44;
        paratrooperGroup.position.y = actions.altitude + 0.44;
        camera.position.y = actions.altitude + 8;
        camera.lookAt(airplane.position);
        verticalPositionDisplay.textContent = actions.altitude;

        controls.target.y = actions.altitude;
    }
});

// Depth
airplanePosition.add(actions, 'depth', -1000, 1000, 25).name('Depth').onFinishChange(() => {
    if (!model.stopParatrooperMotion) {
        airplane.position.z = actions.depth;
        paratrooperGroup.position.z = actions.depth - 0.1;
        physics.zPosition = actions.depth - 0.1;
        camera.position.z = actions.depth;
        camera.lookAt(airplane.position);
        controls.target.z = actions.depth;
        zPosition.textContent = actions.depth;

    }
});

// Rotate paratrooper in freefall.
const paratrooperRotation = gui.addFolder("Paratrooper's Rotation").close();
actions.startRotationX = () => {
    if (model.stopParatrooperMotion && !isParachuteOpen) {
        physics.startRotationX();
    } else {
        alert('Can start rotation on x axis after falling.');
    }
};
paratrooperRotation.add(actions, 'startRotationX').name('Start Rotation X');

actions.startRotationZ = () => {
    if (model.stopParatrooperMotion && !isParachuteOpen) {
        physics.startRotationZ();
    } else {
        alert('Can start rotation on z axis after falling.');
    }
};
paratrooperRotation.add(actions, 'startRotationZ').name('Start Rotation Z');

actions.pullRopes = () => {
    if (physics && isParachuteOpen) {
        physics.pullRopes();
        console.log("Ropes pulled - changing direction");
    } else {
        alert('You can only pull ropes after opening the parachute.');
    }
};
paratrooperRotation.add(actions, 'pullRopes').name('Pull Ropes');


/**
 * Dashboard elements
 */
const verticalVelocityDisplay = document.getElementById('verticalVelocity');
const verticalAccelerationDisplay = document.getElementById('verticalAcceleration');
const verticalPositionDisplay = document.getElementById('verticalPosition');
const verticalAirResestanceDisplay = document.getElementById('verticalAirResestance');

const horizontalVelocityDisplay = document.getElementById('horizontalVelocity');
const horizontalAccelerationDisplay = document.getElementById('horizontalAcceleration');
const horizontalPositionDisplay = document.getElementById('horizontalPosition');
const horizontalAirResestanceDisplay = document.getElementById('horizontalAirResistance');

const zVelocity = document.getElementById('zVelocity');
const zAcceleration = document.getElementById('zAcceleration');
const zPosition = document.getElementById('zPosition');
const zAirResistance = document.getElementById('zAirResistance');

const windZForce = document.getElementById('windZForce');
const windForceDisplay = document.getElementById('windForce');

const WeightDisplay = document.getElementById('weight');
const elapsedTimeDisplay = document.getElementById('elapsedTime');

// Angular motion displays
const angularVelocityX = document.getElementById('angularVelocityX')
const angularVelocityY = document.getElementById('angularVelocityY')
const angularVelocityZ = document.getElementById('angularVelocityZ')
const angularAccelerationX = document.getElementById('angularAccelerationX')
const angularAccelerationY = document.getElementById('angularAccelerationY')
const angularAccelerationZ = document.getElementById('angularAccelerationZ')

verticalPositionDisplay.textContent = actions.altitude;
horizontalPositionDisplay.textContent = actions.offset;
zPosition.textContent = actions.depth;

// Add event listeners for sliders
actions.g = physics.g;
actions.mass = physics.mass;
actions.windX = physics.windXVelocity;
actions.windZ = physics.windZVelocity;
actions.parachuteArea = physics.paraFullArea;
actions.rotationForce = physics.rotationForce;
actions.distance = physics.d;
actions.angleBetween = physics.angleBetween; // Angle between Rotation Force Vector and Moment of Inertia Vector.

const windGui = gui.addFolder('Wind Velocity').close();
windGui.add(actions, 'windX', -50, 50, 1).name('X').onFinishChange((value) => {
    if (physics) {
        physics.windXVelocity = value;
        physics.windXForce = physics.calculatewindXForce();
    }
});

windGui.add(actions, 'windZ', -50, 50, 1).name('Z').onFinishChange((value) => {
    if (physics) {
        physics.windZVelocity = value;
        physics.windZForce = physics.calculatewindZForce();
    }
});

gui.add(actions, 'g', 0, 15, 0.1).name('Gravity').onFinishChange((value) => {
    if (physics) {
        physics.g = value;
        physics.weight = physics.calculateWeight();
    }
});

gui.add(actions, 'mass', 20, 150, 5).name('Mass').onFinishChange((value) => {
    if (physics) {
        physics.mass = value;
        physics.weight = physics.calculateWeight();
    }
});

gui.add(actions, 'parachuteArea', 5, 50, 1).name('Parachute Area').onFinishChange((value) => {
    if (isParachuteOpen) {
        physics.parachuteArea = value;
    } else {
        physics.paraFullArea = value;
    }
});

paratrooperRotation.add(actions, 'rotationForce', 0, 20, 1).name('Rotation Force').onFinishChange((value) => {
    if (!physics.isRotating && !physics.isRopePulling) {
        physics.rotationForce = value;
        console.log('force is' + physics.rotationForce)
    } else {
        alert('You cannot change the rotation force while the body is rotating.');
    }
});

paratrooperRotation.add(actions, 'distance', 0, 50, 1).name('Distance I').onFinishChange((value) => {
    //will be changed only when parachute is opened
    if (isParachuteOpen)
        physics.d = value;
    else {
        alert('You can only change the distance after opening the parachute.');
    }
});

paratrooperRotation.add(actions, 'angleBetween', 0, 360, 10).name('Ang Between F and I').onFinishChange((value) => {
    physics.angleBetween = value;
});


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


// Collision Coffecients
const coeffsObject = {
    e: 0.5, // ground restitution coefficient
    mu: 0.5, // ground friction coefficient
    safeThreshold: 5,
    crashThreshold: 12
}

const collisionProperties = gui.addFolder('Collision Properties').close();
// Add coeffs to gui.
collisionProperties.add(coeffsObject, 'e', 0.1, 1, 0.1).name('Ground Restitution Coeff');
collisionProperties.add(coeffsObject, 'mu', 0.1, 1, 0.1).name('Ground Friction Coeff');

// Add thresholds to gui.
collisionProperties.add(coeffsObject, 'safeThreshold', 1, 20, 1).name('Safe Coll Vel Threshold');
collisionProperties.add(coeffsObject, 'crashThreshold', 1, 20, 1).name('Crash Coll Vel Threshold');

// Key Points on paratrooper's body.
const keyPoints = {
    head: new THREE.Vector3(0, 1, 0),
    leftHand: new THREE.Vector3(-0.2, 0.8, 0),
    rightHand: new THREE.Vector3(0.2, 0.8, 0),
    leftFoot: new THREE.Vector3(-0.1, 0, 0),
    rightFoot: new THREE.Vector3(0.1, 0, 0),
    back: new THREE.Vector3(0, 0.6, -0.1),
    front: new THREE.Vector3(0, 0.6, 0.1),
};

// Send a Raycast to each key point
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

// These variables to know when the paratrooper collide ground.
let stopSimulation = false;
let miraculouslySurvived = false;

function updateParatrooperPhysically(dt) {
    let closestHit = null;
    let minDistance = Infinity;
    let hits = [];

    for (let key in keyPoints) {
        const localPoint = keyPoints[key].clone();

        // Convert point from local to world.
        const worldPoint = paratrooperGroup.localToWorld(localPoint);

        raycaster.set(worldPoint, down);
        const intersects = raycaster.intersectObjects([floor.children[0]], true);

        if (intersects.length > 0) {
            hits.push(intersects[0].point);

            const hit = intersects[0];
            if (hit.distance < minDistance) {
                minDistance = hit.distance;
                closestHit = hit;
            }
        }
    }

    // Ground collision and Adjust paratrooper height and stop falling.
    if (closestHit && (paratrooperGroup.position.y - closestHit.point.y <= 1)) {

        // Restore the original position if parachute not open because it has been rotated in blender. 
        if (!isParachuteOpen)
            paratrooperMesh.rotation.y = Math.PI / 2;

        let vy = physics.verticalVelocity;

        sound.highWindSound.stop();

        // Safe Landing
        if (Math.abs(vy) < coeffsObject.safeThreshold) {
            paratrooperGroup.position.y = closestHit.point.y;
            physics.verticalVelocity = 0;
            physics.horizontalVelocity = 0;
            physics.zVelocity = 0;

            stopSimulation = true;

            // Show message after landing.
            if (miraculouslySurvived)
                Swal.fire({
                    title: "Hard Landing",
                    text: "The parachutist miraculously survived.",
                    icon: "warning",
                    showConfirmButton: false,
                    timer: 5000,
                });
            else
                Swal.fire({
                    title: "Successfull Landing",
                    text: "The parachutist landed successfully.",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 5000,
                });
        }
        // Medium Impact
        else if (Math.abs(vy) < coeffsObject.crashThreshold) {

            physics.verticalVelocity = -physics.verticalVelocity * coeffsObject.e; // restitution bounce
            physics.horizontalVelocity *= (1 - coeffsObject.mu * dt);
            physics.zVelocity *= (1 - coeffsObject.mu * dt);

            miraculouslySurvived = true;
        }
        // Crash Landing
        else {

            paratrooperGroup.position.y = closestHit.point.y + 0;
            physics.verticalVelocity = 0;
            physics.horizontalVelocity = 0;
            physics.zVelocity = 0;

            // Stop the falling motion to simulate the death motion.
            animations[5].clampWhenFinished = true;
            animations[5].loop = THREE.LoopOnce;
            animations[5].repetitions = 1
            animations[6].clampWhenFinished = true;
            animations[6].loop = THREE.LoopOnce;
            animations[6].repetitions = 1;

            stopSimulation = true;

            sound.fallImpactSound.play();

            Swal.fire({
                title: "Died",
                text: "The parachutist died due to the high landing speed.",
                icon: "error",
                showConfirmButton: false,
                timer: 5000,
            });
        }

        // Adjust the paratrooper's quaternion based on the three nearest points on the ground.
        hits.sort((a, b) => a.y - b.y);
        if (hits.length >= 3) {
            const p1 = hits[0];
            const p2 = hits[1];
            const p3 = hits[2];

            const v1 = new THREE.Vector3().subVectors(p2, p1);
            const v2 = new THREE.Vector3().subVectors(p3, p1);
            const normal = new THREE.Vector3().multiplyVectors(v1, v2).normalize();

            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                normal
            );
            paratrooperGroup.quaternion.copy(quaternion);;
        }
    }

    // Update the physics properties from the Parachutist class
    physics.updatePhysicsProperties(dt);

    if (!isParachuteOpen) {

        if (physics.torqueX !== 0) paratrooperGroup.rotation.x = physics.thetaX;
        if (physics.torqueY !== 0) paratrooperGroup.rotation.y = physics.thetaY;
        if (physics.torqueZ !== 0) paratrooperGroup.rotation.z = physics.thetaZ;

    } else {
        // Parachute is open - apply rope pulling rotation
        if (physics.isRopePulling || Math.abs(physics.omegaY) > 0.01) {
            paratrooperGroup.rotation.y = physics.thetaY;
        }
        else {
            if (!miraculouslySurvived && !stopSimulation) {
                paratrooperGroup.rotation.x = 0;
                paratrooperGroup.rotation.y = 0;
                paratrooperGroup.rotation.z = 0;
            }
        }
    }

    // Update the group's vertical position based on the calculated physics
    paratrooperGroup.position.y = physics.verticalPosition;
    paratrooperGroup.position.x = physics.horizontalPosition;
    paratrooperGroup.position.z = physics.zPosition;

    /**
     * Update Dashboard Values
     */
    verticalVelocityDisplay.textContent = physics.verticalVelocity.toFixed(2);
    horizontalVelocityDisplay.textContent = physics.horizontalVelocity.toFixed(2);
    zVelocity.textContent = physics.zVelocity.toFixed(2);

    verticalAccelerationDisplay.textContent = physics.verticalAcceleration.toFixed(5);
    horizontalAccelerationDisplay.textContent = physics.horizontalAcceleration.toFixed(5);
    zAcceleration.textContent = physics.zAcceleration.toFixed(2);

    verticalPositionDisplay.textContent = physics.verticalPosition.toFixed(2);
    horizontalPositionDisplay.textContent = physics.horizontalPosition.toFixed(2);
    zPosition.textContent = physics.zPosition.toFixed(2);

    verticalAirResestanceDisplay.textContent = physics.verticalAirResistance?.toFixed(2);
    horizontalAirResestanceDisplay.textContent = physics.horizontalAirResistance.toFixed(2);
    zAirResistance.textContent = physics.zAcceleration.toFixed(2);

    windForceDisplay.textContent = physics.windXForce.toFixed(2);
    windZForce.textContent = physics.windZForce.toFixed(2);

    WeightDisplay.textContent = physics.weight.toFixed(2);
    elapsedTimeDisplay.textContent = physics?.elapsedTimeInSeconds;

    // Update angular motion displays
    angularVelocityX.textContent = physics.omegaX.toFixed(3);
    angularVelocityY.textContent = physics.omegaY.toFixed(3);
    angularVelocityZ.textContent = physics.omegaZ.toFixed(3);
    angularAccelerationX.textContent = physics.alphaX.toFixed(3);
    angularAccelerationY.textContent = physics.alphaY.toFixed(3);
    angularAccelerationZ.textContent = physics.alphaZ.toFixed(3);

    // Update current time display
    const timeInSeconds = physics.elapsedTime;
}

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

let boolVal1 = true;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    const dt = 0.016; // fixed-step friendly
    cloudState.time += dt * cloudState.speed;

    skyShader.updateSun();

    controls.update();
    // update cumulus
    cumulus.update(cloudState);

    // update cirrus if needed
    cirrus.update(cloudState);

    if (mixer) {
        mixer.update(deltaTime);
    }

    // Update night and day sounds
    if (actions.isPlaying) {
        if (directionalLight.intensity < 0.2) {
            !sound.nightSound.isPlaying ? sound.nightSound.play() : null;
            sound.windyInNatureSound.stop();
        }
        else {
            !sound.windyInNatureSound.isPlaying ? sound.windyInNatureSound.play() : null;
            sound.nightSound.stop();
        }
    }

    if (airplane) {
        // Some motions on models.
        updateAirplaneComponentsMotion();
        updateParatrooperMotion(deltaTime);

        // Update airplane sounds.
        sound.updateAudio(sound.airplaneOutsideSound, 3, 20, 0.7, airplane);

        // Update high wind sound and camera's position.
        if (!model.stopParatrooperMotion) {
            sound.updateAudio(sound.highWindSound, 5, 150, 1.5, paratrooperGroup);

            // Update the camera and orbit controls before falling if they are not on floor.
            if (!cameraOnFloor) {
                camera.position.x = camera.position.x + 0.3;
                controls.target.copy(airplane.position);
            }
        }
        else {
            sound.updateAudio(sound.highWindSound, 1, 150, 1.5, paratrooperGroup);

            // Update the camera after falling if they are not on floor.
            // if (!cameraOnFloor) {
            if (!stopSimulation) {
                camera.position.y = paratrooperGroup.position.y;
                controls.target.copy(paratrooperGroup.position);
            }
            // }
        }
    }

    // Render
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick();


/**
 * Functions
 */
function updateAirplaneComponentsMotion() {

    airplane.position.x = 0.3 + airplane.position.x;

    airplane.children[0].children[0].children[144].children[0].rotation.x += -0.5;
    airplane.children[0].children[0].children[145].children[0].rotation.x += -0.5;
    airplane.children[0].children[0].children[148].children[0].rotation.x += -0.5;
    airplane.children[0].children[0].children[150].children[0].rotation.x += -0.5;

    if (airplane.children[0].children[0].children[97].children[0].rotation.z > -1.7)
        airplane.children[0].children[0].children[97].children[0].rotation.z += -0.005;
    else if (airplane.children[0].children[0].children[95].children[0].rotation.z > -1.7)
        airplane.children[0].children[0].children[95].children[0].rotation.z += -0.005;

    if (airplane.children[0].children[0].children[0].children[0].rotation.x < 0.6) {
        airplane.children[0].children[0].children[0].children[0].rotation.x += 0.001;
        airplane.children[0].children[0].children[36].children[0].rotation.x -= 0.001;
    }

    if (airplane.children[0].children[0].children[10].children[0].position.y < 0.8) {

        airplane.children[0].children[0].children[10].children[0].position.y += 0.0025;
        airplane.children[0].children[0].children[11].children[0].position.y += 0.0025;

        airplane.children[0].children[0].children[45].children[0].position.y += 0.0025;
        airplane.children[0].children[0].children[46].children[0].position.y += 0.0025;
    }

    if (airplane.children[0].children[0].children[162].children[0].position.y < 1.2) {
        airplane.children[0].children[0].children[162].children[0].position.y += 0.002;
        airplane.children[0].children[0].children[163].children[0].position.y += 0.002;
        airplane.children[0].children[0].children[164].children[0].position.y += 0.002;
    }

    if (airplane.children[0].children[0].children[156].children[0].position.x > -8.3540) {
        airplane.children[0].children[0].children[156].children[0].position.x -= 0.0014;
    } else if (airplane.children[0].children[0].children[156].children[0].position.y < 0.0625) {
        airplane.children[0].children[0].children[156].children[0].position.y += 0.001;
    }

    if (boolVal1 && airplane.children[0].children[0].children[51].children[0].rotation.z < 0.6) {
        airplane.children[0].children[0].children[51].children[0].rotation.z += 0.001;
        airplane.children[0].children[0].children[53].children[0].rotation.z += 0.001;
        airplane.children[0].children[0].children[59].children[0].rotation.z += 0.001;
        airplane.children[0].children[0].children[116].children[0].rotation.z += 0.001;
    } else if (airplane.children[0].children[0].children[51].children[0].rotation.z > 0.2) {
        boolVal1 = false;
        airplane.children[0].children[0].children[51].children[0].rotation.z -= 0.0007;
        airplane.children[0].children[0].children[53].children[0].rotation.z -= 0.0007;
        airplane.children[0].children[0].children[59].children[0].rotation.z -= 0.0007;
        airplane.children[0].children[0].children[116].children[0].rotation.z -= 0.0007;
    } else {
        boolVal1 = true;
    }
}

function updateParatrooperMotion(dt) {

    if (!model.stopParatrooperMotion) {
        // Update the paratrooper before falling.
        horizontalPositionDisplay.textContent = airplane.position.x.toFixed(2);
        paratrooperGroup.position.x = 0.3 + paratrooperGroup.position.x;

    } else {
        // Update the paratrooper after falling
        if (!stopSimulation) {
            updateParatrooperPhysically(dt);
        }
    }
}

