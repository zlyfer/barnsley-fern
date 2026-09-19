// jshint esversion: 6

const FERN_MIN_X = -2.182;
const FERN_MAX_X = 2.6558;
const FERN_MIN_Y = 0;
const FERN_MAX_Y = 9.9983;
const TARGET_FRAME_RATE = 120;
const MAX_SPEED = 50000;
const WARNING_SPEED = 25000;
const PANEL_WIDTH = 320;
const ZOOM_BASE = 1.03;
const MIN_ZOOM_STEP = -160;
const MAX_ZOOM_STEP = 500;
const MAX_AUTO_BOOST = 160;
const MAX_SAMPLE_ATTEMPTS = 2000000;
const BURN_IN_STEPS = 100;
const MAX_CACHED_POINTS = 1500000;
const REDRAW_BATCH_SIZE = 120000;

let x = 0;
let y = 0;
let xoff = 0;
let yoff = 0;
let size = 500;
let speed = 1000;
let detail = 10;
let zoomStep = 0;
let zoomFactor = 1;
let acc = false;
let isDragging = false;
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartXoff = 0;
let dragStartYoff = 0;

let sizeSl;
let speedSl;
let detailSl;
let zoomSl;
let xoffSl;
let yoffSl;
let randomBn;
let panel;
let helpPanel;
let statusP;
let fpsP;
let sizeValue;
let speedValue;
let detailValue;
let zoomValue;
let xoffValue;
let yoffValue;

let renderOriginX = 0;
let renderOriginY = 0;
let scaledSize = 500;
let plotScaleX = 1;
let plotScaleY = 1;
let hueBase = 0;
let hueScale = 1;
let strokeSize = 1;
let visibleFraction = 1;
let autoBoost = 1;
let sampleBudget = 1000;
let cachedPointCount = 0;
let cacheWriteIndex = 0;
let redrawIndex = 0;
let needsFullRedraw = false;

const pointCacheX = new Float32Array(MAX_CACHED_POINTS);
const pointCacheY = new Float32Array(MAX_CACHED_POINTS);

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(TARGET_FRAME_RATE);
  createUi();
  updateLayout();
  updateSliderRanges();
  syncFromControls(false);
  reset(true);
}

function draw() {
  push();
  colorMode(HSL);
  strokeWeight(strokeSize);
  translate(renderOriginX, renderOriginY);

  if (needsFullRedraw) {
    redrawCachedPoints();
  }

  drawNewSamples();

  pop();
  fpsP.html(`FPS ${round(frameRate())}`);
}

