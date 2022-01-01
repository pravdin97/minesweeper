const ROWS = 9;
const COLS = 8;
const CELL_SIZE = 50;
const container = document.getElementById('container');
const restartButton = document.getElementById('restart');

let cells;
let map;
let revealedKeys;
let flaggedKeys;
let failedBombKey;

function toKey(row, col) {
  return row + '-' + col;
}

function fromKey(key) {
  return key.split('-').map(Number);
}

function createButtons() {
  container.style.width = COLS * CELL_SIZE + 'px';
  container.style.height = ROWS * CELL_SIZE + 'px';
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const cell = document.createElement('button');
      cell.style.width = CELL_SIZE + 'px';
      cell.style.height = CELL_SIZE + 'px';
      container.appendChild(cell);
      const key = toKey(i, j);
      cells.set(key, cell);

      cell.onclick = () => {
        if (failedBombKey !== null) {
          return;
        }
        if (flaggedKeys.has(key)) {
          return;
        }
        revealCells(key);
        updateButtons();
      };

      cell.oncontextmenu = (e) => {
        e.preventDefault();
        if (failedBombKey !== null) {
          return;
        }
        toggleFlag(key);
        updateButtons();
      };
    }
  }

  restartButton.onclick = startGame;
}

function startGame() {
  map = generateMap(generateBombs());
  revealedKeys = new Set();
  flaggedKeys = new Set();
  failedBombKey = null;

  if (cells) {
    updateButtons();
  } else {
    cells = new Map();
    createButtons();
  }
}

function revealCells(key) {
  if (map.get(key) === 'bomb') {
    failedBombKey = key;
  }
  propagateReveal(key, new Set());
}

function getButtonProps(cell, value) {
  if (value === undefined) {
  } else if (value === 1) {
    cell.textContent = '1';
    cell.style.color = 'blue';
  } else if (value === 2) {
    cell.textContent = '2';
    cell.style.color = 'green';
  } else if (value >= 3) {
    cell.textContent = value;
    cell.style.color = 'red';
  } else {
    throw Error('should never happen');
  }
}

function updateButtons() {
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const key = toKey(i, j);
      const cell = cells.get(key);
      cell.disabled = false;
      cell.textContent = '';
      cell.style.backgroundColor = '';
      cell.style.color = 'black';

      const value = map.get(key);

      if (failedBombKey !== null && value === 'bomb') {
        cell.disabled = true;
        cell.textContent = '💣️';

        if (failedBombKey === key) {
          cell.style.backgroundColor = 'red';
        }
      } else if (revealedKeys.has(key)) {
        cell.disabled = true;

        getButtonProps(cell, value);
      } else if (flaggedKeys.has(key)) {
        cell.textContent = '🚩️';
      }
    }
  }
  if (failedBombKey !== null) {
    container.style.pointerEvents = 'none';
    restartButton.style.display = 'block';
  } else {
    container.style.pointerEvents = '';
    restartButton.style.display = '';
  }
}

function toggleFlag(key) {
  if (flaggedKeys.has(key)) {
    flaggedKeys.delete(key);
  } else {
    flaggedKeys.add(key);
  }
}

function propagateReveal(key, visited) {
  revealedKeys.add(key);
  visited.add(key);

  const isEmpty = !map.has(key);
  if (isEmpty) {
    flaggedKeys.delete(key);
    for (const neighborKey of getNeighbors(key)) {
      if (!visited.has(neighborKey)) {
        propagateReveal(neighborKey, visited);
      }
    }
  }
}

function isInBounds([row, col]) {
  if (row < 0 || col < 0) {
    return false;
  }
  if (row >= ROWS || col >= COLS) {
    return false;
  }

  return true;
}

function getNeighbors(key) {
  const [row, col] = fromKey(key);
  return [
    [row - 1, col - 1],
    [row - 1, col],
    [row - 1, col + 1],
    [row, col + 1],
    [row + 1, col + 1],
    [row + 1, col],
    [row + 1, col - 1],
    [row, col - 1],
  ]
    .filter(isInBounds)
    .map(([r, c]) => toKey(r, c));
}

function generateMap(seedBombs) {
  const map = new Map();

  function incrementDanger(neighborKey) {
    if (!map.has(neighborKey)) {
      map.set(neighborKey, 1);
    } else {
      const oldVal = map.get(neighborKey);
      if (oldVal !== 'bomb') {
        map.set(neighborKey, oldVal + 1);
      }
    }
  }

  for (const key of seedBombs) {
    map.set(key, 'bomb');
    for (const neighborKey of getNeighbors(key)) {
      incrementDanger(neighborKey);
    }
  }

  return map;
}

function generateBombs() {
  const count = Math.round(Math.sqrt(ROWS * COLS));

  const allKeys = [];
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      allKeys.push(toKey(i, j));
    }
  }

  allKeys.sort(() => (Math.random() > 0.5 ? 1 : -1));

  return allKeys.slice(0, count);
}

startGame();
