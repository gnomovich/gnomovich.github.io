const canvas = document.getElementById('crossword-canvas');
const ctx = canvas.getContext('2d'); // Get the 2D rendering context
const acrossClueList = document.getElementById('across-clue-list');
const downClueList = document.getElementById('down-clue-list');
const crosswordNumber = document.getElementById('crossword-number');
const crosswordContainer = document.getElementById('crossword-container');

const cellSize = 40; // Size of each cell in pixels
const gridXOffset = 20; // Offset to position the grid within the canvas
const gridYOffset = 20;

let writeRowMode = true; // Flag to indicate if we are in write row mode or column mode
let activeCellRow = null;
let activeCellCol = null;

function initializePuzzle(data) {
  renderGrid(data.grid);
  renderClues(data.clues);

  // Attach event listener to the canvas, not individual cells
  canvas.addEventListener('click', handleCanvasClick);

  //document.addEventListener('keypress', handleKeyPress);
  document.addEventListener('keydown', handleKeyPress);
}

function isPuzzleSolved(gridData) {
    return gridData.every(row => row.every(cell => cell.isBlackSquare || (cell.userEnteredLetter && cell.isCorrect)));
}

function renderGrid(gridData) {
    console.log('Rendering grid...');
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  solved = isPuzzleSolved(gridData);

  gridData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * cellSize + gridXOffset;
      const y = rowIndex * cellSize + gridYOffset;

      if (cell.isBlackSquare) {
        ctx.fillStyle = 'black';
        ctx.fillRect(x, y, cellSize, cellSize);
      } else {
        ctx.strokeStyle = 'black'; // Cell border
        ctx.strokeRect(x, y, cellSize, cellSize); // Draw cell border
        if (writeRowMode && activeCellRow === rowIndex || !writeRowMode && activeCellCol === colIndex) {
            ctx.fillStyle = 'lightblue'; // Highlight active row
        }
        else {
            ctx.fillStyle = 'white'; // Default cell background color
        }
        if (solved) {
            ctx.fillStyle = 'lightgreen'; // puzzle is solved, override fill color
        }
        ctx.fillRect(x, y, cellSize, cellSize); // Fill cell background

        // Draw the clue index in the cell, if any
        if (cell.acrossNumber || cell.downNumber) {
            console.log(` coord (${x}, ${y})`);
          ctx.font = '12px Arial';
          ctx.fillStyle = 'gray';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(cell.acrossNumber || cell.downNumber, x + 2, y + 12);
        }

        // Draw the user entered letter, if any
        if (cell.userEnteredLetter) {
          ctx.font = '24px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.userEnteredLetter, x + cellSize / 2, y + cellSize / 2);
        }
      }
    });
  });
   if (activeCellRow !== null && activeCellCol !== null) {
        highlightActiveCell();
    }
}

function renderClues(cluesData) {
  acrossClueList.innerHTML = '';
  downClueList.innerHTML = '';

  cluesData.across.forEach(clue => {
    const clueItem = document.createElement('li');
    clueItem.textContent = `${clue.number}. ${clue.clue}`;
    acrossClueList.appendChild(clueItem);
  });

  cluesData.down.forEach(clue => {
    const clueItem = document.createElement('li');
    clueItem.textContent = `${clue.number}. ${clue.clue}`;
    downClueList.appendChild(clueItem);
  });
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left - gridXOffset;
  const y = event.clientY - rect.top - gridYOffset;

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < puzzleData.grid.length && col >= 0 && col < puzzleData.grid[0].length && !puzzleData.grid[row][col].isBlackSquare) {
    if (row == activeCellRow && col == activeCellCol) {
        // If the clicked cell is already active, toggle the write mode
        writeRowMode = !writeRowMode;
    }
    setActiveCell(row, col);
    renderGrid(puzzleData.grid);
  }
}

function setActiveCell(row, col) {
    activeCellRow = row;
    activeCellCol = col;
    if (activeCellRow !== null && activeCellCol !== null) {
        // Redraw the previous active cell to remove the highlight
        //renderGrid(puzzleData.grid);
    }
    //highlightActiveCell();
}

function highlightActiveCell() {
    if (activeCellRow !== null && activeCellCol !== null) {
        const x = activeCellCol * cellSize + gridXOffset;
        const y = activeCellRow * cellSize + gridYOffset;

        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cellSize, cellSize);
        ctx.lineWidth = 1; // Reset line width
    }
}

function handleKeyPress(event) {
  if (activeCellRow !== null && activeCellCol !== null) {
    const key = event.key.toUpperCase();
    // Prevent default behavior for keys that are not letters
    if (event.keyCode==8 || event.keyCode==46) { // Backspace or Delete key
        // Clear the letter in the active cell
        puzzleData.grid[activeCellRow][activeCellCol].userEnteredLetter = '';
        if (writeRowMode) {
            // Move to the next cell in the row
            if (activeCellCol > 0) {
            setActiveCell(activeCellRow, activeCellCol - 1);
            }
        } else {
            // Move to the next cell in the column
            if (activeCellRow > 0) {
            setActiveCell(activeCellRow - 1, activeCellCol);
            }
        }        
        renderGrid(puzzleData.grid); // Redraw the grid to show the cleared cell
        event.preventDefault(); // Prevent default behavior
        return;
        }

    if (key.length !== 1 || !/^[A-ZÇ]$/.test(key)) {
        event.preventDefault(); // Prevent default behavior for non-letter keys
        return;
    }
    if (key.match(/[A-ZÇ]/)) {
      puzzleData.grid[activeCellRow][activeCellCol].userEnteredLetter = key;
      if (puzzleData.grid[activeCellRow][activeCellCol].letter === key) {
        puzzleData.grid[activeCellRow][activeCellCol].isCorrect = true;
      }
      //Logic to move to the next cell.
        if (writeRowMode) {
            // Move to the next cell in the row
            if (activeCellCol < puzzleData.grid[0].length - 1) {
            setActiveCell(activeCellRow, activeCellCol + 1);
            }
        } else {
            // Move to the next cell in the column
            if (activeCellRow < puzzleData.grid.length - 1) {
            setActiveCell(activeCellRow + 1, activeCellCol);
            }
        }
        renderGrid(puzzleData.grid); // Redraw the grid to show the letter
    }
  }
}


// empty puzzle data for testing
function get_empty_data(rows, cols) {
  grid = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => ({
      letter: '',
      isBlackSquare: false,
      acrossNumber: null,
      downNumber: null,
      isCorrect: false,
      userEnteredLetter: ''
    }))
  );
  grid[0][0].acrossNumber=1;
  grid[0][0].downNumber=1;
  return { grid, clues: { across: [{ number: 1, clue: 'Bodies of water', startRow: 0, startCol: 0, length: 5 }], down: [{ number: 1, clue: 'Season', startRow: 0, startCol: 0, length: 5 }] } };
}

function loadPuzzleData(src) {
  // load puzze from json file
    fetch(src)
        .then(response => response.json())
        .then(data => {
        puzzleData = data;
        initializePuzzle(puzzleData);
        crosswordNumber.textContent = `Puzzle #${puzzleData.number}`;
        })
        .catch(error => {
        console.error('Error loading puzzle data:', error);
        crosswordContainer.innerHTML = '<p>Erro a carregar o puzzle.</p>';
        // Load empty data for testing
        // puzzleData = get_empty_data(5, 5);
        // initializePuzzle(puzzleData);
        });
}