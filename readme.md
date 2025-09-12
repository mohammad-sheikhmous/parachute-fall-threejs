# 🪂 Parachute Jump Simulation

This project simulates a **parachute jump experience** using physics principles and real-world environmental factors.  
It combines entertainment with scientific applications, allowing users to understand the dynamics of **free fall**, **air resistance**, **wind forces**, and **parachute deployment**.

---

## 🎯 Features

- **Realistic Free Fall:** Simulation starts from an airplane at a specific altitude and speed.
- **Parachute Deployment:** Gradual speed reduction after parachute opens, considering safe and unsafe thresholds.
- **Rotation Dynamics:** Ability to perform rolls (rotation around x-axis) and pitches (rotation around z-axis).
- **Wind Forces:** Wind effect applied on both x-axis and z-axis.
- **Air Resistance & Gravity:** Accurate representation of drag force and gravitational pull.
- **Terrain Awareness:** Collision detection with realistic ground surface (including rough terrains).
- **Customizable Environment:** Control sky, sun position, clouds, and real-time simulation of the atmosphere.

---

## ⚡ Forces Involved

- **Gravity (Weight)**
- **Air Resistance (Drag)**
- **Wind Forces** (X-axis and Z-axis)
- **Parachute Rope Pulling Force** (used for left/right turns)

---

## 🕹️ Simulation Stages

1. **Airplane Flight:** Plane flies at a given altitude and speed.  
2. **Jump Command:** Skydiver begins free fall in "belly to earth" position.  
3. **Free Fall Control:** Skydiver can roll (x-axis) or pitch (z-axis).  
4. **Terminal Velocity:** Speed increases until reaching maximum velocity.  
5. **Parachute Deployment:** Skydiver switches to "head-up" vertical position, speed gradually decreases.  
6. **Gliding & Turning:** Pulling left/right ropes adjusts trajectory.  
7. **Landing:** Safe or crash landing depending on final velocity and terrain conditions.

---

## ⚙️ Configurable Parameters

- **Skydiver:** Weight, gravity acceleration  
- **Wind:** Speed along X-axis and Z-axis  
- **Parachute:** Surface area, rope tension, rope distance from center, rope angle  
- **Airplane:** Initial position and speed  
- **Sky Shader:** Sun height, turbidity, scattering coefficients, real-time vs custom time of day  
- **Cloud Shader:** Coverage, density, speed, movement  
- **Collision Properties:** Ground rebound factor (Y-axis), friction factor (X & Z axes)  
- **Landing Thresholds:** Safe and crash speed limits  

---

## 🎮 Controls

- **Jump Button** → Initiates the skydive.  
- **Deploy Parachute Button** → Opens parachute.  
- **Rope Pull Button** → Turns left or right.  
- **Rotation Controls** → Adjust roll and pitch angles during free fall.  

---

## 🛠️ Technologies Used

- **Three.js** → Rendering the 3D environment  
- **Blender + GIS** → Terrain modeling from Google Maps (Italian countryside with buildings & roads)  
- **Sky Shader (Three.js)** → Realistic atmospheric skybox with sun & lighting simulation  
- **Custom Cloud Shader** → Dynamic clouds with adjustable density & coverage  
- **3D Models** → Airplane, parachute, and skydiver models  
- **Mixamo + Blender** → Animations for skydiver movements, processed & sequenced  
- **Raycaster (Three.js)** → Collision detection for head, hands, and feet with terrain  
- **Sound Effects** → Immersive audio for realism  

---

## 🔮 Future Improvements

- Multiplayer skydiving simulation

- VR headset support

- More advanced physics for turbulence and parachute deformation

- Real-world weather API integration

---

# Project Setup Guide

This project uses **Git LFS (Large File Storage)** to handle large files (e.g., backups, media, datasets).  
Please make sure you follow these steps to clone and set up the project correctly.

## 🚀 Cloning the Repository

1. Clone the repository:
   ```bash
   git clone https://github.com/mohammad-sheikhmous/parachute-fall-threejs.git
   cd parachute-fall-threejs

2. Install Git LFS (only the first time on your machine):


 - Windows: https://git-lfs.com/

 - Linux (Ubuntu/Debian):
    ```bash
    sudo apt-get install git-lfs

 - macOS (Homebrew):
    ```bash
    brew install git-lfs
---

3. Initialize Git LFS:
    ```bash
    git lfs install

4. Pull large files managed by Git LFS:
    ```bash
    git lfs pull


## Install Dependencies

Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:5173
npm run dev
```

## 👥 Contributors

- **Nagham Mojahed** – [GitHub](https://github.com/NaghamMujahed)
- **Ghalia Sbei** – [GitHub](https://github.com/ghalia-sbei)
- **Judy Shakhashiro** – [GitHub](https://github.com/Judy-shakhashiro)
- **Mohammad Sheikhmous** – [GitHub](https://github.com/mohammad-sheikhmous)