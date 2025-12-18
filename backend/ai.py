import random
import math
from game_logic import resolve_captures, is_suicide

def estimate_score_diff(board, prisoners):
    # Returns (black_stones - white_stones) + (black_captured - white_captured)
    # Positive = Black winning, Negative = White winning
    # This is a VERY rough heuristic (Area scoring is much harder)
    
    black_stones = 0
    white_stones = 0
    
    for row in board:
        for cell in row:
            if cell == 'black':
                black_stones += 1
            elif cell == 'white':
                white_stones += 1
                
    # Prisoner heuristic: Each prisoner is roughly 1 point (territory + removed stone)
    # In Chinese rules it's just area, but this approximates advantage.
    
    black_score = black_stones + prisoners.get('black', 0)
    white_score = white_stones + prisoners.get('white', 0)
    
    return black_score - white_score

def calculate_win_rate(score_diff):
    # Logistic function to map score difference to 0-1 probability
    # If diff is 0, win rate 0.5
    # If diff is +10 (Black leads), win rate -> 1.0 (for Black)
    # If diff is -10 (White leads), win rate -> 0.0 (for Black)
    
    # Sigmoid: 1 / (1 + e^(-k * x))
    k = 0.1 # steepness
    win_rate_black = 1 / (1 + math.exp(-k * score_diff))
    return win_rate_black

def get_random_move(board, player, prisoners=None):
    if prisoners is None:
        prisoners = {'black': 0, 'white': 0}

    score_diff = estimate_score_diff(board, prisoners)
    
    # Win rate relative to the AI (player)
    # If player is 'white' and score_diff is negative (White leads), win rate should be high
    win_rate_black = calculate_win_rate(score_diff)
    
    if player == 'white':
        ai_win_rate = 1.0 - win_rate_black
        lead = -score_diff
    else:
        ai_win_rate = win_rate_black
        lead = score_diff

    threshold = 30
    if player == 'white' and score_diff > threshold:
        return "RESIGN", 0.0, -score_diff
    if player == 'black' and score_diff < -threshold:
        return "RESIGN", 0.0, score_diff

    size = len(board)
    empty_spots = []
    
    # scan board
    for r in range(size):
        for c in range(size):
            if board[r][c] is None:
                empty_spots.append((r, c))
                
    random.shuffle(empty_spots)
    
    for r, c in empty_spots:
        # Simulate move
        sim_board = [row[:] for row in board]
        sim_board[r][c] = player
        
        # Check integrity
        captured = resolve_captures(sim_board, r, c, player)
        if is_suicide(sim_board, r, c, player):
             continue
             
        # Return move and stats
        return (r, c), ai_win_rate, lead
        
    return None, ai_win_rate, lead # Pass
