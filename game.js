const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const actionButton = document.querySelector('#action');
const statusText = document.querySelector('#status');
const scoreText = document.querySelector('#score');
const bestText = document.querySelector('#bestScore');

const width = canvas.width;
const height = canvas.height;
const playerScreenX = 220;
const platforms = [];
const player = { x: 170, y: 0, width: 31, height: 39, velocityY: 0, grounded: true };
const hills = Array.from({ length: 12 }, (_, index) => ({
  x: index * 130,
  y: 265 + Math.sin(index * 1.7) * 32,
  radius: 100 + (index % 3) * 22
}));

let mode = 'ready';
let cameraX = 0;
let distance = 0;
let best = Number(localStorage.getItem('gapjump-best') || 0);
let previousTime = 0;
let elapsed = 0;

bestText.textContent = formatScore(best);

function formatScore(value) {
  return Math.floor(value).toString().padStart(4, '0');
}

function resetWorld() {
  platforms.length = 0;
  platforms.push({ x: 0, width: 700, y: 420 });
  player.x = 170;
  player.y = platforms[0].y - player.height;
  player.velocityY = 0;
  player.grounded = true;
  cameraX = 0;
  distance = 0;
  scoreText.textContent = formatScore(0);
  extendWorld();
}

function extendWorld() {
  while (platforms[platforms.length - 1].x < cameraX + width + 900) {
    const last = platforms[platforms.length - 1];
    const gap = 88 + Math.random() * 75;
    const platformWidth = 210 + Math.random() * 240;
    const platformY = Math.max(340, Math.min(450, last.y + (Math.random() - 0.5) * 80));
    platforms.push({ x: last.x + last.width + gap, width: platformWidth, y: platformY });
  }
}

function startOrJump() {
  if (mode === 'ready' || mode === 'over') {
    resetWorld();
    mode = 'running';
    statusText.textContent = 'Keep your rhythm. Mind the gaps.';
    actionButton.innerHTML = 'Jump <span aria-hidden="true">↑</span>';
    return;
  }
  if (player.grounded) {
    player.velocityY = -690;
    player.grounded = false;
  }
}

function endRun() {
  mode = 'over';
  const finalScore = Math.floor(distance / 10);
  if (finalScore > best) {
    best = finalScore;
    localStorage.setItem('gapjump-best', String(best));
    bestText.textContent = formatScore(best);
  }
  statusText.textContent = `Run ended at ${formatScore(finalScore)}. Go again?`;
  actionButton.innerHTML = 'Run again <span aria-hidden="true">↗</span>';
}

function update(delta) {
  if (mode !== 'running') return;

  const oldBottom = player.y + player.height;
  const speed = Math.min(360 + distance * 0.018, 520);
  player.x += speed * delta;
  player.velocityY += 1850 * delta;
  player.y += player.velocityY * delta;
  player.grounded = false;

  for (const platform of platforms) {
    const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const newBottom = player.y + player.height;
    if (overlapsX && oldBottom <= platform.y && newBottom >= platform.y && player.velocityY >= 0) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.grounded = true;
      break;
    }
  }

  cameraX = Math.max(0, player.x - playerScreenX);
  distance = Math.max(0, player.x - 170);
  scoreText.textContent = formatScore(distance / 10);
  extendWorld();

  while (platforms.length > 3 && platforms[1].x + platforms[1].width < cameraX - 150) {
    platforms.shift();
  }
  if (player.y > height + 80) endRun();
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#d8dcad');
  sky.addColorStop(1, '#9db58f');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#f6e8aa';
  context.beginPath();
  context.arc(760, 115, 54, 0, Math.PI * 2);
  context.fill();

  for (const hill of hills) {
    const x = ((hill.x - cameraX * 0.22) % (width + 280) + width + 280) % (width + 280) - 110;
    context.fillStyle = '#8da98a';
    context.beginPath();
    context.ellipse(x, hill.y, hill.radius, 90, 0, Math.PI, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = 'rgba(23, 37, 35, 0.09)';
  context.fillRect(0, 0, width, height);
}

function drawPlatform(platform) {
  const x = platform.x - cameraX;
  if (x > width || x + platform.width < 0) return;
  context.fillStyle = '#244b43';
  context.fillRect(x, platform.y, platform.width, height - platform.y + 30);
  context.fillStyle = '#d4e27b';
  context.fillRect(x, platform.y, platform.width, 8);
  context.fillStyle = 'rgba(243, 237, 219, 0.16)';
  for (let stripe = 0; stripe < platform.width; stripe += 34) {
    context.fillRect(x + stripe + 5, platform.y + 19, 2, Math.max(0, height - platform.y - 28));
  }
}

function drawPlayer() {
  const x = player.x - cameraX;
  const bob = player.grounded && mode === 'running' ? Math.sin(elapsed * 17) * 2 : 0;
  const y = player.y + bob;

  context.fillStyle = 'rgba(23, 37, 35, 0.2)';
  context.beginPath();
  context.ellipse(x + player.width / 2, player.y + player.height + 5, 22, 5, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#f16e50';
  context.beginPath();
  context.roundRect(x + 3, y + 9, 25, 28, 8);
  context.fill();
  context.fillStyle = '#f3eddb';
  context.beginPath();
  context.arc(x + 21, y + 17, 2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#172523';
  context.fillRect(x + 6, y + 36, 7, 4);
  context.fillRect(x + 21, y + 36, 7, 4);
  context.fillStyle = '#f3eddb';
  context.fillRect(x + 3, y + 39, 11, 3);
  context.fillRect(x + 18, y + 39, 11, 3);
}

function drawOverlay() {
  if (mode === 'running') return;
  context.fillStyle = 'rgba(23, 37, 35, 0.24)';
  context.fillRect(0, 0, width, height);
  context.textAlign = 'center';
  context.fillStyle = '#f3eddb';
  context.font = '700 58px "Space Grotesk", sans-serif';
  context.fillText(mode === 'ready' ? 'GAP / JUMP' : 'NICE TRY', width / 2, 225);
  context.fillStyle = '#d4e27b';
  context.font = '500 14px "DM Mono", monospace';
  context.fillText(mode === 'ready' ? 'ONE BUTTON. OPEN ROAD.' : 'THE NEXT RUN IS YOURS.', width / 2, 258);
}

function draw() {
  drawBackground();
  for (const platform of platforms) drawPlatform(platform);
  if (mode !== 'ready') drawPlayer();
  drawOverlay();
}

function frame(time) {
  const delta = Math.min((time - previousTime) / 1000 || 0, 0.04);
  previousTime = time;
  elapsed = time / 1000;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

actionButton.addEventListener('click', startOrJump);
canvas.addEventListener('pointerdown', () => {
  if (mode === 'running') startOrJump();
});
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) startOrJump();
  }
});

resetWorld();
requestAnimationFrame(frame);