function createUi() {
  panel = createDiv("");
  panel.style("position", "absolute");
  panel.style("top", "12px");
  panel.style("left", "12px");
  panel.style("width", `${PANEL_WIDTH}px`);
  panel.style("padding", "14px 16px");
  panel.style("border-radius", "14px");
  panel.style("background", "rgba(12, 18, 14, 0.78)");
  panel.style("border", "1px solid rgba(160, 220, 170, 0.22)");
  panel.style("box-shadow", "0 18px 40px rgba(0, 0, 0, 0.28)");
  panel.style("color", "#eef6ee");
  panel.style("font-family", "Consolas, 'Courier New', monospace");
  panel.style("z-index", "10");

  const heading = createP("Barnsley Fern Explorer");
  heading.parent(panel);
  heading.style("margin", "0 0 10px 0");
  heading.style("font-size", "16px");
  heading.style("font-weight", "700");
  heading.style("letter-spacing", "0.04em");

  const intro = createP("Zoom with the wheel, then refine the fern with the controls or shortcut keys while scrolling.");
  intro.parent(panel);
  intro.style("margin", "0 0 14px 0");
  intro.style("font-size", "12px");
  intro.style("line-height", "1.45");
  intro.style("color", "rgba(238, 246, 238, 0.78)");

  const sizeControl = createLabeledSlider("Size", 100, 1000, 500, 1);
  sizeSl = sizeControl.slider;
  sizeValue = sizeControl.value;

  const speedControl = createLabeledSlider("Speed", 250, MAX_SPEED, 1000, 10);
  speedSl = speedControl.slider;
  speedValue = speedControl.value;

  const zoomControl = createLabeledSlider("Zoom", MIN_ZOOM_STEP, MAX_ZOOM_STEP, 0, 1);
  zoomSl = zoomControl.slider;
  zoomValue = zoomControl.value;

  const detailControl = createLabeledSlider("Detail", 1, 100, 100, 1);
  detailSl = detailControl.slider;
  detailValue = detailControl.value;

  const xoffControl = createLabeledSlider("Offset X", -width / 2, width / 2, 0, 1);
  xoffSl = xoffControl.slider;
  xoffValue = xoffControl.value;

  const yoffControl = createLabeledSlider("Offset Y", -height / 2, height / 2, 0, 1);
  yoffSl = yoffControl.slider;
  yoffValue = yoffControl.value;

  bindSlider(sizeSl, true);
  bindSlider(speedSl, false);
  bindSlider(zoomSl, true);
  bindSlider(detailSl, true);
  bindSlider(xoffSl, true);
  bindSlider(yoffSl, true);

  randomBn = createButton("Randomize View");
  randomBn.parent(panel);
  randomBn.style("margin-top", "12px");
  randomBn.style("width", "100%");
  randomBn.style("padding", "9px 12px");
  randomBn.style("border", "none");
  randomBn.style("border-radius", "10px");
  randomBn.style("background", "#91d18b");
  randomBn.style("color", "#112011");
  randomBn.style("font-family", "inherit");
  randomBn.style("font-weight", "700");
  randomBn.style("cursor", "pointer");
  randomBn.mousePressed(randomGen);

  statusP = createP("");
  statusP.parent(panel);
  statusP.style("margin", "12px 0 0 0");
  statusP.style("font-size", "12px");
  statusP.style("line-height", "1.45");

  helpPanel = createP(
    "Shortcuts: drag = pan, scroll = zoom to cursor, Q + scroll = size, W + scroll = speed, E + scroll = detail, R + scroll = X offset, T + scroll = Y offset, Alt = toggle fast adjust, Space = refit canvas."
  );
  helpPanel.parent(panel);
  helpPanel.style("margin", "12px 0 0 0");
  helpPanel.style("font-size", "11px");
  helpPanel.style("line-height", "1.5");
  helpPanel.style("color", "rgba(238, 246, 238, 0.72)");

  fpsP = createP("");
  fpsP.parent(panel);
  fpsP.style("margin", "12px 0 0 0");
  fpsP.style("font-size", "12px");
  fpsP.style("font-weight", "700");
  fpsP.style("letter-spacing", "0.04em");
}

function createLabeledSlider(label, minValue, maxValue, defaultValue, stepValue) {
  const wrapper = createDiv("");
  wrapper.parent(panel);
  wrapper.style("margin", "0 0 10px 0");

  const labelRow = createDiv("");
  labelRow.parent(wrapper);
  labelRow.style("display", "flex");
  labelRow.style("justify-content", "space-between");
  labelRow.style("align-items", "center");
  labelRow.style("margin-bottom", "4px");

  const labelEl = createSpan(label);
  labelEl.parent(labelRow);
  labelEl.style("font-size", "12px");
  labelEl.style("font-weight", "700");

  const valueEl = createSpan("");
  valueEl.parent(labelRow);
  valueEl.style("font-size", "12px");
  valueEl.style("color", "#91d18b");

  const slider = createSlider(minValue, maxValue, defaultValue, stepValue);
  slider.parent(wrapper);
  slider.style("width", "100%");

  return { slider: slider, value: valueEl };
}

function bindSlider(slider, needsReset) {
  slider.input(function() {
    syncFromControls(needsReset);
  });
}

