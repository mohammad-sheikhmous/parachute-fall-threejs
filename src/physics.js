export class Physics {
  mass;
  windXVelocity;
  windZVelocity;
  verticalVelocity;
  horizontalVelocity;
  zVelocity;

  constructor(paratrooperPosition) {
    this.altitude = paratrooperPosition.altitude;
    this.mass = 75;
    this.height = 1.8;
    this.g = 9.81;
    this.Cd = 0.47;
    this.rho = 1.225; // Air density at sea level
    this.A = 0.7;  // Cross-sectional area for a person
    this.fluidDensity = 1.225; // Air density (kg/m³) - for air buoyancy
    this.volume = 0.07; // Approximate volume of a person 
    this.CL = 1.2; // Lift coefficient for parachute (approximate)
    this.parachuteArea = 0.7; // Parachute area (m²)
    this.paraFullArea = 30;

    /**
     * Calculate initial physics properties
    */
    this.weight = this.calculateWeight();

    this.verticalAirResistance = 0; // Will be updated based on velocity
    this.horizontalAirResistance = 0; // Will be updated based on velocity
    this.zAirResistance = 0; // Will be updated based on velocity

    this.buoyantForce = this.calculateBuoyantForce();
    this.liftForce = 0; // Will be updated based on parachute velocity

    this.verticalVelocity = 0;
    this.horizontalVelocity = -0.1;
    this.zVelocity = 0;

    this.startTimeInSeconds = this.getStartTimeInSeconds();
    this.elapsedTimeInSeconds = 0;

    this.verticalPosition = paratrooperPosition.altitude + 0.44;
    this.horizontalPosition = paratrooperPosition.offset;
    this.zPosition = paratrooperPosition.depth - 0.2;

    this.verticalAcceleration = 0;
    this.horizontalAcceleration = 0;
    this.zAcceleration = 0;

    this.windXVelocity = 10;
    this.windZVelocity = 5;

    this.windXForce = this.calculatewindXForce(); // Will be updated based on wind velocity
    this.windZForce = this.calculatewindZForce();

    //عزم القصور الذاتي
    // I = m * r² (r=1.0m - increased for gentler rotation)
    this.Ix = this.calculateMomentOfInertiaX()
    this.Iy = this.calculateMomentOfInertiaY()
    this.Iz = this.calculateMomentOfInertiaZ()

    //القوة التي يطبقها المظلي من اجل الدوران ،وذلك بانزال ذراعه مثلا نحو الاسفل فيدور متآثرا بوزنها
    //للمحاكاة سيتم ادخالها يدويا
    this.rotationForce = 0;

    //قيمة تقريبة لذراع القوة(المسافة من المحور) في حالة السقوط الحر
    this.d = 0.122 * this.height

    // d الزاوية بين قوة الدوران المطبق وذراع القوة
    //ايضا لاجل المحاكاة الادخال يدويا
    this.angleBetween = 0;

    // Torqes
    this.torqueX = 0;
    this.torqueY = 0;
    this.torqueZ = 0;

    // Angular Accelerations.
    this.alphaX = 0;
    this.alphaY = 0;
    this.alphaZ = 0;

    // Angular Velocities.
    this.omegaX = 0;
    this.omegaY = 0;
    this.omegaZ = 0;

    // Rotation Angles
    this.thetaX = 0; // Start at 0 degrees for better sine values
    this.thetaY = 0;
    this.thetaZ = 0;

    this.isRotating = false;
    this.rotatingTime = 0;

    // Pull ropes properties for direction change
    // this.ropeAngularAcceleration = 0.3; // (rad/s²)
    this.ropePullTime = 0;
    this.isRopePulling = false;
  }

  getStartTimeInSeconds() {
    let startTime = new Date();
    let startTimeInSeconds = startTime.getSeconds() + startTime.getMinutes() * 60 + startTime.getHours() * 3600;
    return startTimeInSeconds;
  }

  // W = mg
  calculateWeight() {
    return this.mass * this.g;
  }

  // F = 1/2 × Cd × ρ × A × v²
  calculateAirResistance(velocity, area) {
    return (0.5 * this.Cd * this.rho * area * Math.pow(velocity, 2));
  }

  // F = ρ × V × g
  calculateBuoyantForce() {
    return this.fluidDensity * this.volume * this.g;
  }

  // F = 1/2 × Cd × ρ × A × v_wind²
  calculatewindXForce() {
    return 0.5 * this.Cd * this.rho * this.A * Math.pow(this.windXVelocity, 2);
  }

  // F = 1/2 × Cd × ρ × A × v_wind²
  calculatewindZForce() {
    return 0.5 * this.Cd * this.rho * this.A * Math.pow(this.windZVelocity, 2);
  }

  // L = 1/2 × CL × ρ × A × v_parachute²
  calculateLiftForce(parachuteVelocity) {
    return 0.5 * this.CL * this.rho * this.parachuteArea * Math.pow(parachuteVelocity, 2);
  }

  updatePhysicsProperties(dt) {
    // Forces
    const verticalForce = this.weight - this.verticalAirResistance;
    const horizontalForce = this.windXForce - this.horizontalAirResistance;
    const zForce = this.windZForce - this.zAirResistance;

    // Acceleration
    this.verticalAcceleration = verticalForce / this.mass;
    this.horizontalAcceleration = horizontalForce / this.mass;
    this.zAcceleration = zForce / this.mass;

    // Velocity
    this.verticalVelocity -= this.verticalAcceleration * dt;
    this.horizontalVelocity += this.horizontalAcceleration * dt;
    this.zVelocity += this.zAcceleration * dt;

    // Position
    this.verticalPosition += this.verticalVelocity * dt;
    this.horizontalPosition += this.horizontalVelocity * dt;
    this.zPosition += this.zVelocity * dt;

    // Update air resistance with new velocities and correct area
    this.verticalAirResistance = this.calculateAirResistance(Math.abs(this.verticalVelocity), this.parachuteArea);
    this.horizontalAirResistance = this.calculateAirResistance(this.horizontalVelocity, this.A);
    this.zAirResistance = this.calculateAirResistance(this.zVelocity, this.A);

    // Update elapsed time
    let currentTime = new Date();
    let currentTimeInSeconds = currentTime.getSeconds() + currentTime.getMinutes() * 60 + currentTime.getHours() * 3600;
    this.elapsedTimeInSeconds = currentTimeInSeconds - this.startTimeInSeconds;

    /**
     * حساب الدوران 
     */
    /**
      العلاقة بين عزم الدوران وعزم القصور هي 
      τ = α * 𝐼 
      وعزم القصور الذاتي يعتمد على عدة عوامل ،فقانون عزم القصور للحلقة غير قانون عزم
      القصور للاسطوانة ،وفي حالة الاجسام ذات الاشكال غير المنتظمة يتم حسابها باستخدام التكامل
      و قد يتخذ المظلي وضعيات مختلفة فقد وجدنا انه يمكنه القيام بست وضعيات مختلفة ولكل وضعية 
      عزم قصور خاص فيها ،لذلك سنترك عزم القصور ك حقل لتعديله من قبل المستخدم ،وسنضع قيمة افتراضية
      ،سيتم التحكم (اي المستخدم يدخلها) من خلال 
      زاوية الدوران والقوة المؤثرة وعزم القصور الذاتي
      ثم من اجل الرسم ووضع قيمة ل 
      paragroup.rotation.x ،
      سيتم حساب مقدار الازاحة الزاوية
      θ(t) += α *dt
      سيتم تمكين المستخدم من الدوران على الافقي وزد في حالة السقوط قبل المظلة
      عمليا يقوم المظلي بالدوران بتحريك الاطراف والجذع بطريقة معينة
      ولجعل المحاكاة حقيقية اكثر يجب تحريك المودل بتلك الوضعيات عند الدوران 
      مثل مد يد واحدة للامام واخرى للخلف ..الخ
      ولكن سيتم التدوير حاليا بدون تغيير وضعيات شكل الهبوط للمظلي
      وعلى المحور الشاقولي في حال بعد فنح المظلة
    */
    if (this.parachuteArea === 0.7) {

      //حالة الدحرجة
      if (this.torqueX !== 0 && !isNaN(this.torqueX) && this.isRotating) {

        this.rotatingTime += dt;
        this.alphaX = this.torqueX / this.Ix;
        this.omegaX += this.alphaX * dt;
        this.thetaX += this.omegaX * dt + (0.5 * this.alphaX * Math.pow(dt, 2));
        this.thetaX = this.thetaX % (2 * Math.PI);

        if (this.rotatingTime > 8.0) {
          this.torqueX = 0;
          this.isRotating = false;
          this.alphaX = 0;
        }
      }

      //حالة الشقلبة
      if (this.torqueZ !== 0 && !isNaN(this.torqueZ) && this.isRotating) {

        this.rotatingTime += dt;
        this.alphaZ = this.torqueZ / this.Iz;
        this.omegaZ += this.alphaZ * dt;
        this.thetaZ += this.omegaZ * dt + (0.5 * this.alphaZ * Math.pow(dt, 2));
        this.thetaZ = this.thetaZ % (2 * Math.PI);

        if (this.rotatingTime > 8.0) {
          this.torqueZ = 0;
          this.isRotating = false;
          this.alphaZ = 0;
        }
      }

    } else if (this.parachuteArea === this.paraFullArea) {
      // Parachute is open - handle rope pulling for direction change
      if (this.isRopePulling) {
        this.ropePullTime += dt;

        this.alphaY = this.torqueY / this.Iy;

        // Apply angular velocity formula: w = w0 + alpha * t
        this.omegaY += this.alphaY * dt;
        this.thetaY += this.omegaY * dt;
        this.thetaY = this.thetaY % (2 * Math.PI);

        // Stop rope pulling after 2 seconds
        if (this.ropePullTime > 2.0) {
          this.isRopePulling = false;
          this.alphaY = 0;
        }
      }
    }
  }

  //moment of inertia 
  //عزم القصور الذاتي
  /* we will take those values in order to calculate the moment of inertia of our model
  we divide the model into 
  جذع ،اطراف سفلية ،اطراف علوية
  M = total mass (kg)
  H = total height (m)
  Trunk mass fraction = 0.50M
  Each arm =0.05M
  Each leg=0.16
  Limb lengths as fractions of height: 
  l(arm)=0.45*H
  l(leg)=0.53H
  Trunk radius=0.12H
  trunk length=0.35H
  Arm COM at 0.436 of l(arm) from shoulder
  Arm COM at 0.5 of l(leg) from hip
  Shoulder offset from body center = 0.08 H
  Hip offset from body center = 0.07 H
  المودل يكون في البداية محوره على الخط اكس لان الطيارة على المحور اكس عم تمشي
  لذلك فان الدوران على المحور اكس في هذه الحالة يجعله عمليا المفروض كآنه يتدحرج او ما تسمى ب
  roll
  اما اذا اراد الدوران حول المحور زد فان محور الجسم سيكون عموديا على محور الدوران زد بهذه 
  الحالة عمليا المفروض يصير المظلي كانو عم يتشقلب في الهواء او ما يسمى 
  pitch
  اما اذا اراد الدوران حول المحور الشاقولي فذلك متاح لكن بعد فتح المظلة ويسمى الدوران في هذه الحالة 
  yaw
  هنا في محاكاتنا تكون وضعية المظلي اثناء السقوط هي belly to earth 
  وفي هذه الوضعية وفي محاكاتنا يمكنه الدوران حول المحاور الافقية فيقوم بالدحرجة او الشقلبة
  roll/pitch
  اما بعد فتح المظلة فتصبح وضعيته 
  head-up 
  وفي هذه الحالة يمكنه الدوران حول المحور الشاقولي
  */

  calculateMomentOfInertiaX() {
    return this.mass * 0.0416 * Math.pow(this.height, 2)
  }
  calculateMomentOfInertiaY() {
    return this.mass * 0.0416 * Math.pow(this.height, 2)
  }
  calculateMomentOfInertiaZ() {
    return this.mass * 0.0449 * Math.pow(this.height, 2)
  }


  startRotationX() {
    this.torqueX = this.rotationForce * this.d * Math.sin(this.angleBetween * Math.PI / 180);
    this.isRotating = true;
    this.rotatingTime = 0;
  }

  startRotationY() {
    this.torqueY = this.rotationForce * this.d * Math.sin(this.angleBetween * Math.PI / 180);
  }

  startRotationZ() {
    this.isRotating = true;
    this.rotatingTime = 0;
    this.torqueZ = this.rotationForce * this.d * Math.sin(this.angleBetween * Math.PI / 180);
  }

  pullRopes() {
    // Apply angular acceleration to change direction
    this.isRopePulling = true;
    this.ropePullTime = 0;

    // Apply angular acceleration in Y direction (steering)
    this.startRotationY();
  }

  openParachute() {
    this.parachuteArea = this.paraFullArea;
    this.torqueX = 0;
    this.torqueY = 0;
    this.torqueZ = 0;
    this.alphaX = 0;
    this.alphaY = 0;
    this.alphaZ = 0;
    this.omegaX = 0;
    this.omegaY = 0;
    this.omegaZ = 0;
    this.thetaX = 0;
    this.thetaY = 0;
    this.thetaZ = 0;
    this.isRopePulling = false;
    this.ropePullTime = 0;
  }
}