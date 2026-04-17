'use strict';

/* ─────────────────────────────────────────────────
   1.  STAR CANVAS
───────────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function mkStar() { return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + .3, alpha: Math.random(), speed: Math.random() * .0006 + .0002, phase: Math.random() * Math.PI * 2, warm: Math.random() > .5 }; }
  function init() { stars = Array.from({ length: 130 }, mkStar); }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.alpha = .25 + .75 * Math.abs(Math.sin(s.speed * ts + s.phase));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.warm ? `rgba(255,215,150,${s.alpha.toFixed(2)})` : `rgba(255,245,225,${s.alpha.toFixed(2)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize(); init(); requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); init(); });
})();


/* ─────────────────────────────────────────────────
   2.  PHASE 1: WORD SEARCH (13x13)
───────────────────────────────────────────────── */
const GRID_DATA = [
  ['Q', 'P', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'L', 'K'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V'],
  ['B', 'N', 'M', 'T', 'R', 'E', 'B', 'L', 'A', 'Q', 'W', 'E', 'R'], /* ALBERT reversed */
  ['T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J'],
  ['K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Q', 'W', 'E', 'R'],
  ['T', 'Y', 'U', 'I', 'O', 'F', 'R', 'E', 'D', 'D', 'Y', 'S', 'A'], /* FREDDY */
  ['D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N'],
  ['M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'R', 'O', 'P', 'A', 'S', 'D'], /* SETOR diagonal */
  ['F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'O', 'C', 'V', 'B', 'N'],
  ['M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'T', 'P', 'A', 'S'],
  ['D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'E', 'B', 'N'],
  ['M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'S', 'D'],
  ['F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const TARGET_WORDS = ['ALBERT', 'FREDDY', 'SETOR'];
let foundWords = [];
let selStart = null;
let selCells = [];
let wordSearchDrag = false;

function buildGrid() {
  const container = document.getElementById('wordGrid');
  if (!container) return;
  container.innerHTML = '';
  foundWords = [];

  GRID_DATA.forEach((row, r) => {
    row.forEach((letter, c) => {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.textContent = letter;
      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.addEventListener('mousedown', e => { e.preventDefault(); startSel(r, c); });
      cell.addEventListener('mouseenter', () => { if (wordSearchDrag) extendSel(r, c); });

      // Touch support
      cell.addEventListener('touchstart', e => { e.preventDefault(); startSel(r, c); wordSearchDrag = true; }, { passive: false });
      cell.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('grid-cell')) extendSel(+el.dataset.r, +el.dataset.c);
      }, { passive: false });

      container.appendChild(cell);
    });
  });

  document.addEventListener('mouseup', endSel);
  document.addEventListener('touchend', endSel);
}

function getCell(r, c) { return document.querySelector(`#wordGrid .grid-cell[data-r="${r}"][data-c="${c}"]`); }

function startSel(r, c) {
  wordSearchDrag = true;
  selStart = { r, c };
  selCells = [{ r, c }];
  clearSelecting();
  getCell(r, c)?.classList.add('selecting');
}

function extendSel(r, c) {
  if (!wordSearchDrag || !selStart) return;
  const dr = r - selStart.r;
  const dc = c - selStart.c;

  const isHoriz = dr === 0, isVert = dc === 0, isDiag = Math.abs(dr) === Math.abs(dc);
  if (!isHoriz && !isVert && !isDiag) return;

  const len = Math.max(Math.abs(dr), Math.abs(dc));
  const stepR = len === 0 ? 0 : dr / len;
  const stepC = len === 0 ? 0 : dc / len;

  const newSel = [];
  for (let i = 0; i <= len; i++) {
    newSel.push({ r: selStart.r + Math.round(i * stepR), c: selStart.c + Math.round(i * stepC) });
  }

  clearSelecting();
  selCells = newSel;
  newSel.forEach(pos => {
    const cell = getCell(pos.r, pos.c);
    if (cell && !cell.classList.contains('found')) cell.classList.add('selecting');
  });
}

function endSel() {
  if (!wordSearchDrag) return;
  wordSearchDrag = false;
  checkSelection();
  clearSelecting();
}

function clearSelecting() { document.querySelectorAll('#wordGrid .grid-cell.selecting').forEach(c => c.classList.remove('selecting')); }

function checkSelection() {
  const word = selCells.map(pos => GRID_DATA[pos.r][pos.c]).join('');
  const wordRev = word.split('').reverse().join('');

  TARGET_WORDS.forEach(t => {
    if ((word === t || wordRev === t) && !foundWords.includes(t)) {
      foundWords.push(t);
      const matchWord = (word === t) ? selCells : [...selCells].reverse();
      matchWord.forEach(pos => getCell(pos.r, pos.c)?.classList.add('found'));

      document.getElementById('wordsFoundCount').textContent = foundWords.length;
      document.getElementById('foundWordsList').textContent = foundWords.join('  ·  ');

      if (foundWords.length === TARGET_WORDS.length) {
        document.getElementById('proceed1Btn').classList.remove('hidden');
      }
    }
  });
}

/* ─────────────────────────────────────────────────
   3.  PHASE 2: BERKELEY PATH DRAG & DROP
───────────────────────────────────────────────── */
const BERKELEY_ORDER = ["Haste St", "Blackwell Hall", "Telegraph", "Sather Gate", "Wheeler Hall", "Campanile", "Glade", "East Asian Library", "Menchies"];

function initBerkeleyDragDrop() {
  const bank = document.getElementById('dragBank');
  const track = document.getElementById('dragTrack');
  if (!bank || !track) return;

  // Create 9 slots
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.classList.add('drop-slot');
    slot.dataset.index = i + 1;
    track.appendChild(slot);
  }

  // Jumble labels and put in bank
  const shuffled = [...BERKELEY_ORDER].sort(() => Math.random() - 0.5);
  shuffled.forEach(label => {
    const item = document.createElement('div');
    item.classList.add('drag-item');
    item.draggable = true;
    item.textContent = label;
    item.id = 'drag-' + label.replace(/\s+/g, '');
    bank.appendChild(item);
  });

  // Drag listeners
  let draggedItem = null;

  document.querySelectorAll('.drag-item').forEach(item => {
    item.addEventListener('dragstart', function (e) {
      draggedItem = this;
      setTimeout(() => this.style.opacity = '0.5', 0);
    });
    item.addEventListener('dragend', function () {
      setTimeout(() => this.style.opacity = '1', 0);
      draggedItem = null;
    });
  });

  document.querySelectorAll('.drop-slot, .drag-bank').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      // Allow dropping in empty slot, or back into bank
      if (zone.classList.contains('drag-bank') || !zone.hasChildNodes()) {
        zone.classList.add('drag-over');
      }
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');

      // If dropping on a slot that already has an item, return that item to bank
      if (zone.classList.contains('drop-slot') && zone.hasChildNodes()) {
        const existingItem = zone.firstChild;
        bank.appendChild(existingItem);
      }

      // Drop new item
      if (draggedItem) zone.appendChild(draggedItem);

      checkBerkeleyOrder();
    });
  });
}

