// swap current tile with a random time from stack
// set to 1 for a snowflake
let swapProbability = 0.0;
let randomness = 0.005;
let offsetY = -0.12;

let F = (n, f) => [...Array(n | 0)].map((_, i) => f(i));
let W = 100;
let H = (W / 1.732) | 0;
let g = F(H, (_) => F(W, (_) => 0));
let szW, szH;
let current = [(W * 0.5) | 0, (H * (0.5 + offsetY / 2)) | 0];
let stack = [current];

function setup() {
  createCanvas(400, 400);
  noStroke();
  szW = width / W;
  szH = szW * 1.732;
  makeOutline();
  setG(...current, 1);
  while (!processMaze());
}

function sdfTriangle(uv, r) {
  const k = Math.sqrt(3.0);
  uv[0] = Math.abs(uv[0]) - r;
  uv[1] = uv[1] + r / k;
  if (uv[0] + k * uv[1] > 0.0) {
    const tempX = uv[0] - k * uv[1];
    const tempY = -k * uv[0] - uv[1];
    uv[0] = tempX / 2.0;
    uv[1] = tempY / 2.0;
  }
  uv[0] -= Math.min(Math.max(uv[0], -2.0 * r), 0.0);
  return -Math.sqrt(uv[0] * uv[0] + uv[1] * uv[1]) * Math.sign(uv[1]);
}

function healOutline() {
  F(H, (j) =>
    F(W, (i) => {
      let me = getG(i, j);
      let neighCount = countCloseNeigh(i, j);
      if (!me && neighCount == 2) setG(i, j, 1);
    })
  );
}

function makeOutline() {
  F(H, (j) =>
    F(W, (i) => {
      let uv = getUV(i, j);
      let [u, v] = uv;
      let tr1 = sdfTriangle([u, v - offsetY], 0.53);
      let tr2 = sdfTriangle([u, -v + offsetY], 0.868);
      if (-Math.max(tr1, tr2) < 0.0016) setG(i, j, 1);
      else setG(i, j, 0);
    })
  );
  F(5, (_) => healOutline());
}

function getUV(i, j) {
  return [i / W, j / H].map((d) => d * 2 - 1);
}

function getFitness(i, j) {
  let uv = getUV(i, j);
  let [u, v] = uv;
  return sdfTriangle([u, -v - offsetY], 0.868) + Math.random() * randomness;
}

function getTileFlip(i, j) {
  return !!((i + j) % 2);
}

function mod(x, m) {
  return ((x % m) + m) % m;
}

function getG(i, j) {
  i = mod(i, W);
  j = mod(j, H);
  return g[j][i];
}

function setG(i, j, value) {
  i = mod(i, W);
  j = mod(j, H);
  if (value == 1) drawTile(i, j);
  else drawTile(i, j, "black");
  g[j][i] = value;
}

function checkAvailability(i, j) {
  let ns = countThreeNeighGroups(i, j);
  return Math.min(...ns) == 0;
}

function countCloseNeigh(i, j) {
  let ns = getCloseNeigh(i, j);
  return getG(...ns[0]) + getG(...ns[1]) + getG(...ns[2]);
}

function getCloseNeigh(i, j) {
  let flip = getTileFlip(i, j);
  let ns = [];
  ns.push([mod(i - 1, W), mod(j, H)]);
  ns.push([mod(i + 1, W), mod(j, H)]);
  if (flip) {
    ns.push([mod(i, W), mod(j + 1, H)]);
  } else {
    ns.push([mod(i, W), mod(j - 1, H)]);
  }
  return ns;
}

function countThreeNeighGroups(i, j) {
  let hex1 = 0,
    hex2 = 0,
    hex3 = 0;
  let flip = getTileFlip(i, j);

  for (let x = 0; x <= 2; x++) {
    for (let y = -1 + flip; y <= 0 + flip; y++) {
      hex1 += getG(i + x, j + y);
    }
  }
  for (let x = -2; x <= 0; x++) {
    for (let y = -1 + flip; y <= 0 + flip; y++) {
      hex2 += getG(i + x, j + y);
    }
  }
  for (let x = -1; x <= 1; x++) {
    for (let y = 0 - flip; y <= 1 - flip; y++) {
      hex3 += getG(i + x, j + y);
    }
  }

  return [hex1, hex2, hex3];
}

function mod(x, m) {
  return ((x % m) + m) % m;
}

function mod(x, m) {
  return ((x % m) + m) % m;
}

function swapCurrentWithRandomStack() {
  if (stack.length == 0) return current;
  let id = (Math.random() * stack.length) | 0;
  let newCurrent = stack[id];
  stack[id] = current;
  current = newCurrent;
  return newCurrent;
}

// returns true if done
function processMaze() {
  let [cx, cy] = current;
  let availableNeighbors = getCloseNeigh(cx, cy).filter(([nx, ny]) =>
    checkAvailability(nx, ny)
  );

  if (availableNeighbors.length > 0) {
    let bestNeighbor = availableNeighbors[0];
    let bestFitness = getFitness(bestNeighbor[0], bestNeighbor[1]);
    for (let i = 1; i < availableNeighbors.length; i++) {
      let [nx, ny] = availableNeighbors[i];
      let currentFitness = getFitness(nx, ny);
      if (currentFitness > bestFitness) {
        bestNeighbor = [nx, ny];
        bestFitness = currentFitness;
      }
    }

    setG(bestNeighbor[0], bestNeighbor[1], 1);
    stack.push(current);
    current = bestNeighbor;
  } else if (stack.length > 0) {
    current = stack.pop();
  } else {
    return true;
  }
  if (Math.random() < swapProbability) {
    swapCurrentWithRandomStack();
  }
  return false;
}

function drawTile(i, j, col = "white") {
  fill(col);
  let x = i * szW + szW / 2;
  let y = j * szH + szH / 2;
  let flip = getTileFlip(i, j);
  if (flip) {
    triangle(x - szW, y + szH / 2, x + szW, y + szH / 2, x, y - szH / 2);
  } else {
    triangle(x - szW, y - szH / 2, x + szW, y - szH / 2, x, y + szH / 2);
  }
}
