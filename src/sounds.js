import * as THREE from 'three';


/**
 * Sounds
 */
const listener = new THREE.AudioListener();

// const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

export class Sound {
    airplaneInsideSound = new THREE.PositionalAudio(listener);
    airplaneOutsideSound = new THREE.PositionalAudio(listener);
    highWindSound = new THREE.PositionalAudio(listener);
    windyInNatureSound = new THREE.PositionalAudio(listener);
    fallImpactSound = new THREE.PositionalAudio(listener);
    nightSound = new THREE.PositionalAudio(listener);
    actions;
    camera;
    gui;
    directionalLight;

    constructor(actions, camera, gui, directionalLight) {
        this.actions = actions;
        this.camera = camera;
        this.gui = gui;
        this.directionalLight = directionalLight;

        this.camera.add(listener);

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/airplane-inside.mp3`, (buffer) => {
            this.airplaneInsideSound.setBuffer(buffer);
            this.airplaneInsideSound.setRefDistance(1.5);
            this.airplaneInsideSound.setMaxDistance(1.5);
            this.airplaneInsideSound.setLoop(true);
            this.airplaneInsideSound.setRolloffFactor(5);
            this.airplaneInsideSound.setVolume(0.3);
        });

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/airplane-outside.mp3`, (buffer) => {
            this.airplaneOutsideSound.setBuffer(buffer);
            this.airplaneOutsideSound.setLoop(true);
        });

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/high-wind.mp3`, (buffer) => {
            this.highWindSound.setBuffer(buffer);
            this.highWindSound.setLoop(true);
        });

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/windy-in-nature.mp3`, (buffer) => {
            this.windyInNatureSound.setBuffer(buffer);
            this.windyInNatureSound.setLoop(true);
            this.windyInNatureSound.setRefDistance(250);
            this.windyInNatureSound.setMaxDistance(250);
            this.windyInNatureSound.setVolume(0.7);
        });

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/body-fall-impact.mp3`, (buffer) => {
            this.fallImpactSound.setBuffer(buffer);
            this.fallImpactSound.setRefDistance(400);
            this.fallImpactSound.setMaxDistance(500);
            this.fallImpactSound.setVolume(1);
        });

        audioLoader.load(`${import.meta.env.BASE_URL}sounds/night.mp3`, (buffer) => {
            this.nightSound.setBuffer(buffer);
            this.nightSound.setLoop(true);
            this.nightSound.setRefDistance(400);
            this.nightSound.setMaxDistance(500);
            this.nightSound.setVolume(1);
        });

        // Add sound control to gui.
        this.actions.isPlaying = false;
        this.gui.add(actions, 'isPlaying').name('Play / Stop Sounds').onChange(v => {
            if (v) {
                if (listener.context.state === 'suspended') {
                    listener.context.resume();
                }
                this.airplaneInsideSound.play();
                this.airplaneOutsideSound.play();
                this.highWindSound.play();

                if (this.directionalLight.intensity < 0.2)
                    this.nightSound.play();
                else
                    this.windyInNatureSound.play();

            } else {
                this.airplaneInsideSound.stop();
                this.airplaneOutsideSound.stop();
                this.highWindSound.stop();
                this.windyInNatureSound.stop();
                this.nightSound.stop();
            }
        });
    }

    updateAudio(sound, minDistance, maxDistance, maxVolume, mesh) {
        const distance = this.camera.position.distanceTo(mesh.position);
        if (distance < minDistance) {
            sound.setVolume(0); // Mute
        } else if (distance > maxDistance) {
            sound.setVolume(0); // Mute
        } else {
            const factor = (distance - minDistance) / (maxDistance - minDistance);
            sound.setVolume((1 - factor) * maxVolume);
        }
    }
}
