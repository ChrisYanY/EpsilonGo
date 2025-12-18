
# Basic Go rules in Python for backend validation/AI helpers

def get_neighbors(row, col, size):
    neighbors = []
    if row > 0: neighbors.append((row - 1, col))
    if row < size - 1: neighbors.append((row + 1, col))
    if col > 0: neighbors.append((row, col - 1))
    if col < size - 1: neighbors.append((row, col + 1))
    return neighbors

def get_group_liberties(board, row, col):
    size = len(board)
    color = board[row][col]
    if color is None:
        return 0, []
    
    group = []
    visited = set()
    stack = [(row, col)]
    liberties = set()
    
    while stack:
        r, c = stack.pop()
        if (r, c) in visited:
            continue
        visited.add((r, c))
        group.append((r, c))
        
        for nr, nc in get_neighbors(r, c, size):
            n_color = board[nr][nc]
            if n_color is None:
                liberties.add((nr, nc))
            elif n_color == color and (nr, nc) not in visited:
                stack.append((nr, nc))
                
    return len(liberties), group

def resolve_captures(board, row, col, player):
    # Determine captured stones after placing 'player' at (row, col)
    # Returns (captured_count, new_board)
    # Assumes move is already placed on 'board'
    
    size = len(board)
    opponent = 'white' if player == 'black' else 'black'
    captured_count = 0
    # Deep copy needed? 
    # For sim, yes. But here we modify in place or copy outside
    # Let's operate on 'board' directly (assumed copy)
    
    neighbors = get_neighbors(row, col, size)
    stones_to_remove = []
    
    for nr, nc in neighbors:
        if board[nr][nc] == opponent:
            libs, group = get_group_liberties(board, nr, nc)
            if libs == 0:
                stones_to_remove.extend(group)
                
    for r, c in stones_to_remove:
        board[r][c] = None
        captured_count += 1
        
    return captured_count

def is_suicide(board, row, col, player):
    # Check if a move results in 0 liberties for the group
    # PRECONDITION: Captures have already been resolved!
    libs, _ = get_group_liberties(board, row, col)
    return libs == 0
