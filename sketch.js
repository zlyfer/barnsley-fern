let x, y;
let size, speed, quality;
let sizeSl, speedSl, qualitySl;

function preload() {}

function setup() {
  createCanvas(windowWidth, windowHeight);
  x = y = 0;

  sizeSl = createSlider(100, 1000, 500);
  sizeSl.changed(reset);
  sizeSl.position(10, 10);

  speedSl = createSlider(100, 1000, 500);
  speedSl.changed(reset);
  speedSl.position(10, 40);

  qualitySl = createSlider(1, 100, 5);
  qualitySl.changed(reset);
  qualitySl.position(10, 70);

  reset();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reset();
}

function draw() {
  strokeWeight(quality);
  translate((width - size) / 2, (height - size) / 2);

  for (let i = 0; i < speed; i++) {
    let color = 125;
    // let color = round(random(0, 255));
    stroke(0, color, 0);
    let rx = map(x, -2.1820, 2.6558, 0, size);
    let ry = map(y, 0, 9.9983, size, 0);
    point(rx, ry);
    portionGen();
  }
}

function portionGen() {
  let p = random(1);
  let nx, ny;
  if (p <= 0.01) {
    nx = 0 * x + 0 * y;
    ny = 0 * x + 0.16 * y;
  } else if (p > 0.01 && p <= 0.86) {
    nx = 0.85 * x + 0.04 * y;
    ny = -0.04 * x + 0.85 * y + 1.6;
  } else if (p > 0.86 && p <= 0.93) {
    nx = 0.2 * x - 0.26 * y;
    ny = 0.23 * x + 0.22 * y + 1.6;
  } else if (p > 0.93 /*&& p <= 1*/ ) {
    nx = -0.15 * x + 0.28 * y;
    ny = 0.26 * x + 0.24 * y + 0.44;
  }
  x = nx;
  y = ny;
}

function reset() {
  size = sizeSl.value();
  speed = speedSl.value();
  quality = qualitySl.value() / 10;
  background(10);
}