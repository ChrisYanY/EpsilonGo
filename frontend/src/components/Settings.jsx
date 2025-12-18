import React, { useState } from 'react';
import avatarAhFu from '../assets/avatar_ah_fu.png';
import avatarTouya from '../assets/avatar_touya_akira.png';
import avatarSai from '../assets/avatar_sai.png';

const Settings = ({ onStartGame, theme, toggleTheme }) => {
    const [boardSize, setBoardSize] = useState(19);
    const [timeControl, setTimeControl] = useState(30); // minutes
    const [difficulty, setDifficulty] = useState('新手');

    // Map difficulty to Avatar
    const difficultyMap = {
        '新手': { id: '新手', label: '新手 (阿福)', img: avatarAhFu },
        '职业': { id: '职业', label: '职业 (塔矢亮)', img: avatarTouya },
        '本因坊': { id: '本因坊', label: '本因坊 (佐为)', img: avatarSai }
    };

    const handleStart = () => {
        onStartGame({
            boardSize,
            timeControl,
            difficulty,
            avatar: difficultyMap[difficulty].img
        });
    };

    const isDark = theme === 'dark';

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <div className={`p-10 backdrop-blur-xl rounded-3xl border shadow-2xl max-w-lg w-full transform transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'
                }`}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                        EpsilonGo
                    </h1>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                        title="切换主题"
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>

                {/* Board Size */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>棋盘大小</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[9, 13, 19].map((size) => (
                            <button
                                key={size}
                                onClick={() => setBoardSize(size)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${boardSize === size
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                    : isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {size}路
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Control */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>用时设置</label>
                    <div className="grid grid-cols-4 gap-3">
                        {[5, 30, 60, 180].map((time) => (
                            <button
                                key={time}
                                onClick={() => setTimeControl(time)}
                                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${timeControl === time
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                    : isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {time >= 60 ? `${time / 60}小时` : `${time}分钟`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className="mb-10">
                    <label className={`block text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>棋力设定</label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.values(difficultyMap).map((diff) => (
                            <button
                                key={diff.id}
                                onClick={() => setDifficulty(diff.id)}
                                className={`relative py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex flex-col items-center gap-2 overflow-hidden ${difficulty === diff.id
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.3)]'
                                    : isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-sm">
                                    <img src={diff.img} alt={diff.label} className="w-full h-full object-cover" />
                                </div>
                                <span>{diff.label.split(' ')[1].replace(/[()]/g, '')}</span>
                                <span className="text-[10px] opacity-70 uppercase tracking-widest">{diff.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                    开始对局
                </button>
            </div>
        </div>
    );
};

export default Settings;
