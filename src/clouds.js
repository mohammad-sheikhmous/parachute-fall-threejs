import cloudVertex from './shaders/clouds.vert?raw';
import cloudFragment from './shaders/clouds.frag?raw';
import * as THREE from 'three';
import { randFloat } from 'three/src/math/MathUtils.js';

class Cloud {
    createVolumetricClouds(scene, state) {
        // A group of semi-3D plane layers at different heights and scales
        const group = new THREE.Group();
        scene.add(group);

        const loader = new THREE.TextureLoader();
        // You can replace this with your own seamless noise texture
        const noiseTex = loader.load(`${import.meta.env.BASE_URL}textures/assets/noise.png`);
        noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;

        const planeCount = 20;
        const planes = [];

        for (let i = 0; i < planeCount; i++) {
            const size = 80 + i * 10;
            const geo = new THREE.PlaneGeometry(size, size, 1, 1);
            const mat = new THREE.ShaderMaterial({
                vertexShader: cloudVertex,
                fragmentShader: cloudFragment,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
                uniforms: {
                    uTime: { value: state.time },
                    uNoise: { value: noiseTex },
                    uCoverage: { value: state.coverage },
                    uDensity: { value: state.density },
                    uLightDir: { value: state.lightDir },
                    uOffset: { value: new THREE.Vector2(Math.random() * 10, Math.random() * 10) }
                }
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 110 + i * 3;
            mesh.renderOrder = i;
            mesh.material.side = THREE.DoubleSide
            group.add(mesh);
            planes.push(mesh);
        }

        return {
            group,
            update: (s) => {
                planes.forEach((p, idx) => {
                    p.material.uniforms.uTime.value = s.time;
                    p.material.uniforms.uCoverage.value = s.coverage;
                    p.material.uniforms.uDensity.value = s.density;
                    // parallax / drift
                    p.position.x += Math.sin(s.time * 0.02 + idx) * 0.2;
                    p.position.z += Math.cos(s.time * 0.015 + idx * 0.5) * 0.2;
                    p.material.uniforms.uOffset.value.set(p.position.x * 0.001, p.position.z * 0.001);
                });
            }
        };
    }

    createCirrusLayer(scene, cloudFolder) {
        const group = new THREE.Group();
        scene.add(group);

        const loader = new THREE.TextureLoader();
        const cirrusTex = loader.load(`${import.meta.env.BASE_URL}textures/assets/cirrus.png`);
        cirrusTex.wrapS = cirrusTex.wrapT = THREE.RepeatWrapping;
        cirrusTex.anisotropy = 26;
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({
            map: cirrusTex,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            // blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });

        cloudFolder.add(mat, 'opacity').min(0).max(1).step(0.01).name('Cloud Opacity');
        const mesh = new THREE.Mesh(geo, mat);
        const cloudScale = cloudFolder.addFolder('Cloud Scale');
        cloudScale.add(mesh.scale, 'x').min(1).max(10).step(0.1);
        cloudScale.add(mesh.scale, 'y').min(1).max(10).step(0.1);
        mesh.rotation.x = -Math.PI / 2;
        mesh.castShadow = true;

        for (let index = 0; index < 175; index++) {
            const newMesh = mesh.clone();
            const rand = Math.random() * 300;
            newMesh.scale.set(rand, rand, 1.2);
            const x = (Math.random() - 0.5) * (1500 - rand);
            const z = (Math.random() - 0.5) * (1300 - rand) + 75;
            newMesh.position.set(x, randFloat(0.97, 1) * 1200, z);
            newMesh.rotation.z = Math.random() * Math.PI;
            group.position.x = -500;
            group.position.z = 100;
            group.add(newMesh);
        }
        return {
            group,
            mat,
            update: (s) => {
                group.position.x += s.speed * 0.25;
                group.position.z -= s.speed * 0.175;
            }
        };
    }
}
export default Cloud;