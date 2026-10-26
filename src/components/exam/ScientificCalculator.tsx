'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calculator, X, Move } from 'lucide-react';

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number>(0);
  const [isDegree, setIsDegree] = useState(true);
  const [history, setHistory] = useState<string>('');

  // Draggable positioning state
  const [position, setPosition] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 100,
    posY: 80,
  });

  useEffect(() => {
    // Center initially on open if small screen
    if (typeof window !== 'undefined') {
      const initX = Math.max(20, window.innerWidth - 480);
      setPosition({ x: initX, y: 100 });
      dragRef.current.posX = initX;
      dragRef.current.posY = 100;
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.posX = position.x;
    dragRef.current.posY = position.y;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 440, dragRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 380, dragRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const toDegrees = (rad: number) => (rad * 180) / Math.PI;

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 100); i++) res *= i;
    return res;
  };

  const handleInput = (char: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return char;
      return prev + char;
    });
  };

  const handleClear = () => {
    setDisplay('0');
    setHistory('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleFunction = (fn: string) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return;

      let res = 0;
      const radVal = isDegree ? toRadians(val) : val;

      switch (fn) {
        case 'sin':
          res = Math.sin(radVal);
          break;
        case 'cos':
          res = Math.cos(radVal);
          break;
        case 'tan':
          res = Math.tan(radVal);
          break;
        case 'asin':
          res = isDegree ? toDegrees(Math.asin(val)) : Math.asin(val);
          break;
        case 'acos':
          res = isDegree ? toDegrees(Math.acos(val)) : Math.acos(val);
          break;
        case 'atan':
          res = isDegree ? toDegrees(Math.atan(val)) : Math.atan(val);
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case 'log10':
          res = Math.log10(val);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'cbrt':
          res = Math.cbrt(val);
          break;
        case 'sq':
          res = val * val;
          break;
        case 'cube':
          res = val * val * val;
          break;
        case 'reciprocal':
          res = 1 / val;
          break;
        case 'fact':
          res = factorial(Math.floor(val));
          break;
        case 'exp':
          res = Math.exp(val);
          break;
        case 'abs':
          res = Math.abs(val);
          break;
        case 'neg':
          res = -val;
          break;
        case 'pi':
          res = Math.PI;
          break;
        case 'e':
          res = Math.E;
          break;
        default:
          return;
      }

      const formatted = Number.isInteger(res) ? String(res) : parseFloat(res.toFixed(8)).toString();
      setDisplay(formatted);
      setHistory(`${fn}(${val})`);
    } catch {
      setDisplay('Error');
    }
  };

  const handleCalculate = () => {
    try {
      setHistory(display + ' =');
      // Replace power expression x^y with Math.pow
      let expr = display
        .replace(/\^/g, '**')
        .replace(/π/g, `${Math.PI}`)
        .replace(/e/g, `${Math.E}`)
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Sanitize to only valid mathematical symbols
      const sanitized = expr.replace(/[^0-9+\-*/().%*]/g, '');
      // eslint-disable-next-line no-eval
      const evalRes = Function(`"use strict"; return (${sanitized})`)();
      if (!isFinite(evalRes) || isNaN(evalRes)) {
        setDisplay('Error');
      } else {
        const rounded = Number.isInteger(evalRes) ? String(evalRes) : parseFloat(evalRes.toFixed(8)).toString();
        setDisplay(rounded);
      }
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[110] w-[420px] bg-[#1e293b] text-slate-100 rounded-xl shadow-2xl border-2 border-[#38bdf8]/40 select-none overflow-hidden font-sans text-xs"
    >
      {/* Title Bar with Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] px-3.5 py-2.5 flex items-center justify-between cursor-move border-b border-slate-700/60"
      >
        <div className="flex items-center gap-2 font-bold text-white tracking-wide">
          <Calculator className="w-4 h-4 text-[#38bdf8]" />
          <span>TCS iON Scientific Calculator</span>
          <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
            <Move className="w-3 h-3 inline" /> Drag
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 bg-[#0f172a]">
        {/* Expression History */}
        <div className="h-4 text-[11px] text-right font-mono text-slate-400 overflow-hidden text-ellipsis px-2">
          {history}
        </div>

        {/* Output Screen */}
        <div className="bg-[#020617] border border-slate-700 rounded-lg p-2.5 mb-2.5 text-right font-mono text-xl font-bold text-[#38bdf8] overflow-x-auto min-h-[44px] flex items-center justify-end shadow-inner">
          {display}
        </div>

        {/* Deg / Rad & Memory Bar */}
        <div className="flex items-center justify-between gap-1 mb-2 text-[10px] font-bold">
          <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setIsDegree(true)}
              className={`px-2 py-0.5 rounded ${isDegree ? 'bg-[#0f766e] text-white' : 'text-slate-400'}`}
            >
              Deg
            </button>
            <button
              onClick={() => setIsDegree(false)}
              className={`px-2 py-0.5 rounded ${!isDegree ? 'bg-[#0f766e] text-white' : 'text-slate-400'}`}
            >
              Rad
            </button>
          </div>

          <div className="flex gap-1 text-slate-300">
            <button
              onClick={() => setMemory(0)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              MC
            </button>
            <button
              onClick={() => setDisplay(String(memory))}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              MR
            </button>
            <button
              onClick={() => setMemory(parseFloat(display) || 0)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              MS
            </button>
            <button
              onClick={() => setMemory((prev) => prev + (parseFloat(display) || 0))}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              M+
            </button>
            <button
              onClick={() => setMemory((prev) => prev - (parseFloat(display) || 0))}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              M-
            </button>
          </div>
        </div>

        {/* Scientific & Numeric Keypad Grid */}
        <div className="grid grid-cols-6 gap-1 font-mono text-[11px]">
          {/* Row 1 */}
          <button onClick={() => handleFunction('sin')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">sin</button>
          <button onClick={() => handleFunction('cos')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">cos</button>
          <button onClick={() => handleFunction('tan')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">tan</button>
          <button onClick={() => handleInput('(')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">(</button>
          <button onClick={() => handleInput(')')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">)</button>
          <button onClick={handleBackspace} className="p-1.5 bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 rounded border border-amber-800 font-bold">⌫</button>

          {/* Row 2 */}
          <button onClick={() => handleFunction('asin')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">sin⁻¹</button>
          <button onClick={() => handleFunction('acos')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">cos⁻¹</button>
          <button onClick={() => handleFunction('atan')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">tan⁻¹</button>
          <button onClick={() => handleFunction('ln')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">ln</button>
          <button onClick={() => handleFunction('log10')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">log</button>
          <button onClick={handleClear} className="p-1.5 bg-rose-900/50 hover:bg-rose-800/60 text-rose-200 rounded border border-rose-800 font-bold">AC</button>

          {/* Row 3 */}
          <button onClick={() => handleFunction('sqrt')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">√x</button>
          <button onClick={() => handleFunction('sq')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">x²</button>
          <button onClick={() => handleInput('^')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">xʸ</button>
          <button onClick={() => handleInput('7')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">7</button>
          <button onClick={() => handleInput('8')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">8</button>
          <button onClick={() => handleInput('9')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">9</button>

          {/* Row 4 */}
          <button onClick={() => handleFunction('reciprocal')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">1/x</button>
          <button onClick={() => handleFunction('fact')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">n!</button>
          <button onClick={() => handleFunction('pi')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">π</button>
          <button onClick={() => handleInput('4')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">4</button>
          <button onClick={() => handleInput('5')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">5</button>
          <button onClick={() => handleInput('6')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">6</button>

          {/* Row 5 */}
          <button onClick={() => handleFunction('e')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">e</button>
          <button onClick={() => handleFunction('exp')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">eˣ</button>
          <button onClick={() => handleInput('%')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">%</button>
          <button onClick={() => handleInput('1')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">1</button>
          <button onClick={() => handleInput('2')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">2</button>
          <button onClick={() => handleInput('3')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">3</button>

          {/* Row 6 */}
          <button onClick={() => handleFunction('neg')} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">±</button>
          <button onClick={() => handleInput('/')} className="p-1.5 bg-[#0f766e] hover:bg-[#0d9488] rounded text-white font-bold">÷</button>
          <button onClick={() => handleInput('*')} className="p-1.5 bg-[#0f766e] hover:bg-[#0d9488] rounded text-white font-bold">×</button>
          <button onClick={() => handleInput('0')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">0</button>
          <button onClick={() => handleInput('.')} className="p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-white font-bold text-xs">.</button>
          <button onClick={() => handleInput('-')} className="p-1.5 bg-[#0f766e] hover:bg-[#0d9488] rounded text-white font-bold">-</button>

          {/* Row 7 */}
          <button onClick={() => handleInput('+')} className="p-1.5 bg-[#0f766e] hover:bg-[#0d9488] rounded text-white font-bold col-span-2">+</button>
          <button onClick={handleCalculate} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold col-span-4 text-sm">=</button>
        </div>
      </div>
    </div>
  );
};
