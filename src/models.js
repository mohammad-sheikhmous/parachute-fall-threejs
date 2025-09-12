import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

// اربط التسريع بالـ BufferGeometry
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();

const animations = [];
const paratrooperGroup = new THREE.Group();
let paratrooperMesh = null
let mixer = null;

let parachuteMesh;

class Model {
    scene;
    gui;
    stopParatrooperMotion = false; // This property defined for knowing when paratrooper motion on airplane stops.
    paratrooperPosition;
    physics;
    paratrooperFalled = false;

    constructor(scene, gui, paratrooperPosition) {
        this.scene = scene;
        this.gui = gui;
        this.paratrooperPosition = paratrooperPosition;
    }

    loadFloor(onLoad) {
        gltfLoader.load(
            `${import.meta.env.BASE_URL}models/floor/floor1.glb`,
            (floor) => {
                const floor2 = floor.scene.children[0];
                const floor3 = floor.scene.clone();

                // Set alpha texture on floor for looking like gradient circule
                const alpha = textureLoader.load(`${import.meta.env.BASE_URL}textures/alpha.jpg`);
                floor2.material.transparent = true;
                floor2.material.alphaMap = alpha;

                while (floor.scene.children.length) {
                    if (floor.scene.children[0].isMesh) {
                        floor.scene.children[0].geometry.computeBoundsTree(); // يبني BVH
                        // floor.scene.children[0].material.wireframe = false;
                    }

                    floor.scene.children[0].receiveShadow = true;
                    this.scene.add(floor.scene.children[0]);
                }

                if (onLoad) onLoad(floor3); // Return airplane through callback.
            }
        );
    }

    loadAirplane(onLoad) {
        let airplane;

        gltfLoader.load(
            `${import.meta.env.BASE_URL}models/airplanes/hercules.glb`,
            (gltf) => {
                airplane = gltf.scene.children[0];
                gltf.scene.children[0].position.set(this.paratrooperPosition.offset, this.paratrooperPosition.altitude, this.paratrooperPosition.depth);
                gltf.scene.children[0].rotation.z = Math.PI / 2;
                gltf.scene.children[0].scale.setScalar(0.6);
                this.scene.add(gltf.scene.children[0]);

                if (onLoad) onLoad(airplane); // Return airplane through callback.
            }
        );
    }

    loadParatrooper(onLoad) {
        gltfLoader.load(
            `${import.meta.env.BASE_URL}models/paratrooper/paratrooper.glb`,
            (gltf) => {
                mixer = new THREE.AnimationMixer(gltf.scene);
                const talkingAction = mixer.clipAction(gltf.animations[7]);

                // 1- Talking motion
                animations[0] = mixer.clipAction(gltf.animations[7]);

                // 2- Stand motion
                animations[1] = mixer.clipAction(gltf.animations[6]);
                animations[1].clampWhenFinished = true;
                animations[1].loop = THREE.LoopOnce;
                animations[1].repetitions = 1

                // 3- Right Turn motion
                animations[2] = mixer.clipAction(gltf.animations[5]);
                animations[2].clampWhenFinished = true;
                animations[2].loop = THREE.LoopOnce;
                animations[2].repetitions = 1

                // 4- Walking motion
                animations[3] = mixer.clipAction(gltf.animations[8]);
                animations[3].clampWhenFinished = true;
                animations[3].loop = THREE.LoopOnce;
                animations[3].repetitions = 1

                // 5- Jump motion
                animations[4] = mixer.clipAction(gltf.animations[3]);
                animations[4].clampWhenFinished = true;
                animations[4].loop = THREE.LoopOnce;
                animations[4].repetitions = 1;

                // 6- Falling motion 
                animations[5] = mixer.clipAction(gltf.animations[2]);

                // 7- Parachute motion
                animations[6] = mixer.clipAction(gltf.animations[4]);

                talkingAction.play();

                paratrooperMesh = gltf.scene.children[0];
                paratrooperGroup.add(paratrooperMesh);
                paratrooperGroup.position.set(
                    this.paratrooperPosition.offset,
                    this.paratrooperPosition.altitude + 0.44,
                    this.paratrooperPosition.depth - 0.2
                );
                paratrooperMesh.scale.setScalar(0.006);
                paratrooperMesh.position.set(0, -0.155, 0);
                this.scene.add(paratrooperGroup);

                if (onLoad) onLoad({ paratrooperGroup, mixer, animations, paratrooperMesh });
            }
        );
    }

    loadParachute(onLoad) {
        gltfLoader.load(
            `${import.meta.env.BASE_URL}models/parachute/openedParachute.gltf`,
            (gltf) => {
                // Coordinate the parachute mesh and add it to the scene.
                parachuteMesh = gltf.scene;
                parachuteMesh.position.set(0, 3.24, 0);
                parachuteMesh.rotation.set(0, Math.PI, 0);
                parachuteMesh.scale.setScalar(0.2);
                paratrooperGroup.add(parachuteMesh);

                paratrooperMesh.position.set(0, 0.32, 0);
                // paratrooperMesh.rotation.y = 0;

                // Stop Falling Animation
                animations[5].fadeOut(0.5);

                // Play The Parachute Falling Animation.
                animations[6].reset().fadeIn(0.5).play();
                // paratrooperMesh.rotation.x += Math.PI / 2

                if (onLoad) onLoad(parachuteMesh);
            }
        );
    }

    // This function is for sequencing animations. 
    playNext(index) {
        if (index >= animations.length - 1) return false;

        // Stop previous motion
        animations[index - 1].fadeOut(0.5);

        // Play the next motion.
        animations[index].reset().fadeIn(0.5).play();

        if (index == 5) {
            this.stopParatrooperMotion = true; // This is a flag for the tick function to handle the freefall 

            this.physics.horizontalPosition = paratrooperGroup.position.x;

            // Update the whole paratrooper group's position
            paratrooperGroup.position.y = this.physics.verticalPosition;
            paratrooperGroup.position.z = this.physics.zPosition
        }
        const duration = animations[index].getClip().duration * 1000;

        // When the motion is finished, we will play the next motion. 
        setTimeout(() => {
            this.playNext(index + 1);
        }, duration);
    }

    run() {
        if (!this.paratrooperFalled) {
            this.playNext(1);
            this.paratrooperFalled = true;
        }
    }
}

export default Model;