function syncFromControls(needsReset) {
  size = Number(sizeSl.value());
  speed = Number(speedSl.value());
  zoomStep = Number(zoomSl.value());
  zoomFactor = pow(ZOOM_BASE, zoomStep);
  detail = Number(detailSl.value()) / 10;
  xoff = Number(xoffSl.value());
  yoff = Number(yoffSl.value());

  updateRenderState();
  updateOffsetSliderBounds(scaledSize);
  updateReadouts();
  updateStatus();

  if (needsReset) {
    requestViewRedraw();
  }
}

function updateRenderState() {
  const fernWidth = FERN_MAX_X - FERN_MIN_X;
  const fernHeight = FERN_MAX_Y - FERN_MIN_Y;
  const hueMin = -size / 5196;
  let visibleWidth;
  let visibleHeight;

  scaledSize = size * zoomFactor;

  renderOriginX = (width - scaledSize) / 2 + xoff;
  renderOriginY = (height - scaledSize) / 2 + yoff;
  plotScaleX = scaledSize / fernWidth;
  plotScaleY = scaledSize / fernHeight;
  hueBase = hueMin;
  hueScale = (size - hueMin) / fernWidth;
  strokeSize = constrain(11 - detail, 1, 10);

  visibleWidth = max(0, min(width, renderOriginX + scaledSize) - max(0, renderOriginX));
  visibleHeight = max(0, min(height, renderOriginY + scaledSize) - max(0, renderOriginY));

  visibleFraction = scaledSize > 0 ? (visibleWidth * visibleHeight) / (scaledSize * scaledSize) : 1;
  autoBoost = constrain(1 / max(visibleFraction, 1 / MAX_AUTO_BOOST), 1, MAX_AUTO_BOOST);
  sampleBudget = min(MAX_SAMPLE_ATTEMPTS, round(speed * autoBoost));
}

function updateReadouts() {
  sizeValue.html(size);
  speedValue.html(`${speed} pts/frame`);
  zoomValue.html(formatZoom(zoomFactor));
  detailValue.html(detail.toFixed(1));
  xoffValue.html(xoff);
  yoffValue.html(yoff);
}

function updateStatus() {
  const speedLabel = speed >= WARNING_SPEED ? "high load" : "stable";
  const accelLabel = acc ? "on" : "off";
  const zoomLabel = zoomFactor >= 100 ? "deep zoom" : "framed";
  const boostLabel = autoBoost > 1 ? `${round(autoBoost)}x density` : "base density";
  const cacheLabel = cachedPointCount >= MAX_CACHED_POINTS ? "cache full" : `${round(cachedPointCount / 1000)}k cached`;

  statusP.html(`Fast adjust: ${accelLabel} | Render load: ${speedLabel} | View: ${zoomLabel} | Sampler: ${boostLabel} | Cache: ${cacheLabel}`);
  statusP.style("color", speed >= WARNING_SPEED ? "#ffd166" : "rgba(238, 246, 238, 0.9)");
}

function drawNewSamples() {
  let attempts = 0;
  let visiblePoints = 0;

  while (attempts < sampleBudget && visiblePoints < speed) {
    cachePoint(x, y);

    if (drawWorldPoint(x, y)) {
      visiblePoints += 1;
    }

    portionGen();
    attempts += 1;
  }
}

function redrawCachedPoints() {
  const redrawEnd = min(redrawIndex + REDRAW_BATCH_SIZE, cachedPointCount);

  for (let index = redrawIndex; index < redrawEnd; index++) {
    drawWorldPoint(pointCacheX[index], pointCacheY[index]);
  }

  redrawIndex = redrawEnd;

  if (redrawIndex >= cachedPointCount) {
    needsFullRedraw = false;
  }
}

