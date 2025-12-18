import React, { useState, useEffect, useCallback } from 'react';
import { checkCaptures } from '../gameLogic';

const GameBoard = ({ settings, onBack, theme }) => {
    const { boardSize, timeControl, difficulty } = settings;
    const [board, setBoard] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('black'); // 'black' (User) or 'white' (AI)
    const [history, setHistory] = useState([]); // Array of {row, col, player}
    const [hover, setHover] = useState(null);
    const [prisoners, setPrisoners] = useState({ black: 0, white: 0 });
    const [isAiThinking, setIsAiThinking] = useState(false);

    // Timer state (in seconds)
    const [blackTime, setBlackTime] = useState(timeControl * 60);
    const [whiteTime, setWhiteTime] = useState(timeControl * 60);
    const [gameOver, setGameOver] = useState(false);
    const [endMessage, setEndMessage] = useState("");

    // Analysis Stats
    const [aiStats, setAiStats] = useState({ winRate: 0.5, lead: 0 });
    const [winRateHistory, setWinRateHistory] = useState([0.5]);

    const isDark = theme === 'dark';

    // Initialize board
    useEffect(() => {
        const newBoard = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        setBoard(newBoard);
        setCurrentPlayer('black');
        setHistory([]);
        setPrisoners({ black: 0, white: 0 });
        setIsAiThinking(false);
        setBlackTime(timeControl * 60);
        setWhiteTime(timeControl * 60);
        setGameOver(false);
        setEndMessage("");
        setAiStats({ winRate: 0.5, lead: 0 });
        setWinRateHistory([0.5]);
    }, [boardSize, timeControl]);

    // Timer Logic
    useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            if (currentPlayer === 'black') {
                setBlackTime(prev => {
                    if (prev <= 0) {
                        setGameOver(true);
                        setEndMessage("时间到！AI 获胜。");
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setWhiteTime(prev => {
                    if (prev <= 0) {
                        setGameOver(true);
                        setEndMessage("时间到！你赢了。");
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [currentPlayer, gameOver]);

    // Helper: Convert History to SGF
    const generateSGF = () => {
        const date = new Date().toISOString().split('T')[0];
        let sgf = `(;GM[1]FF[4]CA[UTF-8]AP[EpsilonGo]ST[2]\n`;
        sgf += `RU[Chinese]SZ[${boardSize}]KM[7.5]\n`;
        sgf += `PW[EpsilonGo AI (${difficulty})]PB[Human Player]\n`;
        sgf += `DT[${date}]RE[${endMessage.includes("你赢了") ? "B+R" : "W+R"}]\n`;

        const colMap = "abcdefghijklmnopqrs".split("");

        history.forEach(move => {
            const c = colMap[move.col];
            const r = colMap[move.row];
            const color = move.player === 'black' ? 'B' : 'W';
            sgf += `;${color}[${c}${r}]`;
        });

        sgf += `)`;
        return sgf;
    };

    const downloadSGF = () => {
        const sgfContent = generateSGF();
        const blob = new Blob([sgfContent], { type: 'application/x-go-sgf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `epsilongo_${new Date().getTime()}.sgf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleResign = () => {
        if (window.confirm("确定要认输吗？")) {
            setGameOver(true);
            setEndMessage("你认输了，AI 获胜。");
        }
    };

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Find move number for a stone
    const getMoveNumber = (r, c) => {
        const idx = history.findIndex(move => move.row === r && move.col === c);
        return idx !== -1 ? idx + 1 : null;
    };

    // Last move check
    const isLastMove = (r, c) => {
        if (history.length === 0) return false;
        const last = history[history.length - 1];
        return last.row === r && last.col === c;
    };

    // Execute a move on the board
    const executeMove = useCallback((row, col, player) => {
        setBoard(prevBoard => {
            const tempBoard = prevBoard.map(r => [...r]);
            tempBoard[row][col] = player;

            const { newBoard, captured } = checkCaptures(tempBoard, row, col, player);

            if (captured === -1) return prevBoard; // Suicide check

            if (captured > 0) {
                setPrisoners(prev => ({
                    ...prev,
                    [player]: prev[player] + captured
                }));
            }

            return newBoard;
        });

        setHistory(prev => [...prev, { row, col, player }]);
        setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black');
    }, []);

    // AI Turn Handler
    useEffect(() => {
        if (currentPlayer === 'white' && !isAiThinking && !gameOver) {
            const makeAiMove = async () => {
                setIsAiThinking(true);
                try {
                    const response = await fetch('http://127.0.0.1:8000/move', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            board: board,
                            player: 'white',
                            difficulty: difficulty,
                            prisoners: prisoners // Send prisoners for score estimation
                        })
                    });

                    if (!response.ok) throw new Error('AI request failed');

                    const data = await response.json();

                    // Update stats
                    setAiStats({
                        winRate: data.win_rate,
                        lead: data.lead
                    });
                    setWinRateHistory(prev => [...prev, data.win_rate]);

                    if (data.resign) {
                        setGameOver(true);
                        setEndMessage("AI 认输，你赢了！");
                        return;
                    }

                    if (data.pass) {
                        setCurrentPlayer('black'); // Pass turn back
                    } else {
                        setTimeout(() => {
                            executeMove(data.row, data.col, 'white');
                            setIsAiThinking(false);
                        }, 500);
                    }
                } catch (error) {
                    console.error("AI Error:", error);
                    setIsAiThinking(false);
                }
            };
            makeAiMove();
        }
    }, [currentPlayer, board, difficulty, executeMove, isAiThinking, gameOver, prisoners]);


    const handleIntersectionClick = (row, col) => {
        if (gameOver) return;
        if (currentPlayer !== 'black' || isAiThinking) return;
        if (board[row][col] !== null) return;
        executeMove(row, col, 'black');
        setWinRateHistory(prev => [...prev, prev[prev.length - 1]]);
    };

    // Star points
    const getStarPoints = (size) => {
        if (size === 9) return [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
        if (size === 13) return [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]];
        if (size === 19) return [
            [3, 3], [3, 9], [3, 15],
            [9, 3], [9, 9], [9, 15],
            [15, 3], [15, 9], [15, 15]
        ];
        return [];
    };

    const starPoints = getStarPoints(boardSize);
    const isStarPoint = (r, c) => starPoints.some(([sr, sc]) => sr === r && sc === c);

    // Win Rate Chart Logic
    const renderWinRateChart = () => {
        const data = winRateHistory;
        if (data.length < 2) return null;

        const width = 200;
        const height = 40;
        const stepX = width / (data.length - 1);

        const points = data.map((rate, i) => {
            const x = i * stepX;
            const y = height - (rate * height);
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} className="overflow-visible" preserveAspectRatio="none">
                {/* Baseline 50% */}
                <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke={isDark ? "#475569" : "#cbd5e1"} strokeDasharray="4 2" strokeWidth="1" />

                <polyline
                    points={points}
                    fill="none"
                    stroke={isDark ? "#34d399" : "#10b981"}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
                {/* Last Point Dot */}
                <circle
                    cx={data.length > 1 ? (data.length - 1) * stepX : 0}
                    cy={height - (data[data.length - 1] * height)}
                    r="3"
                    fill={isDark ? "#34d399" : "#10b981"}
                />
            </svg>
        );
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen font-sans selection:bg-none relative transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

            {/* Game Over Modal */}
            {gameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all">
                    <div className={`p-8 rounded-2xl border shadow-2xl text-center max-w-md w-full animate-in fade-in zoom-in duration-300 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                        <h2 className={`text-4xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>对局结束</h2>
                        <p className="text-xl text-cyan-500 font-medium mb-8">{endMessage}</p>

                        <div className={`rounded-xl p-4 mb-6 text-left space-y-2 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                            <h3 className={`text-xs font-bold uppercase mb-2 border-b pb-1 ${isDark ? 'text-slate-400 border-slate-600' : 'text-slate-500 border-slate-300'}`}>终局数据</h3>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>总手数</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{history.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>AI 胜率</span>
                                <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{(aiStats.winRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>预估目数</span>
                                <span className={`font-mono ${aiStats.lead >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {aiStats.lead > 0 ? '+' : ''}{aiStats.lead.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={downloadSGF}
                                className="py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                保存棋谱
                            </button>
                            <button
                                onClick={onBack}
                                className={`py-3 rounded-xl text-white font-bold transition-colors ${isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-400 hover:bg-slate-500'}`}
                            >
                                返回菜单
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Panel */}
            <div className={`absolute top-4 left-4 backdrop-blur p-4 rounded-xl border shadow-xl w-64 hidden md:block transition-colors ${isDark ? 'bg-slate-800/80 border-slate-600' : 'bg-white/80 border-slate-200'}`}>
                <h3 className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI 形势分析</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>白方胜率</span>
                            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{(aiStats.winRate * 100).toFixed(1)}%</span>
                        </div>
                        {/* Win Rate Chart */}
                        <div className={`mb-2 rounded border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} pb-1`}>
                            {renderWinRateChart()}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>预估目数</span>
                            <span className={`font-mono font-bold ${aiStats.lead >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {aiStats.lead > 0 ? '+' : ''}{aiStats.lead.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between w-full max-w-2xl items-end mb-4 px-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        EpsilonGo
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>vs {settings.difficulty} AI</span>
                        {isAiThinking && <span className="text-xs text-cyan-500 animate-pulse">思考中...</span>}
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${currentPlayer === 'black'
                            ? (isDark ? 'text-slate-900 bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-white bg-slate-900 shadow-xl')
                            : (isDark ? 'text-slate-200 bg-slate-800 border border-slate-600' : 'text-slate-600 bg-white border border-slate-200')
                        } px-4 py-1 rounded-lg`}>
                        {currentPlayer === 'black' ? '黑方落子' : '白方落子'}
                    </div>
                    {/* Timer Display */}
                    <div className="flex justify-end gap-4 text-sm font-mono mt-1">
                        <div className={`px-2 rounded ${currentPlayer === 'black'
                                ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-900')
                                : 'text-slate-500'
                            }`}>
                            你: {formatTime(blackTime)}
                        </div>
                        <div className={`px-2 rounded ${currentPlayer === 'white'
                                ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-900')
                                : 'text-slate-500'
                            }`}>
                            AI: {formatTime(whiteTime)}
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 flex justify-end gap-3 mt-1">
                        <span>提子: <span className="text-emerald-500 font-bold">{prisoners.black}</span></span>
                        <span>被提: <span className="text-red-500 font-bold">{prisoners.white}</span></span>
                    </div>
                </div>
            </div>

            <div
                className="relative bg-[#e3c076] rounded-sm shadow-2xl overflow-hidden select-none"
                style={{
                    width: 'min(90vw, 80vh)',
                    height: 'min(90vw, 80vh)',
                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E")' }}></div>

                <div
                    className="absolute inset-0 grid"
                    style={{
                        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                        gridTemplateRows: `repeat(${boardSize}, 1fr)`,
                        padding: '2%'
                    }}
                    onMouseLeave={() => setHover(null)}
                >
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                className="relative"
                                onClick={() => handleIntersectionClick(r, c)}
                                onMouseEnter={() => setHover({ r, c })}
                            >
                                {/* Grid Lines */}
                                <div className="absolute top-1/2 w-full h-px bg-slate-900 transform -translate-y-1/2 z-0"></div>
                                <div className="absolute left-1/2 h-full w-px bg-slate-900 transform -translate-x-1/2 z-0"></div>

                                {c === 0 && <div className="absolute top-1/2 left-0 w-1/2 h-px bg-[#e3c076] transform -translate-y-1/2 -translate-x-full z-0"></div>}
                                {c === boardSize - 1 && <div className="absolute top-1/2 right-0 w-1/2 h-px bg-[#e3c076] transform -translate-y-1/2 translate-x-full z-0"></div>}
                                {r === 0 && <div className="absolute top-0 left-1/2 h-1/2 w-px bg-[#e3c076] transform -translate-x-1/2 -translate-y-full z-0"></div>}
                                {r === boardSize - 1 && <div className="absolute bottom-0 left-1/2 h-1/2 w-px bg-[#e3c076] transform -translate-x-1/2 translate-y-full z-0"></div>}

                                {isStarPoint(r, c) && (
                                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-900 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-0"></div>
                                )}

                                <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer">
                                    {cell && (
                                        <div className={`relative w-[90%] h-[90%] rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${cell === 'black'
                                                ? 'bg-gradient-to-br from-slate-800 to-black scale-100'
                                                : 'bg-gradient-to-br from-white to-slate-200 scale-100'
                                            }`}>
                                            {/* Move Number */}
                                            <span className={`text-[9px] sm:text-xs font-bold leading-none ${cell === 'black' ? 'text-white/70' : 'text-black/70'
                                                }`}>
                                                {getMoveNumber(r, c)}
                                            </span>

                                            {/* Last Move Highlight */}
                                            {isLastMove(r, c) && (
                                                <div className="absolute inset-0 rounded-full border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"></div>
                                            )}
                                        </div>
                                    )}
                                    {!cell && !isAiThinking && currentPlayer === 'black' && hover?.r === r && hover?.c === c && (
                                        <div className={`w-[90%] h-[90%] rounded-full opacity-50 bg-black`}></div>
                                    )}
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button
                    onClick={handleResign}
                    className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow'}`}
                >
                    认输
                </button>
                <button
                    className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow'}`}
                >
                    停一手
                </button>
            </div>
        </div>
    );
};

export default GameBoard;
