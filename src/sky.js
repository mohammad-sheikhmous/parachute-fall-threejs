import { Sky } from 'three/addons/objects/Sky.js';
import * as THREE from 'three';

class SkyShader {
    gui;
    scene;
    params;
    sky = new Sky();
    skyUniforms = this.sky.material.uniforms;
    // Sun
    sun = new THREE.Vector3();
    clock = new THREE.Clock();
    directionalLight;
    ambientLight;

    constructor(scene, gui, directionalLight, ambientLight) {
        this.gui = gui;
        this.scene = scene;
        this.directionalLight = directionalLight
        this.ambientLight = ambientLight;
    }

    setProperties() {
        this.sky.scale.set(2800, 2000, 2300);
        this.sky.position.y = 1000;
        this.scene.add(this.sky);

        // Sun properties

        this.skyUniforms['turbidity'].value = 10;
        this.skyUniforms['rayleigh'].value = 2;
        this.skyUniforms['mieCoefficient'].value = 0.3;
        this.skyUniforms['mieDirectionalG'].value = 0.999;
        // this.skyUniforms['sunPosition'].value.set(-0.5, 0.638, 0.95);

        // GUI
        // Parameters for GUI
        this.params = {
            realTime: true,       // Start synced with system time
            timeOfDay: 12,        // Current hour (0-24) if not real-time
            sunSpeed: 0.1,        // Speed multiplier when animating sun
            elevation: 10,        // Manual sun elevation
            azimuth: 180          // Manual sun azimuth (compass direction)
        };
        const sunFolder = this.gui.addFolder('Sun Properties').close();
        sunFolder.add(this.params, 'realTime').name('Use Real Time');
        sunFolder.add(this.params, 'timeOfDay', 0, 24, 0.1).name('Time of Day (hrs)');
        sunFolder.add(this.params, 'sunSpeed', 0, 20, 0.1).name('Sun Speed');
        sunFolder.add(this.params, 'elevation', 0, 90, 0.1).name('Sun Elevation');
        sunFolder.add(this.params, 'azimuth', -180, 180, 0.1).name('Sun Azimuth');
        sunFolder.add(this.skyUniforms['turbidity'], 'value', 0, 20).name('Turbidity');
        sunFolder.add(this.skyUniforms['rayleigh'], 'value', 0, 4).name('Rayleigh');
        sunFolder.add(this.skyUniforms['mieCoefficient'], 'value', 0, 0.8).name('Mie Coeff');
        sunFolder.add(this.skyUniforms['mieDirectionalG'], 'value', 0, 1).name('Mie G');
    }

    // Function to update sun position
    updateSun() {
        let elapsed = this.clock.getElapsedTime();

        let hour;
        if (this.params.realTime) {
            // --- Sync with system clock ---
            let now = new Date();
            hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        } else {
            // --- Simulated time with speed control ---
            hour = this.params.timeOfDay + elapsed * this.params.sunSpeed * 0.1;
            hour = hour % 24; // Wrap around 24h
        }

        // Convert hour -> elevation for Sky shader
        // Simple mapping: 0h = midnight, 12h = midday (sun highest)
        let elevation = (hour / 24) * 360 - 90; // Map [0,24] → [-90,270]

        // Override with manual GUI settings if desired
        elevation = elevation;
        let azimuth = this.params.azimuth;

        // Update uniforms
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);

        this.sun.setFromSphericalCoords(1, phi, theta);
        this.sky.material.uniforms['sunPosition'].value.copy(this.sun);

        // Update directional light
        this.directionalLight.position.copy(this.sky.material.uniforms['sunPosition'].value.multiplyScalar(1600));
        this.directionalLight.intensity = Math.max(0, Math.sin(THREE.MathUtils.degToRad(elevation))); // softer effect

        // If sun sets, the light ambient light will be convert to moon light.
        if (this.directionalLight.intensity == 0) {
            this.ambientLight.intensity = 0.2;
            this.ambientLight.color = new THREE.Color('#86cdff');
        } else {
            this.ambientLight.intensity = 0.4;
            this.ambientLight.color = new THREE.Color(0xffffff);
        }
    }
}

export default SkyShader;