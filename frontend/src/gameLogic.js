// Basic Go Logic

const getNeighbors = (row, col, size) => {
    const neighbors = [];
    if (row > 0) neighbors.push([row - 1, col]);
    if (row < size - 1) neighbors.push([row + 1, col]);
    if (col > 0) neighbors.push([row, col - 1]);
    if (col < size - 1) neighbors.push([row, col + 1]);
    return neighbors;
};

// Count liberties for a group connected to (row, col)
// Returns { liberties: number, group: Array<[r, c]> }
export const getGroupLiberties = (board, row, col) => {
    const color = board[row][col];
    if (!color) return { liberties: 0, group: [] };

    const size = board.length;
    const group = [];
    const visited = new Set();
    const stack = [[row, col]];
    const liberties = new Set();

    while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        group.push([r, c]);

        getNeighbors(r, c, size).forEach(([nr, nc]) => {
            const neighborColor = board[nr][nc];
            if (neighborColor === null) {
                liberties.add(`${nr},${nc}`);
            } else if (neighborColor === color && !visited.has(`${nr},${nc}`)) {
                stack.push([nr, nc]);
            }
        });
    }

    return { liberties: liberties.size, group };
};

// Check for captures after a move at (row, col) by 'player'
// Returns { newBoard: 2D array, captured: number }
export const checkCaptures = (board, row, col, player) => {
    const size = board.length;
    const opponent = player === 'black' ? 'white' : 'black';
    let capturedCount = 0;
    let newBoard = board.map(r => [...r]); // Copy
    const neighbors = getNeighbors(row, col, size);

    // Check opponent neighbors for capture
    neighbors.forEach(([nr, nc]) => {
        if (newBoard[nr][nc] === opponent) {
            const { liberties, group } = getGroupLiberties(newBoard, nr, nc);
            if (liberties === 0) {
                // Capture group
                group.forEach(([gr, gc]) => {
                    newBoard[gr][gc] = null;
                    capturedCount++;
                });
            }
        }
    });

    // Check suicide (if self has no liberties after captures)
    const { liberties } = getGroupLiberties(newBoard, row, col);
    if (liberties === 0) {
        // Illegal move (suicide) - simplified rule: mostly normally forbidden
        // For now, we will return original board and signal invalid? 
        // Or strictly follow rules: usually forbidden unless it captures (which we handled above)
        // If we captured something, we might have liberties now.
        // But if liberties is still 0 after removing trapped opponents, then it is suicide.
        // We already removed captured opponents from newBoard.
        return { newBoard: board, captured: -1 }; // -1 indicates invalid suicide
    }

    return { newBoard, captured: capturedCount };
};
