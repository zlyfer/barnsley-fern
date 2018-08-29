let x, y, xoff, yoff;
let size, speed, quality;
let sizeSl, speedSl, qualitySl, xoffSl, yoffSl, randomBn;
let acc = false;

function preload() {}

function setup() {
  createCanvas(windowWidth, windowHeight);
  x = y = 0;

  sizeSl = createSlider(100, 10000, 500);
  // sizeSl.changed(reset);
  sizeSl.position(10, 10);

  speedSl = createSlider(250, 10000, 1000);
  // speedSl.changed(reset);
  speedSl.position(10, 40);

  qualitySl = createSlider(1, 100, 100);
  // qualitySl.changed(reset);
  qualitySl.position(10, 70);

  xoffSl = createSlider(-width / 2, width / 2, 0);
  // xoffSl.changed(reset);
  xoffSl.position(10, 100);

  yoffSl = createSlider(-height / 2, height / 2, 0);
  // yoffSl.changed(reset);
  yoffSl.position(10, 130);

  randomBn = createButton('Random');
  randomBn.position(10, 170);
  randomBn.style('width', '130px');
  randomBn.mousePressed(randomGen);


  reset();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reset();
}

function keyPressed() {
  if (keyCode == 18) {
    acc = !acc;
  }
}

function draw() {
  checkChange();
  applySettings();

  push();
  strokeWeight(10 - quality);
  colorMode(HSL);
  translate(((width - size) / 2) + xoff, ((height - size) / 2) + yoff);
  for (let i = 0; i < speed; i++) {
    let h = map(x, -2.1820, 2.6558, -size / 5196, size / 8);
    let s = 50;
    let b = 50;
    stroke(h, s, b);
    let rx = map(x, -2.1820, 2.6558, 0, size);
    let ry = map(y, 0, 9.9983, size, 0);
    point(rx, ry);
    portionGen();
  }
  pop();

  push();
  textSize(32);
  fill(20);
  rect(width - 95, 0, 95, 40)
  fill(255);
  text(`fps: ${round(frameRate())}`, width - 95, 32)
  pop();
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

function checkChange() {
  if ((sizeSl.value() != size) ||
    // (speedSl.value() != speed) ||
    (qualitySl.value() / 10 != quality) ||
    (xoffSl.value() != xoff) ||
    (yoffSl.value() != yoff)) {
    reset();
  }
}

function reset() {
  background(20);
}

function mouseWheel(event) {
  let changer = 25;
  if (acc) {
    changer = changer * 2;
  }
  if (event.delta < 0) {
    switch (keyCode) {
      case 101:
        qualitySl.value(qualitySl.value() + (changer / 15));
        break;
      case 113:
        sizeSl.value(sizeSl.value() + changer);
        break;
      case 114:
        xoffSl.value(xoffSl.value() + (changer / 5));
        break;
      case 116:
        yoffSl.value(yoffSl.value() + (changer / 5));
        break;
      case 119:
        speedSl.value(speedSl.value() + (changer * 10));
        speed = speedSl.value();
        break;
      default:
        sizeSl.value(sizeSl.value() + changer);
        break;
    }
  } else {
    switch (keyCode) {
      case 101:
        qualitySl.value(qualitySl.value() - (changer / 15));
        break;
      case 113:
        sizeSl.value(sizeSl.value() - changer);
        break;
      case 114:
        xoffSl.value(xoffSl.value() - (changer / 5));
        break;
      case 116:
        yoffSl.value(yoffSl.value() - (changer / 5));
        break;
      case 119:
        speedSl.value(speedSl.value() - (changer * 10));
        speed = speedSl.value();
        break;
      default:
        sizeSl.value(sizeSl.value() - changer);
        break;
    }
  }
}

function randomGen() {
  xoffSl.value(random(-width / 2, width / 2));
  yoffSl.value(random(-height / 2, height / 2));
  sizeSl.value(random(sizeSl.elt.min, sizeSl.elt.max));
}

function applySettings() {
  size = sizeSl.value();
  speed = speedSl.value();
  quality = qualitySl.value() / 10;
  xoff = xoffSl.value();
  yoff = yoffSl.value();
}