/**
 * Color-Shift Physics: Chrono Jump
 * Core Game Engine: Procedural Neon Jumper with Time Dilation & Phase Resonance
 */

(function () {
  'use strict';

  // Palette & Phase Colors
  const COLORS = [
    { name: 'CYAN', hex: '#00f3ff', rgb: '0, 243, 255', cssVar: '--neon-cyan' },
    { name: 'MAGENTA', hex: '#ff007f', rgb: '255, 0, 127', cssVar: '--neon-magenta' },
    { name: 'LIME', hex: '#00ff66', rgb: '0, 255, 102', cssVar: '--neon-lime' }
  ];

  // Canvas & Context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const viewport = document.getElementById('viewport');

  // DOM HUD & Screen Elements
  const scoreValEl = document.getElementById('scoreVal');
  const highScoreValEl = document.getElementById('highScoreVal');
  const shiftProgressRing = document.getElementById('shiftProgressRing');
  const shiftCore = document.getElementById('shiftCore');
  const shiftLabel = document.getElementById('shiftLabel');
  const comboTag = document.getElementById('comboTag');
  const chronoBarFill = document.getElementById('chronoBarFill');
  const chronoOverlay = document.getElementById('chronoOverlay');
  const soundBtn = document.getElementById('soundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const leaderboardBtn = document.getElementById('leaderboardBtn');

  // Screens
  const startScreen = document.getElementById('startScreen');
  const btnStartGame = document.getElementById('btnStartGame');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const btnRestartGame = document.getElementById('btnRestartGame');
  const deathReasonEl = document.getElementById('deathReason');
  const finalScoreVal = document.getElementById('finalScoreVal');
  const finalHeightVal = document.getElementById('finalHeightVal');
  const finalComboVal = document.getElementById('finalComboVal');
  const finalPlatformsVal = document.getElementById('finalPlatformsVal');
  const playerNameInput = document.getElementById('playerNameInput');
  const btnSubmitScore = document.getElementById('btnSubmitScore');
  const btnViewLeaderboardFromDeath = document.getElementById('btnViewLeaderboardFromDeath');

  const leaderboardScreen = document.getElementById('leaderboardScreen');
  const leaderboardList = document.getElementById('leaderboardList');
  const btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');

  // Mobile Buttons
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnMobileChrono = document.getElementById('btnMobileChrono');

  // Hi-DPI Canvas Setup
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    gameState.viewWidth = rect.width;
    gameState.viewHeight = rect.height;
  }

  // Game Global State
  const gameState = {
    isRunning: false,
    isGameOver: false,
    viewWidth: 480,
    viewHeight: 800,
    cameraY: 0,
    targetCameraY: 0,
    maxHeightReached: 0,
    score: 0,
    platformsCleared: 0,
    comboStreak: 0,
    maxCombo: 0,
    highScore: 0,

    // Time & Chrono
    lastTimestamp: 0,
    timeScale: 1.0,
    chronoActive: false,
    chronoEnergy: 100, // 0 - 100
    maxChronoEnergy: 100,
    chronoDrainRate: 26, // per second
    chronoRechargeRate: 15, // per second

    // Color Shift Phase
    activeColorIdx: 0,
    shiftDuration: 6.0, // seconds
    shiftTimer: 6.0,
    hasWarned: false,

    // Camera Shake
    screenShake: 0,

    // Controls State
    keys: {
      left: false,
      right: false,
      chrono: false
    }
  };

  // Particles & Floating Sparks
  let particles = [];
  let shockwaves = [];
  let floatingGridPoints = [];

  // Player Definition
  const player = {
    x: 240,
    y: 650,
    prevY: 650,
    vx: 0,
    vy: -10,
    radius: 14,
    scaleX: 1,
    scaleY: 1,
    jumpForce: -12.4,
    superJumpForce: -17.2,
    gravity: 0.44,
    speed: 7.2,
    accel: 1.2,
    friction: 0.86,
    isDead: false,

    reset(startX, startY) {
      this.x = startX;
      this.y = startY;
      this.prevY = startY;
      this.vx = 0;
      this.vy = -11;
      this.scaleX = 1;
      this.scaleY = 1;
      this.isDead = false;
    }
  };

  // Platforms Array
  let platforms = [];

  class Platform {
    constructor(x, y, width, colorIdx, type = 'static') {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = 16;
      this.colorIdx = colorIdx; // 0, 1, 2
      this.type = type; // 'static', 'moving', 'super', 'glitch'
      this.vx = type === 'moving' ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0;
      this.minX = 20;
      this.maxX = gameState.viewWidth - width - 20;
      this.glitchTimer = 0;
      this.bounced = false;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
      this.pulsePhase += dt * 3;
      if (this.type === 'moving') {
        this.x += this.vx * (dt * 60);
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.vx = Math.abs(this.vx);
        } else if (this.x >= this.maxX) {
          this.x = this.maxX;
          this.vx = -Math.abs(this.vx);
        }
      }
    }

    draw(ctx, cameraY) {
      const screenY = this.y - cameraY;
      if (screenY < -40 || screenY > gameState.viewHeight + 40) return;

      const colorData = COLORS[this.colorIdx];
      const isActive = this.colorIdx === gameState.activeColorIdx;

      ctx.save();
      ctx.translate(this.x, screenY);

      if (isActive) {
        // High-energy glow for matching active color platform
        ctx.shadowColor = colorData.hex;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = colorData.hex;
        ctx.fillStyle = `rgba(${colorData.rgb}, 0.25)`;
      } else {
        // Inactive / Hazardous phase platform
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = 'rgba(120, 130, 150, 0.4)';
        ctx.fillStyle = 'rgba(25, 30, 45, 0.4)';
      }

      // Rounded neon platform bar
      ctx.lineWidth = 2.5;
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(this.width - r, 0);
      ctx.quadraticCurveTo(this.width, 0, this.width, r);
      ctx.lineTo(this.width, this.height - r);
      ctx.quadraticCurveTo(this.width, this.height, this.width - r, this.height);
      ctx.lineTo(r, this.height);
      ctx.quadraticCurveTo(0, this.height, 0, this.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Platform Core detail line
      if (isActive) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.width * 0.2, 4, this.width * 0.6, 2);
      } else {
        // Glitch dash pattern for hazard
        ctx.strokeStyle = 'rgba(255, 60, 80, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 10; i < this.width - 10; i += 16) {
          ctx.moveTo(i, 4);
          ctx.lineTo(i + 8, this.height - 4);
        }
        ctx.stroke();
      }

      // Super Jump Pad indicator
      if (this.type === 'super') {
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, 4 + Math.sin(this.pulsePhase) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Generate Platform Field
  function initPlatforms() {
    platforms = [];
    const startY = gameState.viewHeight - 80;

    // Guaranteed safe starting platform under player
    platforms.push(new Platform(gameState.viewWidth / 2 - 60, startY, 120, gameState.activeColorIdx, 'static'));

    let currentY = startY - 75;
    while (currentY > -1000) {
      spawnPlatformAt(currentY);
      currentY -= 65 + Math.random() * 35;
    }
  }

  function spawnPlatformAt(yPos) {
    const width = Math.max(70, 115 - Math.min(gameState.platformsCleared * 0.3, 35));
    const xPos = 25 + Math.random() * (gameState.viewWidth - width - 50);

    // Color distribution: Bias towards active color or next phase
    let colorIdx;
    const roll = Math.random();
    if (roll < 0.48) {
      colorIdx = gameState.activeColorIdx;
    } else if (roll < 0.75) {
      colorIdx = (gameState.activeColorIdx + 1) % 3;
    } else {
      colorIdx = (gameState.activeColorIdx + 2) % 3;
    }

    // Platform type
    let type = 'static';
    const typeRoll = Math.random();
    if (typeRoll < 0.28 && Math.abs(yPos) > 400) {
      type = 'moving';
    } else if (typeRoll < 0.38) {
      type = 'super';
    }

    platforms.push(new Platform(xPos, yPos, width, colorIdx, type));
  }

  // Particle System
  function createJumpBurst(x, y, colorHex, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;
      const speed = 2 + Math.random() * 5.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: colorHex,
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.02
      });
    }
  }

  function createDeathShatter(x, y, colorHex) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: i % 2 === 0 ? colorHex : '#ffffff',
        alpha: 1.0,
        decay: 0.02
      });
    }
    // Shockwave
    shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 100,
      color: colorHex,
      alpha: 1.0
    });
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (dt * 60);
      p.y += p.vy * (dt * 60);
      p.vy += 0.15; // particle gravity
      p.alpha -= p.decay * (dt * 60);

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.15 * (dt * 60);
      s.alpha -= 0.04 * (dt * 60);
      if (s.alpha <= 0) {
        shockwaves.splice(i, 1);
      }
    }
  }

  function drawParticles(ctx, cameraY) {
    // Shockwaves
    shockwaves.forEach(s => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(s.x, s.y - cameraY, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Particles
    particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y - cameraY, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Background Cyber Grid Drawing
  function initCyberGrid() {
    floatingGridPoints = [];
    for (let i = 0; i < 35; i++) {
      floatingGridPoints.push({
        x: Math.random() * 500,
        y: Math.random() * 1500,
        size: 1 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.4,
        speed: 0.2 + Math.random() * 0.4
      });
    }
  }

  function drawCyberBackground(ctx, cameraY) {
    const width = gameState.viewWidth;
    const height = gameState.viewHeight;

    // Ambient tint depending on active color
    const activeCol = COLORS[gameState.activeColorIdx];
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#040711');
    grad.addColorStop(1, '#080d1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Parallax Grid Lines
    ctx.save();
    ctx.strokeStyle = `rgba(${activeCol.rgb}, 0.05)`;
    ctx.lineWidth = 1;

    const gridSize = 45;
    const offsetY = (-cameraY * 0.3) % gridSize;

    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Floating data specks
    floatingGridPoints.forEach(pt => {
      const renderY = ((pt.y - cameraY * pt.speed) % height + height) % height;
      ctx.fillStyle = activeCol.hex;
      ctx.globalAlpha = pt.alpha;
      ctx.fillRect(pt.x, renderY, pt.size, pt.size);
    });
    ctx.restore();
  }

  // Draw Player Orb
  function drawPlayer(ctx, cameraY) {
    if (player.isDead) return;

    const screenY = player.y - cameraY;
    const activeColor = COLORS[gameState.activeColorIdx];

    ctx.save();
    ctx.translate(player.x, screenY);
    ctx.scale(player.scaleX, player.scaleY);

    // Outer Aura
    ctx.shadowColor = activeColor.hex;
    ctx.shadowBlur = gameState.chronoActive ? 28 : 18;

    // Orb body gradient
    const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, player.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, activeColor.hex);
    grad.addColorStop(1, '#050a18');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cyber core inner ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Chrono field rings when slow-mo is active
    if (gameState.chronoActive) {
      ctx.strokeStyle = COLORS[1].hex; // Magenta time-warp ripple
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 6 + Math.sin(Date.now() * 0.015) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Color Shift Cycle Mechanism
  function updateColorPhase(dt) {
    gameState.shiftTimer -= dt;

    // Warning sound / visual tick when ~1.5s remaining
    if (gameState.shiftTimer <= 1.5 && !gameState.hasWarned) {
      gameState.hasWarned = true;
      window.soundEngine.playWarningTick();
    }

    // Phase Change triggered!
    if (gameState.shiftTimer <= 0) {
      gameState.activeColorIdx = (gameState.activeColorIdx + 1) % 3;
      gameState.shiftTimer = gameState.shiftDuration;
      gameState.hasWarned = false;

      // Audio & UI
      window.soundEngine.playColorShift(gameState.activeColorIdx);
      updateColorUI();

      // Screen flash of new color
      shockwaves.push({
        x: gameState.viewWidth / 2,
        y: player.y,
        radius: 20,
        maxRadius: 350,
        color: COLORS[gameState.activeColorIdx].hex,
        alpha: 0.8
      });
    }

    // Update progress ring on HUD
    const fraction = Math.max(0, gameState.shiftTimer / gameState.shiftDuration);
    const circumference = 2 * Math.PI * 25; // 157.08
    shiftProgressRing.style.strokeDashoffset = (1 - fraction) * circumference;
  }

  function updateColorUI() {
    const active = COLORS[gameState.activeColorIdx];
    document.documentElement.style.setProperty('--color-active', active.hex);
    shiftProgressRing.style.stroke = active.hex;
    shiftCore.style.background = active.hex;
    shiftCore.style.boxShadow = `0 0 16px ${active.hex}`;
    shiftLabel.innerText = `${active.name} PHASE`;
    shiftLabel.style.color = active.hex;
    shiftLabel.style.textShadow = `0 0 10px ${active.hex}`;
  }

  // Update Chrono (Slow-Motion) Engine
  function updateChrono(dt) {
    const wantsChrono = gameState.keys.chrono && gameState.chronoEnergy > 5;

    if (wantsChrono && !gameState.chronoActive) {
      gameState.chronoActive = true;
      gameState.timeScale = 0.45; // 50% slow-motion physics
      viewport.classList.add('chrono-active');
      window.soundEngine.startChronoDilation();
    } else if ((!wantsChrono || gameState.chronoEnergy <= 0) && gameState.chronoActive) {
      gameState.chronoActive = false;
      gameState.timeScale = 1.0;
      viewport.classList.remove('chrono-active');
      window.soundEngine.stopChronoDilation();
    }

    // Energy drain / recharge
    if (gameState.chronoActive) {
      // Drain using real-world unscaled time
      gameState.chronoEnergy = Math.max(0, gameState.chronoEnergy - gameState.chronoDrainRate * dt);
    } else {
      gameState.chronoEnergy = Math.min(gameState.maxChronoEnergy, gameState.chronoEnergy + gameState.chronoRechargeRate * dt);
    }

    // Update UI bar
    const pct = (gameState.chronoEnergy / gameState.maxChronoEnergy) * 100;
    chronoBarFill.style.width = `${pct}%`;
  }

  // Player & World Physics Loop
  function updatePhysics(dt) {
    player.prevY = player.y;

    // Horizontal Movement
    if (gameState.keys.left) {
      player.vx = Math.max(-player.speed, player.vx - player.accel);
    } else if (gameState.keys.right) {
      player.vx = Math.min(player.speed, player.vx + player.accel);
    } else {
      player.vx *= player.friction;
    }

    player.x += player.vx * (dt * 60);

    // Screen wrap-around horizontal
    if (player.x < -10) {
      player.x = gameState.viewWidth + 10;
    } else if (player.x > gameState.viewWidth + 10) {
      player.x = -10;
    }

    // Vertical Gravity & Velocity
    player.vy += player.gravity * (dt * 60);
    player.y += player.vy * (dt * 60);

    // Squash & Stretch Recovery
    player.scaleX += (1 - player.scaleX) * 0.15;
    player.scaleY += (1 - player.scaleY) * 0.15;

    // Trail particles
    if (Math.abs(player.vy) > 2 && Math.random() < 0.45) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 8,
        y: player.y + player.radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 1.5,
        radius: 2 + Math.random() * 2,
        color: COLORS[gameState.activeColorIdx].hex,
        alpha: 0.7,
        decay: 0.05
      });
    }

    // Platform Collisions (Only while falling downwards)
    if (player.vy > 0) {
      for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];
        const playerBottom = player.y + player.radius;
        const playerPrevBottom = player.prevY + player.radius;

        // Check if player's feet passed through platform top surface
        if (
          player.x + player.radius * 0.7 >= plat.x &&
          player.x - player.radius * 0.7 <= plat.x + plat.width &&
          playerBottom >= plat.y &&
          playerPrevBottom <= plat.y + 16
        ) {
          // Collision detected! Check Phase Resonance:
          if (plat.colorIdx === gameState.activeColorIdx) {
            // SAFE RESONANCE BOUNCE!
            player.y = plat.y - player.radius;
            const isSuper = plat.type === 'super';
            player.vy = isSuper ? player.superJumpForce : player.jumpForce;

            // Squash animation
            player.scaleX = 1.35;
            player.scaleY = 0.68;

            // Visuals & Sound
            window.soundEngine.playJump(isSuper);
            createJumpBurst(player.x, plat.y, COLORS[plat.colorIdx].hex, isSuper ? 22 : 12);

            // Combo streak logic
            if (!plat.bounced) {
              plat.bounced = true;
              gameState.platformsCleared++;
              gameState.comboStreak++;
              if (gameState.comboStreak > gameState.maxCombo) {
                gameState.maxCombo = gameState.comboStreak;
              }

              if (gameState.comboStreak >= 2) {
                comboTag.innerText = `x${gameState.comboStreak} COMBO!`;
                comboTag.classList.add('active');
                window.soundEngine.playCombo(gameState.comboStreak);
              }
            }

            break;
          } else {
            // COLOR DESYNC! Player stepped on inactive/wrong color platform!
            triggerGameOver("NOTO'G'RI RANGGA TEGDI (COLOR DESYNC)");
            return;
          }
        }
      }
    }

    // Check if player fell below bottom screen threshold
    if (player.y - gameState.cameraY > gameState.viewHeight + 80) {
      triggerGameOver("BO'SHLIQQA QULADI (VOID COLLAPSE)");
      return;
    }

    // Smooth Camera Follow (Tracks highest point)
    const targetCamY = player.y - gameState.viewHeight * 0.58;
    if (targetCamY < gameState.cameraY) {
      gameState.cameraY = targetCamY;
    }

    // Update altitude score
    const currentMeters = Math.max(0, Math.floor(-gameState.cameraY / 12));
    if (currentMeters > gameState.maxHeightReached) {
      gameState.maxHeightReached = currentMeters;
      gameState.score = gameState.maxHeightReached * 10 + gameState.platformsCleared * 25 + gameState.maxCombo * 50;
      scoreValEl.innerText = gameState.score;
    }

    // Procedural Platform Management & Garbage Collection
    // Recycle platforms that fell too far below the camera
    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      p.update(dt);

      if (p.y - gameState.cameraY > gameState.viewHeight + 150) {
        platforms.splice(i, 1);
      }
    }

    // Spawn new platforms above camera
    const highestPlatY = platforms.reduce((min, p) => Math.min(min, p.y), 999999);
    if (highestPlatY > gameState.cameraY - 250) {
      const nextY = highestPlatY - (60 + Math.random() * 40);
      spawnPlatformAt(nextY);
    }
  }

  // Game Over Handler
  function triggerGameOver(reason) {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    gameState.isRunning = false;
    player.isDead = true;

    // Audio & Screen shake
    window.soundEngine.playGameOver();
    window.soundEngine.stopChronoDilation();
    gameState.screenShake = 16;

    createDeathShatter(player.x, player.y, COLORS[gameState.activeColorIdx].hex);

    // Save High Score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      try {
        localStorage.setItem('chrono_jump_highscore', gameState.highScore.toString());
      } catch (e) {}
      highScoreValEl.innerText = gameState.highScore;
    }

    // Display Game Over Screen
    deathReasonEl.innerText = reason;
    finalScoreVal.innerText = gameState.score;
    finalHeightVal.innerText = `${gameState.maxHeightReached}m`;
    finalComboVal.innerText = `x${gameState.maxCombo || 1}`;
    finalPlatformsVal.innerText = gameState.platformsCleared;

    setTimeout(() => {
      gameOverScreen.classList.remove('hidden');
    }, 700);
  }

  // Restart / Reset Game
  function startGame() {
    gameState.isRunning = true;
    gameState.isGameOver = false;
    gameState.cameraY = 0;
    gameState.maxHeightReached = 0;
    gameState.score = 0;
    gameState.platformsCleared = 0;
    gameState.comboStreak = 0;
    gameState.maxCombo = 0;
    gameState.chronoEnergy = 100;
    gameState.chronoActive = false;
    gameState.shiftTimer = gameState.shiftDuration;
    gameState.activeColorIdx = 0;

    particles = [];
    shockwaves = [];

    scoreValEl.innerText = '0';
    comboTag.classList.remove('active');
    updateColorUI();

    initPlatforms();
    player.reset(gameState.viewWidth / 2, gameState.viewHeight - 140);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');

    window.soundEngine.init();
  }

  // Main Render Loop
  function gameLoop(timestamp) {
    if (!gameState.lastTimestamp) gameState.lastTimestamp = timestamp;
    const realDt = Math.min((timestamp - gameState.lastTimestamp) / 1000, 0.1);
    gameState.lastTimestamp = timestamp;

    if (gameState.isRunning && !gameState.isGameOver) {
      // Scaled delta time for physics / platforms (time dilation)
      const physicsDt = realDt * gameState.timeScale;

      updateChrono(realDt);
      updateColorPhase(physicsDt);
      updatePhysics(physicsDt);
      updateParticles(physicsDt);
    } else {
      updateParticles(realDt);
    }

    // Screen Shake decay
    if (gameState.screenShake > 0) {
      gameState.screenShake *= 0.88;
      if (gameState.screenShake < 0.2) gameState.screenShake = 0;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, gameState.viewWidth, gameState.viewHeight);

    // Apply Camera Shake offset
    ctx.save();
    if (gameState.screenShake > 0) {
      const sx = (Math.random() - 0.5) * gameState.screenShake;
      const sy = (Math.random() - 0.5) * gameState.screenShake;
      ctx.translate(sx, sy);
    }

    // Render Scene
    drawCyberBackground(ctx, gameState.cameraY);

    // Draw Platforms
    platforms.forEach(plat => plat.draw(ctx, gameState.cameraY));

    // Draw Particles
    drawParticles(ctx, gameState.cameraY);

    // Draw Player
    drawPlayer(ctx, gameState.cameraY);

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    window.soundEngine.init();

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      gameState.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      gameState.keys.right = true;
    } else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      gameState.keys.chrono = true;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      gameState.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      gameState.keys.right = false;
    } else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      gameState.keys.chrono = false;
    }
  });

  // Mobile Touch Controls
  function bindTouch(btn, onDown, onUp) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.soundEngine.init();
      onDown();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      onUp();
    }, { passive: false });

    btn.addEventListener('mousedown', () => {
      window.soundEngine.init();
      onDown();
    });
    btn.addEventListener('mouseup', onUp);
    btn.addEventListener('mouseleave', onUp);
  }

  bindTouch(btnLeft, () => gameState.keys.left = true, () => gameState.keys.left = false);
  bindTouch(btnRight, () => gameState.keys.right = true, () => gameState.keys.right = false);
  bindTouch(btnMobileChrono, () => {
    gameState.keys.chrono = true;
    btnMobileChrono.classList.add('pressed');
  }, () => {
    gameState.keys.chrono = false;
    btnMobileChrono.classList.remove('pressed');
  });

  // Sound and BGM Toggle
  soundBtn.addEventListener('click', () => {
    window.soundEngine.init();
    const muted = window.soundEngine.toggleMute();
    soundIcon.innerHTML = muted 
      ? '<line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>'
      : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
  });

  // Leaderboard Modal
  async function showLeaderboard() {
    leaderboardScreen.classList.remove('hidden');
    leaderboardList.innerHTML = '<div style="text-align:center; padding: 20px; color:#8a99ad;">Yuklanmoqda...</div>';

    const scores = await window.leaderboardClient.getTopScores(10);
    if (!scores || scores.length === 0) {
      leaderboardList.innerHTML = '<div style="text-align:center; padding: 20px; color:#8a99ad;">Hozircha natijalar yo\'q. Birinchi bo\'ling!</div>';
      return;
    }

    leaderboardList.innerHTML = scores.map((item, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
      return `
        <div class="leaderboard-item ${rankClass}">
          <div class="player-info">
            <span class="rank">#${rank}</span>
            <span class="name">${item.player_name || 'CyberRunner'}</span>
          </div>
          <span class="leaderboard-score">${item.score} pts</span>
        </div>
      `;
    }).join('');
  }

  leaderboardBtn.addEventListener('click', showLeaderboard);
  btnViewLeaderboardFromDeath.addEventListener('click', showLeaderboard);
  btnCloseLeaderboard.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden');
  });

  // Submit Score to Supabase
  btnSubmitScore.addEventListener('click', async () => {
    const name = playerNameInput.value.trim() || 'CyberRunner';
    btnSubmitScore.disabled = true;
    btnSubmitScore.innerText = 'YUBORILMOQDA...';

    await window.leaderboardClient.submitScore(name, gameState.score, Math.floor(gameState.maxHeightReached / 50) + 1);

    btnSubmitScore.innerText = 'SAQLANDI!';
    setTimeout(() => {
      showLeaderboard();
    }, 400);
  });

  // Start & Restart Buttons
  btnStartGame.addEventListener('click', startGame);
  btnRestartGame.addEventListener('click', startGame);

  // Initialize
  window.addEventListener('resize', resizeCanvas);

  function boot() {
    // Load local high score
    try {
      const saved = localStorage.getItem('chrono_jump_highscore');
      if (saved) {
        gameState.highScore = parseInt(saved, 10) || 0;
        highScoreValEl.innerText = gameState.highScore;
      }
    } catch (e) {}

    resizeCanvas();
    initCyberGrid();
    updateColorUI();

    requestAnimationFrame(gameLoop);
  }

  boot();
})();
