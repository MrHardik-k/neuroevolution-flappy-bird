// Mutation function to be passed into bird.brain
function mutate(x) {
  if (random(1) < 0.1) {
    let offset = randomGaussian() * 0.5;
    let newx = x + offset;
    return newx;
  } else {
    return x;
  }
}

class Bird {
  constructor(brain, isMutate = true) {
    this.reset(brain, isMutate);
  }

  reset(brain, isMutate = true) {
    // position and size of bird
    this.x = 64;
    this.y = height / 2;
    this.r = 12;

    // Gravity, lift and velocity
    this.gravity = 0.4;
    this.lift = -12;
    this.velocity = 0;
    this.maxUpVelocity = -8;

    // Is this a copy of another Bird or a new one?
    // The Neural Network is the bird's "brain"
    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      if (isMutate == true) {
        this.brain.mutate(mutate);
      }
    } else {
      this.brain = new NeuralNetwork(5, 2, [10]);
    }

    // Score is how many frames it's been alive
    this.score = 0;
    // Fitness is normalized version of score
    this.fitness = 0;
  }

  // Create a copy of this bird
  copy(isMutate = true) {
    return new Bird(this.brain, isMutate);
  }

  show() {
    push();
    translate(this.x, this.y);

    // Rotation based on velocity
    let angle = map(this.velocity, -10, 10, -PI / 6, PI / 4);
    rotate(angle);

    // Choose the right animation frame
    let frameIndex = floor(frameCount / 5) % 3;
    let img = birdImages[frameIndex]; // Array of loaded images

    // Draw the bird
    imageMode(CENTER);
    image(img, 0, 0, this.r * 4, this.r * 4); // Adjust size as needed

    pop();
  }

  // This is the key function now that decides
  // if it should jump or not jump!
  think(pipes) {
    // First find the closest pipe
    let closest = null;
    let record = Infinity;
    for (let i = 0; i < pipes.length; i++) {
      let diff = pipes[i].x - this.x;
      if (diff > 0 && diff < record) {
        record = diff;
        closest = pipes[i];
      }
    }

    if (closest != null) {
      // Now create the inputs to the neural network
      let inputs = [];
      // x position of closest pipe
      inputs[0] = map(closest.x, this.x, width, 0, 1);
      // top of closest pipe opening
      inputs[1] = map(closest.top, 0, height, 0, 1);
      // bottom of closest pipe opening
      inputs[2] = map(closest.bottom, 0, height, 0, 1);
      // bird's y position
      inputs[3] = map(this.y, 0, height, 0, 1);
      // bird's y velocity
      inputs[4] = map(this.velocity, -8, 8, 0, 1);

      // Get the outputs from the network
      let action = this.brain.predict(inputs);
      // Decide to jump or not!
      if (action[1] > action[0]) {
        this.up();
      }
    }
  }

  // Jump up
  up() {
    if (this.velocity > this.maxUpVelocity) {
      this.velocity += this.lift;
    }
    if (this.velocity < this.maxUpVelocity) {
      this.velocity = this.maxUpVelocity;
    }
  }

  bottomTop() {
    // Bird dies when hits bottom?
    return this.y > height || this.y < 0;
  }

  // Update bird's position based on velocity, gravity, etc.
  update() {
    this.velocity += this.gravity;
    if (this.velocity > -this.maxUpVelocity) {
      this.velocity = -this.maxUpVelocity;
    }
    // this.velocity *= 0.9;
    this.y += this.velocity;
    // Every frame it is alive increases the score
    this.score++;
  }
}