function drawWorldPoint(worldX, worldY) {
  const rx = (worldX - FERN_MIN_X) * plotScaleX;
  const ry = scaledSize - (worldY - FERN_MIN_Y) * plotScaleY;
  const screenX = renderOriginX + rx;
  const screenY = renderOriginY + ry;

  if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) {
    return false;
  }

  stroke(hueBase + (worldX - FERN_MIN_X) * hueScale, 50, 50);
  point(rx, ry);
  return true;
}

function cachePoint(worldX, worldY) {
  pointCacheX[cacheWriteIndex] = worldX;
  pointCacheY[cacheWriteIndex] = worldY;

  cacheWriteIndex = (cacheWriteIndex + 1) % MAX_CACHED_POINTS;

  if (cachedPointCount < MAX_CACHED_POINTS) {
    cachedPointCount += 1;
  }
}

function requestViewRedraw() {
  background(20);
  redrawIndex = 0;
  needsFullRedraw = cachedPointCount > 0;
}

function formatZoom(value) {
  if (value >= 1000) {
    return `${value.toExponential(2)}x`;
  }

  if (value >= 10) {
    return `${value.toFixed(1)}x`;
  }

  return `${value.toFixed(2)}x`;
}

function mouseWheel(event) {
  const direction = event.delta < 0 ? 1 : -1;
  const step = acc ? 50 : 25;

  if (isPointerInsidePanel(mouseX, mouseY)) {
    return false;
  }

  if (keyIsDown(81)) {
    nudgeSlider(sizeSl, direction * step, true);
  } else if (keyIsDown(87)) {
    nudgeSlider(speedSl, direction * step * 10, false);
  } else if (keyIsDown(69)) {
    nudgeSlider(detailSl, direction * (step / 15), true);
  } else if (keyIsDown(82)) {
    nudgeSlider(xoffSl, direction * (step / 5), true);
  } else if (keyIsDown(84)) {
    nudgeSlider(yoffSl, direction * (step / 5), true);
  } else {
    zoomTowardPointer(direction * (acc ? 6 : 3));
  }

  return false;
}

function zoomTowardPointer(delta) {
  const minZoomStep = Number(zoomSl.elt.min);
  const maxZoomStep = Number(zoomSl.elt.max);
  const nextZoomStep = constrain(Number(zoomSl.value()) + delta, minZoomStep, maxZoomStep);
  const currentScaledSize = scaledSize;
  const pointerRatioX = currentScaledSize === 0 ? 0.5 : (mouseX - renderOriginX) / currentScaledSize;
  const pointerRatioY = currentScaledSize === 0 ? 0.5 : (mouseY - renderOriginY) / currentScaledSize;
  const nextZoomFactor = pow(ZOOM_BASE, nextZoomStep);
  const nextScaledSize = size * nextZoomFactor;
  const nextOriginX = mouseX - pointerRatioX * nextScaledSize;
  const nextOriginY = mouseY - pointerRatioY * nextScaledSize;
  const nextXoff = nextOriginX - (width - nextScaledSize) / 2;
  const nextYoff = nextOriginY - (height - nextScaledSize) / 2;

  zoomSl.value(nextZoomStep);
  updateOffsetSliderBounds(nextScaledSize);
  xoffSl.value(constrain(round(nextXoff), Number(xoffSl.elt.min), Number(xoffSl.elt.max)));
  yoffSl.value(constrain(round(nextYoff), Number(yoffSl.elt.min), Number(yoffSl.elt.max)));
  syncFromControls(true);
}

function mousePressed() {
  if (mouseButton !== LEFT || isPointerInsidePanel(mouseX, mouseY)) {
    return;
  }

  isDragging = true;
  dragStartMouseX = mouseX;
  dragStartMouseY = mouseY;
  dragStartXoff = xoff;
  dragStartYoff = yoff;
}

