'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
//import TypingTest from '@/components/TypingTest';
//import { MultiplayerGame } from '../components/MultiplayerGame';

type GameMode = 'classic' | 'dynamic' | 'ai' | 'multiplayer';

interface TypingStats {
  wpm: number;
  accuracy: number;
  totalTime: number;
  mistakes: number;
}

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [particles, setParticles] = useState(() => 
    Array.from({ length: 20 }, () => ({
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      size: Math.random() * 10 + 5,
      currentX: 0,
      currentY: 0,
      velocity: { x: 0, y: 0 }
    }))
  );
  const [practiceStats, setPracticeStats] = useState({
    startTime: 0,
    endTime: 0,
    mistakes: 0,
    totalChars: 0,
    isTyping: false,
    wpm: 0,
    accuracy: 100,
    totalMistakes: 0,
    totalAttemptedChars: 0,
    mistakeHistory: [] as { time: number; count: number }[],
  });

  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly.");
  const [colorCycle, setColorCycle] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calculateStats = (input: string, prevInput: string) => {
    const currentTime = Date.now();
    const timeElapsed = (currentTime - practiceStats.startTime) / 1000 / 60; // in minutes
    
    // Count current visible mistakes
    let currentMistakes = 0;
    for (let i = 0; i < input.length && i < sampleText.length; i++) {
      if (input[i] !== sampleText[i]) currentMistakes++;
    }

    // Track new mistakes
    let newMistakes = practiceStats.totalMistakes;
    if (input.length > prevInput.length) {
      // User added a character
      const newChar = input[input.length - 1];
      const expectedChar = sampleText[input.length - 1];
      if (newChar !== expectedChar) {
        newMistakes++;
      }
    }

    // Calculate total attempted characters (only count actual typing attempts)
    const totalAttempted = input.length;

    // Calculate WPM: (characters typed / 5) / minutes elapsed
    const wpm = timeElapsed > 0 ? Math.round((input.length / 5) / timeElapsed) : 0;
    
    // Calculate accuracy based on current text state
    const accuracy = totalAttempted > 0 
      ? Math.round(((totalAttempted - currentMistakes) / totalAttempted) * 100)
      : 100;

    // Update mistake history
    const mistakeHistory = [...practiceStats.mistakeHistory];
    if (practiceStats.isTyping) {
      mistakeHistory.push({
        time: currentTime - practiceStats.startTime,
        count: currentMistakes
      });
    }

    return { 
      wpm, 
      accuracy, 
      mistakes: currentMistakes,
      totalMistakes: newMistakes,
      totalAttemptedChars: totalAttempted,
      mistakeHistory
    };
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    const target = e.target;
    const prevInput = target.defaultValue || '';
    target.defaultValue = input;

    // Adjust textarea height
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';

    // Start timing on first keystroke
    if (!practiceStats.isTyping && input.length === 1) {
      setPracticeStats(prev => ({
        ...prev,
        startTime: Date.now(),
        isTyping: true,
      }));
    }

    // Calculate stats
    const stats = calculateStats(input, prevInput);
    setPracticeStats(prev => ({
      ...prev,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mistakes: stats.mistakes,
      totalChars: input.length,
      totalMistakes: stats.totalMistakes,
      totalAttemptedChars: stats.totalAttemptedChars,
      mistakeHistory: stats.mistakeHistory,
    }));

    // Check if typing is complete
    if (input.length === sampleText.length) {
      setPracticeStats(prev => ({
        ...prev,
        endTime: Date.now(),
        isTyping: false,
      }));
    }
  };

  useEffect(() => {
    // Initialize window size
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial size
    updateWindowSize();

    // Add event listener
    window.addEventListener('resize', updateWindowSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  // Smooth particle movement animation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      setParticles(prevParticles => 
        prevParticles.map(particle => {
          if (windowSize.width === 0) return particle;

          const dx = (mousePos.x / windowSize.width * 100) - particle.currentX;
          const dy = (mousePos.y / windowSize.height * 100) - particle.currentY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const attraction = Math.min(30, 100 / (distance + 1));

          // Calculate target position
          const targetX = particle.baseX + (dx * attraction / 100);
          const targetY = particle.baseY + (dy * attraction / 100);

          // Smooth movement using velocity
          const acceleration = 5; // Adjust for more or less responsive movement
          const friction = 0.9; // Adjust for more or less smoothing

          // Update velocity
          particle.velocity.x = (particle.velocity.x + (targetX - particle.currentX) * acceleration * deltaTime) * friction;
          particle.velocity.y = (particle.velocity.y + (targetY - particle.currentY) * acceleration * deltaTime) * friction;

          // Update position
          return {
            ...particle,
            currentX: particle.currentX + particle.velocity.x,
            currentY: particle.currentY + particle.velocity.y
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos, windowSize.width, windowSize.height]);

  // Draw mistake graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || practiceStats.mistakeHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const history = practiceStats.mistakeHistory;
    const maxTime = Math.max(...history.map(h => h.time));
    const maxMistakes = Math.max(Math.max(...history.map(h => h.count)), 1); // Ensure at least 1
    // Round up maxMistakes to nearest multiple of 5 for clean grid lines
    const yAxisMax = Math.ceil(maxMistakes / 5) * 5;
    const yAxisSteps = 5;
    const yAxisInterval = yAxisMax / yAxisSteps;

    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Draw vertical grid lines (time)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const timeIntervals = 5;
    for (let i = 0; i <= timeIntervals; i++) {
      const x = (width * i) / timeIntervals;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal grid lines (mistakes)
    for (let i = 0; i <= yAxisSteps; i++) {
      const y = height - (height * (i / yAxisSteps));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = (point.time / maxTime) * width;
      const y = height - ((point.count / yAxisMax) * height);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

  }, [practiceStats.mistakeHistory]);

  // Color cycling animation
  useEffect(() => {
    if (selectedMode) return; // Only animate when on menu page
    
    const interval = setInterval(() => {
      setColorCycle(prev => (prev + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [selectedMode]);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setStats(null);
  };

  const handleTestComplete = (newStats: TypingStats) => {
    setStats(newStats);
  };

  // Debounced mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
  }, []);

  const generateNewSampleText = () => {
    const samples = [
      "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly.",
      "Sphinx of black quartz, judge my vow. The wizard quickly jinxed the gnomes before they vaporized. How quickly daft jumping zebras vex!",
      "Jaded zombies acted quaintly but kept driving their oxen forward. The job requires extra pluck and zeal from every young wage earner.",
      "All questions asked by five watch experts amazed the judge. Sixty zippers were quickly picked from the woven jute bag. The wizard quickly jinxed the gnomes before they vaporized.",
      "Crazy Fredrick bought many very exquisite opal jewels. We promptly judged antique ivory buckles for the next prize. A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.",
      "Jaded zombies acted quaintly but kept driving their oxen forward. The job requires extra pluck and zeal from every young wage earner. All questions asked by five watch experts amazed the judge."
    ];
    const randomIndex = Math.floor(Math.random() * samples.length);
    setSampleText(samples[randomIndex]);
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  if (selectedMode === 'multiplayer') {
    return <MultiplayerGame onBack={handleBack} />;
  }

  if (selectedMode) {
    return (
      <TypingTest
        gameMode={selectedMode}
        timeLimit={60}
        onComplete={(stats) => {
          console.log('Game completed:', stats);
          // Remove the automatic redirection
          // handleBack();
        }}
        onBack={handleBack}
      />
    );
  }

  return (
    <div 
      className="relative min-h-screen overflow-hidden bg-[#111827]"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 transition-all duration-500">
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, 
              hsla(${colorCycle}, 70%, 60%, 0.2), 
              rgba(17, 24, 39, 0.95))`
          }}
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle, i) => {
              if (windowSize.width === 0) return null;

              return (
                <div
                  key={i}
                  className="absolute rounded-full opacity-30 will-change-transform"
                  style={{
                    width: particle.size + 'px',
                    height: particle.size + 'px',
                    left: `${particle.currentX}%`,
                    top: `${particle.currentY}%`,
                    background: `hsla(${colorCycle + i * 20}, 70%, 60%, 0.5)`,
                    transform: `scale(${1 + Math.min(30, 100 / (Math.sqrt(
                      Math.pow((mousePos.x / windowSize.width * 100) - particle.currentX, 2) +
                      Math.pow((mousePos.y / windowSize.height * 100) - particle.currentY, 2)
                    ) + 1)) / 50})`,
                    boxShadow: `0 0 ${Math.min(30, 100 / (Math.sqrt(
                      Math.pow((mousePos.x / windowSize.width * 100) - particle.currentX, 2) +
                      Math.pow((mousePos.y / windowSize.height * 100) - particle.currentY, 2)
                    ) + 1))}px hsla(${colorCycle + i * 20}, 70%, 60%, 0.3)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h1 
          className="text-4xl font-bold text-center mb-12 text-white" 
          style={{ 
            fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
            textShadow: `0 0 10px hsla(${colorCycle}, 70%, 60%, 0.7)`
          }}
        >
          Type Rush
        </h1>

        {!selectedMode && (
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-2xl font-semibold text-center mb-8 text-gray-300" 
              style={{ 
                fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                textShadow: `0 0 8px hsla(${colorCycle + 60}, 70%, 60%, 0.5)`
              }}
            >
              Select Game Mode
            </h2>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleModeSelect('classic')}
                className="flex-1 max-w-md p-6 backdrop-blur-lg border text-white rounded-lg hover:bg-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                style={{ 
                  fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                  backgroundColor: `hsla(${colorCycle}, 70%, 20%, 0.2)`,
                  borderColor: `hsla(${colorCycle}, 70%, 40%, 0.3)`,
                  boxShadow: `0 0 15px hsla(${colorCycle}, 70%, 30%, 0.2)`
                }}
              >
                <span className="text-xl font-semibold block mb-2">Classic Mode</span>
                <p className="text-sm" style={{ color: `hsla(${colorCycle}, 70%, 80%, 1)` }}>Test your typing speed with a fixed time limit</p>
              </button>
              <button
                onClick={() => handleModeSelect('dynamic')}
                className="flex-1 max-w-md p-6 backdrop-blur-lg border text-white rounded-lg hover:bg-green-500/30 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                style={{ 
                  fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                  backgroundColor: `hsla(${colorCycle + 120}, 70%, 20%, 0.2)`,
                  borderColor: `hsla(${colorCycle + 120}, 70%, 40%, 0.3)`,
                  boxShadow: `0 0 15px hsla(${colorCycle + 120}, 70%, 30%, 0.2)`
                }}
              >
                <span className="text-xl font-semibold block mb-2">Dynamic Speed Mode</span>
                <p className="text-sm" style={{ color: `hsla(${colorCycle + 120}, 70%, 80%, 1)` }}>Challenge yourself with increasing speeds</p>
              </button>
              <button
                onClick={() => handleModeSelect('ai')}
                className="flex-1 max-w-md p-6 backdrop-blur-lg border text-white rounded-lg hover:bg-purple-500/30 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                style={{ 
                  fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                  backgroundColor: `hsla(${colorCycle + 240}, 70%, 20%, 0.2)`,
                  borderColor: `hsla(${colorCycle + 240}, 70%, 40%, 0.3)`,
                  boxShadow: `0 0 15px hsla(${colorCycle + 240}, 70%, 30%, 0.2)`
                }}
              >
                <span className="text-xl font-semibold block mb-2">AI Rival Mode</span>
                <p className="text-sm" style={{ color: `hsla(${colorCycle + 240}, 70%, 80%, 1)` }}>Compete against an AI that adapts to your skill level</p>
              </button>
              <button
                onClick={() => handleModeSelect('multiplayer')}
                className="flex-1 max-w-md p-6 backdrop-blur-lg border text-white rounded-lg hover:bg-pink-500/30 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                style={{ 
                  fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                  backgroundColor: `hsla(${colorCycle + 300}, 70%, 20%, 0.2)`,
                  borderColor: `hsla(${colorCycle + 300}, 70%, 40%, 0.3)`,
                  boxShadow: `0 0 15px hsla(${colorCycle + 300}, 70%, 30%, 0.2)`
                }}
              >
                <span className="text-xl font-semibold block mb-2">Multiplayer Mode</span>
                <p className="text-sm" style={{ color: `hsla(${colorCycle + 300}, 70%, 80%, 1)` }}>Challenge your friends in real-time typing battles</p>
              </button>
            </div>
            
            {/* Welcome Message */}
            <div 
              className="mt-16 p-8 backdrop-blur-lg border rounded-lg text-center" 
              style={{ 
                fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                backgroundColor: `hsla(${colorCycle + 180}, 70%, 10%, 0.2)`,
                borderColor: `hsla(${colorCycle + 180}, 70%, 30%, 0.3)`,
                boxShadow: `0 0 20px hsla(${colorCycle + 180}, 70%, 20%, 0.2)`
              }}
            >
              <h3 
                className="text-2xl font-semibold text-white mb-4"
                style={{ textShadow: `0 0 8px hsla(${colorCycle + 180}, 70%, 60%, 0.5)` }}
              >
                Welcome to Type Rush
              </h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Choose your preferred mode above to start practicing. Each mode offers a unique challenge 
                to help improve your typing speed and accuracy. Track your progress and compete against 
                yourself or our AI rival.
              </p>
            </div>

            {/* Quick Practice Section */}
            <div className="mt-16">
              <h3 className="text-2xl font-semibold text-white mb-6 text-center" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>Quick Practice</h3>
              <div className="max-w-4xl mx-auto p-8 backdrop-blur-lg bg-white/5 border border-white/10 rounded-lg">
                <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-lg text-gray-300 leading-relaxed" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
                    {sampleText}
                  </p>
                </div>
                <textarea
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                  style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
                  placeholder="Start typing here to practice..."
                  rows={4}
                  onChange={handleTyping}
                  maxLength={sampleText.length}
                />
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
                    <div className="flex gap-8 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">WPM:</span>
                        <span className="text-white font-semibold">{practiceStats.wpm}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Accuracy:</span>
                        <span className="text-white font-semibold">{practiceStats.accuracy}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Current Mistakes:</span>
                        <span className="text-white font-semibold">{practiceStats.mistakes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Total Mistakes:</span>
                        <span className="text-white font-semibold">{practiceStats.totalMistakes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-white font-semibold">
                          {practiceStats.totalChars}/{sampleText.length} chars
                        </span>
                      </div>
                    </div>

                    <button 
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
                      style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          textarea.value = '';
                          textarea.style.height = 'auto';
                        }
                        generateNewSampleText();
                        setPracticeStats({
                          startTime: 0,
                          endTime: 0,
                          mistakes: 0,
                          totalChars: 0,
                          isTyping: false,
                          wpm: 0,
                          accuracy: 100,
                          totalMistakes: 0,
                          totalAttemptedChars: 0,
                          mistakeHistory: [],
                        });
                      }}
                    >
                      Clear Text
                    </button>
                  </div>

                  {/* Mistake Graph */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-center mb-4">
                      <h4 className="text-base text-gray-400 font-bold" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>Mistakes Over Time</h4>
                      {practiceStats.isTyping && (
                        <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
                          Time: {((Date.now() - practiceStats.startTime) / 1000).toFixed(1)}s
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      {/* Y-axis labels (inside) */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400 py-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const maxMistakes = Math.max(
                            Math.max(...practiceStats.mistakeHistory.map(h => h.count), 1)
                          );
                          const yAxisMax = Math.ceil(maxMistakes / 5) * 5;
                          const value = yAxisMax - (i * (yAxisMax / 5));
                          return (
                            <span key={i} className="ml-1" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>{value}</span>
                          );
                        })}
                      </div>
                      {/* X-axis labels */}
                      <div className="absolute -bottom-6 left-0 right-0 h-6 flex justify-between text-xs text-gray-400 px-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const totalTime = practiceStats.endTime > 0 
                            ? (practiceStats.endTime - practiceStats.startTime) 
                            : (practiceStats.isTyping ? Date.now() - practiceStats.startTime : 0);
                          const timeAtPoint = (totalTime * i / 5) / 1000;
                          return (
                            <span key={i} className="pl-6" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>{timeAtPoint.toFixed(1)}s</span>
                          );
                        })}
                      </div>
                      {/* Y-axis title (outside) */}
                      <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-gray-400 whitespace-nowrap" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
                        Number of Mistakes
                      </div>
                      {/* X-axis title */}
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-gray-400" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
                        Time (seconds)
                      </div>
                      {/* Canvas with margin for labels */}
                      <div className="ml-6 mb-6">
                        <canvas 
                          ref={canvasRef}
                          className="w-full h-64 rounded"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    </div>
                  </div>

                  {practiceStats.endTime > 0 && (
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-300">
                        Practice complete! Time: {((practiceStats.endTime - practiceStats.startTime) / 1000).toFixed(1)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Add styles to the document */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: translate(10px, 10px) rotate(90deg);
            opacity: 0.6;
          }
          50% {
            transform: translate(0, 20px) rotate(180deg);
            opacity: 0.3;
          }
          75% {
            transform: translate(-10px, 10px) rotate(270deg);
            opacity: 0.6;
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
            opacity: 0.3;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        body {
          background: rgb(17, 24, 39);
          color: white;
        }
      `}</style>
    </div>
  );
}
