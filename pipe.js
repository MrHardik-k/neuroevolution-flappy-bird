class Pipe {
  constructor() {
    // How big is the empty space
    let spacing = 125;
    // Where is th center of the empty space
    let centery = random((2 * spacing) / 3, height - (2 * spacing) / 3);

    // Top and bottom of pipe
    this.top = centery - spacing / 2;
    this.bottom = height - (centery + spacing / 2);
    // Starts at the edge
    this.x = width;
    // Width of pipe
    this.w = 80;
    // How fast
    this.speed = 6;
  }

  // Did this pipe hit a bird?
  hits(bird) {
    if (bird.y - bird.r < this.top || bird.y + bird.r > height - this.bottom) {
      if (bird.x > this.x && bird.x < this.x + this.w) {
        return true;
      }
    }
    return false;
  }

  // Draw the pipe
  show() {
    stroke(255);
    fill(200);
    image(pipe_down_img, this.x, 0, this.w, this.top);
    // rect(this.x, 0, this.w, this.top);
    image(pipe_up_img, this.x, height - this.bottom, this.w, this.bottom);
    // rect(this.x, height - this.bottom, this.w, this.bottom);
  }

  // Update the pipe
  update() {
    this.x -= this.speed;
  }

  // Has it moved offscreen?
  offscreen() {
    if (this.x < -this.w) {
      return true;
    } else {
      return false;
    }
  }
}
