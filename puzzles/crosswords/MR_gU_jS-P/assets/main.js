const canvas = document.getElementById('crossword-canvas');
const ctx = canvas.getContext('2d'); // Get the 2D rendering context
const acrossClueList = document.getElementById('across-clue-list');
const downClueList = document.getElementById('down-clue-list');
const crosswordNumber = document.getElementById('crossword-number');
const crosswordContainer = document.getElementById('crossword-container');

const gridCellSize = 40; // Size of each cell in pixels
const gridXOffset = 20; // Offset to position the grid within the canvas
const gridYOffset = 20; // Offset to position the grid within the canvas
const cluesYOffset = 20; // Offset between grid and clues section
const cluesHeight = 60; // Height of the clues section in pixels
const keyboardCellSize = 25; // Size of each key cell in pixels
const keyboardCellGap = 5; // Gap between keyboard cells in pixels

const keys = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']]; // Keyboard layout
//['←','→','↑','↓',]]; // Keyboard layout

let computedCluesYOffset = 0; // Computed offset based on canvas width and clues section width
let computedGridXOffset = 0; // Computed offset based on canvas width and grid size
let keyboardHeight = 0; // Height of the keyboard section
let keyboardYOffset = 0; // Y Offset for the keyboard section
let keyboardXOffset = 0; // X Offset for the keyboard section
let keyboardwidth = 0; // Width of the keyboard section
let writeRowMode = true; // Flag to indicate if we are in write row mode or column mode
let activeCellRow = null;
let activeCellCol = null;

function initializePuzzle(data) {

    console.log('Initializing puzzle...');

    computedGridXOffset = (canvas.width - (data.grid[0].length * gridCellSize)) / 2;
    computedCluesYOffset = gridYOffset + (data.grid.length * gridCellSize) + cluesYOffset;

    keyboardHeight = keys.length * (keyboardCellSize + keyboardCellGap) + 10; // Calculate keyboard height based on number of rows and cell size
    keyboardYOffset = computedCluesYOffset + keyboardHeight; // Offset for the keyboard section
    keyboardXOffset = (canvas.width - (keys[0].length * (keyboardCellSize + keyboardCellGap) + 10)) / 2; // Center the keyboard in the canvas
    keyboardwidth = keys[0].length * (keyboardCellSize + keyboardCellGap) + 10; // Calculate keyboard width based on number of columns and cell size
    

    renderGrid(data.grid);
    //renderCluesHtml(data.clues);
    renderKeyboardCanvas();

    // Attach event listener to the canvas, not individual cells
    canvas.addEventListener('click', handleCanvasClick);

    document.addEventListener('keydown', handleKeyPress);
}

function isPuzzleSolved(gridData) {
    return gridData.every(row => row.every(cell => cell.isBlackSquare || (cell.userEnteredLetter && cell.isCorrect)));
}

function renderGrid(gridData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    solved = isPuzzleSolved(gridData);

    gridData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const x = colIndex * gridCellSize + computedGridXOffset;
            const y = rowIndex * gridCellSize + gridYOffset;

            if (cell.isBlackSquare) {
                ctx.fillStyle = 'black';
                ctx.fillRect(x, y, gridCellSize, gridCellSize);
            } else {
                ctx.strokeStyle = 'black'; // Cell border
                ctx.strokeRect(x, y, gridCellSize, gridCellSize); // Draw cell border
                if (writeRowMode && activeCellRow === rowIndex || !writeRowMode && activeCellCol === colIndex) {
                    ctx.fillStyle = 'lightblue'; // Highlight active row
                }
                else {
                    ctx.fillStyle = 'white'; // Default cell background color
                }
                if (solved) {
                    ctx.fillStyle = 'lightgreen'; // puzzle is solved, override fill color
                }
                ctx.fillRect(x, y, gridCellSize, gridCellSize); // Fill cell background

                // Draw the clue index in the cell, if any
                if (cell.acrossNumber || cell.downNumber) {
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
                    ctx.fillText(cell.userEnteredLetter, x + gridCellSize / 2, y + gridCellSize / 2);
                }
            }
        });
    });
    if (activeCellRow !== null && activeCellCol !== null) {
        highlightActiveCell();
    }
}

function renderCluesHtml(cluesData) {
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

function drawWords(context, x, y, maxWidth, lineHeight, rectHeight, words) {
    var line = ""
    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " "
        var metrics = context.measureText(testLine)
        var testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y)
            line = words[n] + " "
            y += lineHeight
        } else {
            line = testLine
        }
    }
    context.fillText(line, x, y)
    rectHeight = rectHeight + lineHeight
}