function mouseDragged() {
  let nextXoff;
  let nextYoff;

  if (!isDragging) {
    return;
  }

  nextXoff = dragStartXoff + (mouseX - dragStartMouseX);
  nextYoff = dragStartYoff + (mouseY - dragStartMouseY);

  xoffSl.value(constrain(round(nextXoff), Number(xoffSl.elt.min), Number(xoffSl.elt.max)));
  yoffSl.value(constrain(round(nextYoff), Number(yoffSl.elt.min), Number(yoffSl.elt.max)));
  syncFromControls(true);

  return false;
}

function mouseReleased() {
  isDragging = false;
}

function isPointerInsidePanel(pointerX, pointerY) {
  const panelRect = panel.elt.getBoundingClientRect();

  return (
    pointerX >= panelRect.left &&
    pointerX <= panelRect.right &&
    pointerY >= panelRect.top &&
    pointerY <= panelRect.bottom
  );
}

function nudgeSlider(slider, delta, needsReset) {
  const minValue = Number(slider.elt.min);
  const maxValue = Number(slider.elt.max);
  const nextValue = constrain(Number(slider.value()) + delta, minValue, maxValue);

  slider.value(nextValue);
  syncFromControls(needsReset);
}

function keyPressed() {
  switch (keyCode) {
    case 18:
      acc = !acc;
      updateStatus();
      break;
    case 32:
      adjust();
      break;
  }
}

function windowResized() {
  adjust();
}

function adjust() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayout();
  updateSliderRanges();
  syncFromControls(true);
}

function updateLayout() {
  const panelWidth = constrain(windowWidth - 24, 240, PANEL_WIDTH);
  panel.style("width", `${panelWidth}px`);
}

function updateSliderRanges() {
  const maxSize = max(600, round(min(windowWidth, windowHeight) * 1.5));

  sizeSl.attribute("max", maxSize);
  updateOffsetSliderBounds(scaledSize);

  sizeSl.value(constrain(Number(sizeSl.value()), Number(sizeSl.elt.min), maxSize));
  xoffSl.value(constrain(Number(xoffSl.value()), Number(xoffSl.elt.min), Number(xoffSl.elt.max)));
  yoffSl.value(constrain(Number(yoffSl.value()), Number(yoffSl.elt.min), Number(yoffSl.elt.max)));
}

function updateOffsetSliderBounds(viewSize) {
  const offsetRange = round(max(width, height, viewSize || 0));

  xoffSl.attribute("min", -offsetRange);
  xoffSl.attribute("max", offsetRange);
  yoffSl.attribute("min", -offsetRange);
  yoffSl.attribute("max", offsetRange);
}

function portionGen() {
  const p = random(1);
  let nx;
  let ny;

  if (p <= 0.01) {
    nx = 0;
    ny = 0.16 * y;
  } else if (p <= 0.86) {
    nx = 0.85 * x + 0.04 * y;
    ny = -0.04 * x + 0.85 * y + 1.6;
  } else if (p <= 0.93) {
    nx = 0.2 * x - 0.26 * y;
    ny = 0.23 * x + 0.22 * y + 1.6;
  } else {
    nx = -0.15 * x + 0.28 * y;
    ny = 0.26 * x + 0.24 * y + 0.44;
  }

  x = nx;
  y = ny;
}

function reset(clearCache) {
  if (clearCache) {
    cachedPointCount = 0;
    cacheWriteIndex = 0;
  }

  x = 0;
  y = 0;

  for (let i = 0; i < BURN_IN_STEPS; i++) {
    portionGen();
  }

  requestViewRedraw();
}

function randomGen() {
  const minSize = Number(sizeSl.elt.min);
  const maxSize = Number(sizeSl.elt.max);
  const xPadding = round(width * 0.18);
  const yPadding = round(height * 0.18);

  sizeSl.value(round(random(minSize, maxSize)));
  zoomSl.value(0);
  xoffSl.value(round(random(-xPadding, xPadding)));
  yoffSl.value(round(random(-yPadding, yPadding)));
  syncFromControls(true);
}