function checkBerkeleyOrder() {
  const slots = document.querySelectorAll('.drop-slot');
  let currentOrder = [];
  slots.forEach(slot => {
    if (slot.firstChild) currentOrder.push(slot.firstChild.textContent);
  });

  if (currentOrder.length === BERKELEY_ORDER.length) {
    const isCorrect = currentOrder.every((val, idx) => val === BERKELEY_ORDER[idx]);
    if (isCorrect) {
      document.getElementById('proceed2Btn').classList.remove('hidden');
    } else {
      showWrongPickToast("— Path wanders astray. Try again. —");
    }
  }
}

/* ─────────────────────────────────────────────────
   4.  PHASE 3: TURKEY CONNECTION MAP
───────────────────────────────────────────────── */
function initTurkeyMap() {
  const drawingCanvas = document.getElementById('drawingCanvas');
  const line = document.getElementById('connectionLine');
  const izmir = document.getElementById('loc-izmir');
  const istanbul = document.getElementById('loc-istanbul');

  if (!drawingCanvas || !izmir || !istanbul) return;

  let isDrawingMap = false;

  const getElementCenter = (el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  // Start on Izmir
  izmir.addEventListener('mousedown', (e) => { e.preventDefault(); startLine(); });
  izmir.addEventListener('touchstart', (e) => { e.preventDefault(); startLine(); }, { passive: false });

  function startLine() {
    isDrawingMap = true;
    line.classList.add('drawing');
    line.classList.remove('success');
    const startPos = getElementCenter(izmir);
    line.setAttribute('x1', startPos.x); line.setAttribute('y1', startPos.y);
    line.setAttribute('x2', startPos.x); line.setAttribute('y2', startPos.y);
  }

  // Move
  document.addEventListener('mousemove', (e) => {
    if (isDrawingMap) { line.setAttribute('x2', e.clientX); line.setAttribute('y2', e.clientY); }
  });
  document.addEventListener('touchmove', (e) => {
    if (isDrawingMap) { const t = e.touches[0]; line.setAttribute('x2', t.clientX); line.setAttribute('y2', t.clientY); }
  }, { passive: false });

  // Release
  const handleMapEnd = (cursorX, cursorY) => {
    if (!isDrawingMap) return;
    isDrawingMap = false;

    // Check if cursor is over Istanbul
    const elUnder = document.elementFromPoint(cursorX, cursorY);
    if (elUnder && (elUnder === istanbul || istanbul.contains(elUnder))) {
      // Success
      const endPos = getElementCenter(istanbul);
      line.setAttribute('x2', endPos.x); line.setAttribute('y2', endPos.y);
      line.classList.add('success');
      document.getElementById('proceed3Btn').classList.remove('hidden');
    } else {
      // Failed
      line.classList.remove('drawing'); // hide line
      if (elUnder && elUnder.closest('.map-item.decoy')) {
        showWrongPickToast("— Not all paths lead home. —");
      }
    }
  };

  document.addEventListener('mouseup', e => handleMapEnd(e.clientX, e.clientY));
  document.addEventListener('touchend', e => {
    if (isDrawingMap && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      handleMapEnd(t.clientX, t.clientY);
    }
  });
}

function showWrongPickToast(msg) {
  const toast = document.getElementById('wrongPickToast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 2200);
}


/* ─────────────────────────────────────────────────
   5.  PHASE 4: CHACHACHA & FINALE
───────────────────────────────────────────────── */
// Adjusted 'Space' to 'ArrowDown'
const CHACHA_SEQ = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft'];
let chachaIndex = 0;
let chachaUnlocked = false;

document.addEventListener('keydown', e => {
  const s4 = document.getElementById('screen-4');
  if (!s4 || s4.classList.contains('hidden') || chachaUnlocked) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();

  const steps = document.querySelectorAll('.key-step');
  if (e.key === CHACHA_SEQ[chachaIndex]) {
    const step = steps[chachaIndex];
    step.textContent = step.dataset.symbol;
    step.classList.add('active');
    const i = chachaIndex;
    setTimeout(() => { steps[i].classList.remove('active'); steps[i].classList.add('done'); }, 200);

    chachaIndex++;
    if (chachaIndex === CHACHA_SEQ.length) {
      chachaUnlocked = true;
      setTimeout(unlockFinalVideo, 400);
    }
  } else if (chachaIndex > 0) {
    const seqEl = document.getElementById('keySequence');
    seqEl?.classList.add('error');
    setTimeout(() => seqEl?.classList.remove('error'), 500);
    const wrong = document.getElementById('chachaWrong');
    wrong?.classList.remove('hidden');
    setTimeout(() => wrong?.classList.add('hidden'), 2500);
    chachaIndex = 0;
    steps.forEach(s => { s.textContent = ''; s.classList.remove('active', 'done'); });
  }
});

function unlockFinalVideo() {
  const reveal = document.getElementById('finalVideoReveal');
  reveal.classList.remove('hidden');
  requestAnimationFrame(() => reveal.classList.add('appearing'));
  reveal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  launchConfetti();
}

/* ─────────────────────────────────────────────────
   6.  EXPLOSION OUTRO
───────────────────────────────────────────────── */
document.getElementById('finishExperienceBtn').addEventListener('click', () => {
  const whiteout = document.getElementById('outroWhiteout');
  whiteout.classList.remove('hidden');
  requestAnimationFrame(() => whiteout.classList.add('exploding'));
});


/* ─────────────────────────────────────────────────
   7.  STAGE ENGINE & CLUES
───────────────────────────────────────────────── */
const CLUE_TEXTS = {
  1: { title: 'Folio I', body: 'Find those who shaped your strength. Seek out three names.' },
  2: { title: 'Folio II', body: 'Retrace her footsteps across the stone. Arrange the path.' },
  3: { title: 'Folio III', body: 'Connect the origin to the passage. Draw the line.' },
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');

  if (id === 'screen-1') { buildGrid(); document.getElementById('videoContainer1').classList.add('hidden'); }
  if (id === 'screen-2') { initBerkeleyDragDrop(); document.getElementById('videoContainer2').classList.add('hidden'); }
  if (id === 'screen-3') { initTurkeyMap(); document.getElementById('videoContainer3').classList.add('hidden'); }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('startBtn').addEventListener('click', () => showScreen('screen-1'));

// On completing trials: Show video
document.getElementById('proceed1Btn').addEventListener('click', () => {
  document.getElementById('stage1Trial').classList.add('hidden');
  document.getElementById('videoContainer1').classList.remove('hidden');
  // Set up passage to next stage
  setTimeout(() => {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-watched';
    nextBtn.style.marginTop = '1rem';
    nextBtn.textContent = "Proceed to Folio II";
    nextBtn.onclick = () => showScreen('screen-2');
    document.getElementById('videoContainer1').appendChild(nextBtn);
  }, 1000);
});

document.getElementById('proceed2Btn').addEventListener('click', () => {
  document.getElementById('stage2Trial').classList.add('hidden');
  document.getElementById('videoContainer2').classList.remove('hidden');
  setTimeout(() => {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-watched';
    nextBtn.style.marginTop = '1rem';
    nextBtn.textContent = "Proceed to Folio III";
    nextBtn.onclick = () => showScreen('screen-3');
    document.getElementById('videoContainer2').appendChild(nextBtn);
  }, 1000);
});

document.getElementById('proceed3Btn').addEventListener('click', () => {
  document.getElementById('connectionLine').classList.remove('drawing', 'success'); // clear line
  document.getElementById('stage3Trial').classList.add('hidden');
  document.getElementById('videoContainer3').classList.remove('hidden');
  setTimeout(() => {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-watched';
    nextBtn.style.marginTop = '1rem';
    nextBtn.textContent = "Proceed to the Sealed Entry";
    nextBtn.onclick = () => showScreen('screen-4');
    document.getElementById('videoContainer3').appendChild(nextBtn);
  }, 1000);
});

/* CONFETTI */
const COLORS = ['#8b1a1a', '#b8841e', '#d4a030', '#e8d9b5'];
function launchConfetti() {
  const cont = document.getElementById('confettiContainer');
  const iv = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('div');
      const sz = Math.random() * 8 + 5;
      p.className = 'confetti-piece';
      p.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;background:${COLORS[Math.floor(Math.random() * COLORS.length)]};animation-duration:${Math.random() * 2 + 2}s;`;
      cont.appendChild(p); setTimeout(() => p.remove(), 4000);
    }
  }, 300);
  setTimeout(() => clearInterval(iv), 8000);
}

/* ─────────────────────────────────────────────────
   8.  SKIP SEQUENCE
───────────────────────────────────────────────── */
const SKIP_SEQ = ['s', 'k', 'i', 'p'];
let skipSeqIndex = 0;

document.addEventListener('keydown', e => {
  if (!e.key) return;
  if (e.key.toLowerCase() === SKIP_SEQ[skipSeqIndex]) {
    skipSeqIndex++;
    if (skipSeqIndex === SKIP_SEQ.length) {
      skipSeqIndex = 0;
      const activeScreen = document.querySelector('.screen:not(.hidden)');
      if (activeScreen) {
        if (activeScreen.id === 'screen-1') {
          const trial = document.getElementById('stage1Trial');
          if (trial && !trial.classList.contains('hidden')) {
            document.getElementById('proceed1Btn').click();
          }
        } else if (activeScreen.id === 'screen-2') {
          const trial = document.getElementById('stage2Trial');
          if (trial && !trial.classList.contains('hidden')) {
            document.getElementById('proceed2Btn').click();
          }
        } else if (activeScreen.id === 'screen-3') {
          const trial = document.getElementById('stage3Trial');
          if (trial && !trial.classList.contains('hidden')) {
            document.getElementById('proceed3Btn').click();
          }
        } else if (activeScreen.id === 'screen-4') {
          if (!chachaUnlocked) {
            chachaUnlocked = true;
            document.querySelectorAll('.key-step').forEach(s => s.classList.add('done'));
            unlockFinalVideo();
          }
        }
      }
    }
  } else {
    skipSeqIndex = e.key.toLowerCase() === 's' ? 1 : 0;
  }
});

// Start
showScreen('screen-landing');
