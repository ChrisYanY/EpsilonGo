import React, { useState } from 'react';

const Settings = ({ onStartGame }) => {
    const [boardSize, setBoardSize] = useState(19);
    const [timeControl, setTimeControl] = useState(30); // minutes
    const [difficulty, setDifficulty] = useState('beginner');

    const handleStart = () => {
        onStartGame({ boardSize, timeControl, difficulty });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
            <div className="p-10 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full transform transition-all hover:scale-[1.01]">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8 text-center tracking-tight">
                    EpsilonGo
                </h1>

                {/* Board Size */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Board Size</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[9, 13, 19].map((size) => (
                            <button
                                key={size}
                                onClick={() => setBoardSize(size)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${boardSize === size
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                {size}x{size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Control */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Time Control</label>
                    <div className="grid grid-cols-4 gap-3">
                        {[5, 30, 60, 180].map((time) => (
                            <button
                                key={time}
                                onClick={() => setTimeControl(time)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${timeControl === time
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                {time >= 60 ? `${time / 60}h` : `${time}m`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className="mb-10">
                    <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Difficulty</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'beginner', label: 'Beginner' },
                            { id: 'experienced', label: 'Pro' },
                            { id: 'honinbo', label: 'Honinbo' },
                        ].map((diff) => (
                            <button
                                key={diff.id}
                                onClick={() => setDifficulty(diff.id)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${difficulty === diff.id
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.3)]'
                                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                {diff.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                    Enter the Game
                </button>
            </div>
        </div>
    );
};

export default Settings;
