'use strict';

/* ─────────────────────────────────────────────────
   1.  STAR CANVAS — warm amber-tinted stars
───────────────────────────────────────────────── */
(function initStarCanvas() {
  const canvas = document.getElementById('starCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, stars = [];
  const STAR_COUNT = 140;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createStar() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.4 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.0007 + 0.0002,
      phase: Math.random() * Math.PI * 2,
      warm:  Math.random() > 0.6, // warm amber tint
    };
  }

  function initStars() { stars = Array.from({ length: STAR_COUNT }, createStar); }

  function drawStars(ts) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.speed * ts + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      const a = s.alpha.toFixed(2);
      ctx.fillStyle = s.warm
        ? `rgba(255, 215, 150, ${a})`
        : `rgba(255, 245, 225, ${a})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  resize();
  initStars();
  requestAnimationFrame(drawStars);
  window.addEventListener('resize', () => { resize(); initStars(); });
})();


/* ─────────────────────────────────────────────────
   2.  CLUE DATA — shorter, more cryptic
───────────────────────────────────────────────── */
const CLUES = {
  1: {
    icon:       '✦',
    title:      'Where the Body is Temple',
    body:       'Iron bends. Bodies strengthen. Three gilded letters mark the place. Find them.',
    targetId:   'rsfBadge',
    nextScreen: '2',
  },
  2: {
    icon:       '✦',
    title:      'The Divided Horizon',
    body:       'Two worlds. One crossing. She watched it from her window as a child. The passage awaits.',
    targetId:   'bosphorusBadge',
    nextScreen: '3',
  },
  3: {
    icon:       '✦',
    title:      'The Firmament Keeps Count',
    body:       'The sky above remembers every year. Seek the number in the stars.',
    targetId:   'starField',
    nextScreen: '4',
  },
  4: {
    icon:       '✦',
    title:      'The Iron Threshold',
    body:       'All futures begin at a gate. Find the arch through which she passed.',
    targetId:   'satherGate',
    nextScreen: '5',
  },
};


/* ─────────────────────────────────────────────────
   3.  CHACHACHA SEQUENCE
   ↓ ← → → → ↑ [space] ← ← ←
   Boxes start EMPTY. Symbol revealed on correct press.
   Wrong key = all boxes cleared, reset to start.
───────────────────────────────────────────────── */
const CHACHA_SEQUENCE = [
  'ArrowDown','ArrowLeft',
  'ArrowRight','ArrowRight','ArrowRight',
  'ArrowUp',' ',
  'ArrowLeft','ArrowLeft','ArrowLeft',
];

let chachaIndex    = 0;
let chachaActive   = false;
let chachaUnlocked = false;

const keySteps    = document.querySelectorAll('.key-step');
const chachaWrong = document.getElementById('chachaWrong');
const keySeqEl    = document.getElementById('keySequence');

function enableChacha() {
  chachaIndex    = 0;
  chachaUnlocked = false;
  chachaActive   = true;
  resetKeySteps();
}

/** Clear all symbols, remove state classes */
function resetKeySteps() {
  keySteps.forEach(k => {
    k.textContent = '';           // blank — symbol only shows on correct press
    k.classList.remove('active', 'done');
  });
  if (chachaWrong) chachaWrong.classList.add('hidden');
}

/** Reveal the symbol in box i and mark it active (just-pressed) */
function revealAndActivateStep(i) {
  const step = keySteps[i];
  if (!step) return;
  step.textContent = step.dataset.symbol; // show the key symbol now
  step.classList.add('active');
}

/** Move step i from active → done */
function finalizeStep(i) {
  const step = keySteps[i];
  if (!step) return;
  step.classList.remove('active');
  step.classList.add('done');
}

/** Wrong key pressed */
function handleWrongKey() {
  if (keySeqEl) {
    keySeqEl.classList.add('error');
    setTimeout(() => keySeqEl.classList.remove('error'), 500);
  }
  if (chachaWrong) {
    chachaWrong.classList.remove('hidden');
    setTimeout(() => chachaWrong.classList.add('hidden'), 2500);
  }
  chachaIndex = 0;
  resetKeySteps();
}

/** Full sequence completed */
function chachaSuccess() {
  chachaUnlocked = true;
  chachaActive   = false;

  // Finalize last step
  finalizeStep(CHACHA_SEQUENCE.length - 1);

  const clueCard = document.getElementById('chachaClue');
  if (clueCard) clueCard.classList.add('solved');

  setTimeout(() => {
    const reveal = document.getElementById('finalVideoReveal');
    if (reveal) {
      reveal.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => reveal.classList.add('appearing'));
      });
      reveal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    launchConfetti();
  }, 700);
}

/** Global keydown for chachacha — only active on screen-5 */
document.addEventListener('keydown', e => {
  if (!chachaActive || chachaUnlocked) return;

  // Prevent scroll on used keys
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }

  const expected = CHACHA_SEQUENCE[chachaIndex];

  if (e.key === expected) {
    revealAndActivateStep(chachaIndex);

    // Brief pause, then mark done and advance
    const i = chachaIndex;
    setTimeout(() => finalizeStep(i), 220);

    chachaIndex++;

    if (chachaIndex === CHACHA_SEQUENCE.length) {
      setTimeout(chachaSuccess, 300); // slight delay for last step to finalize
    }
  } else {
    // Only punish if they've started (to avoid frustration on accidental keys)
    if (chachaIndex > 0) {
      handleWrongKey();
    }
  }
});


/* ─────────────────────────────────────────────────
   4.  STAGE ENGINE
───────────────────────────────────────────────── */
let currentStage = 0;
let clueActive   = false;

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active', 'entering');
  });
  const target = document.getElementById(screenId);
  if (!target) return;
  target.classList.remove('hidden');
  target.classList.add('active');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => target.classList.add('entering'));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'screen-5') enableChacha();
  else chachaActive = false;
}

function revealHiddenElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.add('revealed');
  el.style.display = '';
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
}

function clearHiddenElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('revealed');
  el.style.display = 'none';
}


/* ─────────────────────────────────────────────────
   5.  CLUE OVERLAY
───────────────────────────────────────────────── */
const clueOverlay = document.getElementById('clueOverlay');
const clueIcon    = document.getElementById('clueIcon');
const clueTitle   = document.getElementById('clueTitle');
const clueBody    = document.getElementById('clueBody');
const clueOkBtn   = document.getElementById('clueOkBtn');

function openClue(stage) {
  const clue = CLUES[stage];
  if (!clue) return;
  clueIcon.textContent  = clue.icon;
  clueTitle.textContent = clue.title;
  clueBody.textContent  = clue.body;
  clueOverlay.classList.remove('hidden');
  clueActive = true;

  clueOkBtn.onclick = () => {
    closeClue();
    revealHiddenElement(clue.targetId);
  };
}

function closeClue() {
  clueOverlay.classList.add('hidden');
  clueActive = false;
}

clueOverlay.addEventListener('click', e => { if (e.target === clueOverlay) closeClue(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && clueActive) closeClue(); });


/* ─────────────────────────────────────────────────
   6.  CLICK HANDLERS
───────────────────────────────────────────────── */
document.getElementById('startBtn').addEventListener('click', () => {
  currentStage = 1;
  showScreen('screen-1');
});

[1, 2, 3, 4].forEach(stage => {
  const btn = document.getElementById(`watched${stage}Btn`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'The seal is breaking…';
    setTimeout(() => openClue(stage), 600);
  });
});

function registerHiddenElementClick(elementId, stage) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.addEventListener('click', () => {
    if (!el.classList.contains('revealed')) return;
    clearHiddenElement(elementId);
    currentStage = parseInt(stage) + 1;
    showScreen(`screen-${CLUES[stage].nextScreen}`);
  });
  // Keyboard accessibility
  el.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && el.classList.contains('revealed')) {
      e.preventDefault();
      el.click();
    }
  });
}

registerHiddenElementClick('rsfBadge',       1);
registerHiddenElementClick('bosphorusBadge', 2);
registerHiddenElementClick('starField',      3);
registerHiddenElementClick('satherGate',     4);

document.getElementById('restartBtn').addEventListener('click', () => {
  currentStage   = 0;
  chachaActive   = false;
  chachaUnlocked = false;

  [1,2,3,4].forEach(stage => {
    const btn = document.getElementById(`watched${stage}Btn`);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'I have read it — reveal the clue';
    }
  });

  ['rsfBadge','bosphorusBadge','starField','satherGate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('revealed'); el.style.display = 'none'; }
  });

  const clueCard = document.getElementById('chachaClue');
  if (clueCard) clueCard.classList.remove('solved');
  const reveal = document.getElementById('finalVideoReveal');
  if (reveal) { reveal.classList.add('hidden'); reveal.classList.remove('appearing'); }

  resetKeySteps();
  stopConfetti();
  showScreen('screen-landing');
});


/* ─────────────────────────────────────────────────
   7.  CONSTELLATION DOTS (star field element)
───────────────────────────────────────────────── */
(function seedConstellationDots() {
  const container = document.getElementById('constellationDots');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement('span');
    const size = Math.random() * 2.5 + 0.8;
    dot.style.cssText = `
      position: absolute;
      left: ${Math.random() * 95}%;
      top:  ${Math.random() * 95}%;
      width:  ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: #3d2010;
      opacity: ${(Math.random() * 0.5 + 0.2).toFixed(2)};
    `;
    container.appendChild(dot);
  }
})();


/* ─────────────────────────────────────────────────
   8.  CONFETTI — burgundy/amber/cream tones
───────────────────────────────────────────────── */
const confettiContainer = document.getElementById('confettiContainer');
let confettiInterval = null;

const CONFETTI_COLORS = [
  '#8b1a1a','#b8841e','#d4a030','#e8d9b5',
  '#c8952a','#7a1a1a','#f0e2c0','#5c1010',
];

function createConfettiPiece() {
  const piece    = document.createElement('div');
  const color    = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const isStrip  = Math.random() > 0.7;
  const size     = Math.random() * 8 + 5;
  const duration = Math.random() * 3 + 2.5;
  const delay    = Math.random() * 1.5;

  piece.classList.add('confetti-piece');
  piece.style.cssText = `
    left:   ${Math.random() * 100}%;
    width:  ${isStrip ? size * 0.3 : size}px;
    height: ${isStrip ? size * 2.5 : size}px;
    background: ${color};
    border-radius: ${isStrip ? '2px' : Math.random() > 0.5 ? '50%' : '2px'};
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
    opacity: ${(Math.random() * 0.5 + 0.5).toFixed(2)};
  `;
  confettiContainer.appendChild(piece);
  setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
}

function launchConfetti() {
  for (let i = 0; i < 70; i++) createConfettiPiece();
  confettiInterval = setInterval(() => {
    for (let i = 0; i < 5; i++) createConfettiPiece();
  }, 350);
  setTimeout(stopConfetti, 8000);
}

function stopConfetti() {
  if (confettiInterval) { clearInterval(confettiInterval); confettiInterval = null; }
}


/* ─────────────────────────────────────────────────
   9.  VIDEO PLACEHOLDER CLICK FEEDBACK
───────────────────────────────────────────────── */
document.querySelectorAll('.video-placeholder').forEach(ph => {
  ph.addEventListener('click', function () {
    const medallion = this.querySelector('.play-medallion');
    if (medallion) {
      medallion.textContent = '⏸';
      setTimeout(() => { medallion.textContent = '▶'; }, 2500);
    }
    const sub = this.querySelector('.video-sub');
    if (sub) {
      sub.textContent = '(Video will be placed here once uploaded)';
      sub.style.fontStyle = 'italic';
    }
  });
});


/* ─────────────────────────────────────────────────
   10. INIT
───────────────────────────────────────────────── */
showScreen('screen-landing');