// write clue of active row in canvas
function renderCluesCanvas(cluesData) {

    ctx.clearRect(0, computedCluesYOffset, canvas.width, cluesHeight); // Clear the canvas clues area
    ctx.fillStyle = 'white'; //'lightblue'; // Fill background for clues area
    ctx.fillRect(0, computedCluesYOffset, canvas.width, cluesHeight); // Fill clues area background
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black'; // Text color for clues
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let yOffset = computedCluesYOffset + 10; // Starting Y offset for clues
    if (writeRowMode) {
        clue = cluesData.across[activeCellRow]
    } else {
        clue = cluesData.down[activeCellCol]
    }
    text = `${clue.number}. ${clue.clue}`;
    var words = text.split(" ")
    drawWords(ctx, 10, yOffset, canvas.width - 20, 15, cluesHeight, words); // Draw the clue text in the clues area
}

function renderKeyboardCanvas(pressedkey='') {
    // render the keyboard in canvas
    ctx.clearRect(keyboardXOffset, keyboardYOffset, keyboardwidth, keyboardHeight); // Clear the canvas 
    ctx.fillStyle = 'white'; // Fill background color
    ctx.fillRect(keyboardXOffset, keyboardYOffset, keyboardwidth, keyboardHeight); // Fill background

    keys.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const x = colIndex * (keyboardCellSize + keyboardCellGap) + keyboardXOffset + 6;
            const y = rowIndex * (keyboardCellSize + keyboardCellGap) + keyboardYOffset + 6;
            letter = keys[rowIndex][colIndex];
            if (letter !== '') {
                ctx.strokeStyle = 'black'; // Cell border
                ctx.strokeRect(x, y, keyboardCellSize, keyboardCellSize); // Draw cell border
                ctx.fillStyle = 'lightgray';
                ctx.fillRect(x, y, keyboardCellSize, keyboardCellSize); // Fill cell background
                ctx.font = '14px Arial';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(letter, x + keyboardCellSize / 2, y + keyboardCellSize / 2);
            }
        })
    })
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();

    // deal with clicks in the grid area
    const x = event.clientX - rect.left - computedGridXOffset;
    const y = event.clientY - rect.top - gridYOffset;

    const col = Math.floor(x / gridCellSize);
    const row = Math.floor(y / gridCellSize);

    if (row >= 0 && row < puzzleData.grid.length && col >= 0 && col < puzzleData.grid[0].length && !puzzleData.grid[row][col].isBlackSquare) {
        if (row == activeCellRow && col == activeCellCol) {
            // If the clicked cell is already active, toggle the write mode
            writeRowMode = !writeRowMode;
        }
        setActiveCell(row, col);
        renderGrid(puzzleData.grid);
        renderCluesCanvas(puzzleData.clues); // Render clues for the active cell
    }

    // deal with clicks in the keyboard area
    const keyboardX = event.clientX - rect.left - keyboardXOffset;
    const keyboardY = event.clientY - rect.top - keyboardYOffset;
    const keyboardCol = Math.floor(keyboardX / (keyboardCellSize + keyboardCellGap));
    const keyboardRow = Math.floor(keyboardY / (keyboardCellSize + keyboardCellGap));
    if (keyboardRow >= 0 && keyboardRow < keys.length && keyboardCol >= 0 && keyboardCol < keys[0].length) {
        const letter = keys[keyboardRow][keyboardCol];
        // If the clicked key is backspace, handle it separately
        if (letter === '⌫') {
            // Simulate a backspace event
            const backspaceEvent = new KeyboardEvent('keydown', {
                key: 'Backspace',
                code: 'Backspace',
                keyCode: 8,
                which: 8,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(backspaceEvent);
        }
        if (letter !== '') {
            // Simulate a key press event for the clicked letter
            const keyEvent = new KeyboardEvent('keydown', {
                key: letter,
                code: `Key${letter}`,
                keyCode: letter.charCodeAt(0),
                which: letter.charCodeAt(0),
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(keyEvent);
        }
    }
    renderKeyboardCanvas();
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
        const x = activeCellCol * gridCellSize + computedGridXOffset;
        const y = activeCellRow * gridCellSize + gridYOffset;

        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, gridCellSize, gridCellSize);
        ctx.lineWidth = 1; // Reset line width
    }
}

function handleKeyPress(event) {
    if (activeCellRow !== null && activeCellCol !== null) {
        const key = event.key.toUpperCase();
        // Prevent default behavior for keys that are not letters
        if (event.keyCode == 8 || event.keyCode == 46) { // Backspace or Delete key
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
            renderCluesCanvas(puzzleData.clues); // Render clues for the active cell
            renderKeyboardCanvas(); // Redraw the keyboard
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
            else {
                puzzleData.grid[activeCellRow][activeCellCol].isCorrect = false;
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
            renderCluesCanvas(puzzleData.clues); // Render clues for the active cell
            renderKeyboardCanvas(key); // Redraw the keyboard with the pressed key
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
    grid[0][0].acrossNumber = 1;
    grid[0][0].downNumber = 1;
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