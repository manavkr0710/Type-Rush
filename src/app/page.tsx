import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-900 to-slate-900 text-white p-8">
      {/* Title */}
      <header className="text-center mb-16">
        <h1 className="text-6xl font-bold text-white glow-text mb-2">Type Rush</h1>
      </header>

      {/* Game Mode Selection */}
      <main className="flex-grow flex flex-col items-center gap-8">
        <h2 className="text-3xl font-semibold mb-8 text-gray-200">Select Game Mode</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
          {/* Classic Mode */}
          <div className="game-mode-card bg-teal-900/30 border border-teal-500/30 hover:border-teal-400/60">
            <h3 className="text-xl font-semibold mb-3">Classic Mode</h3>
            <p className="text-teal-200 text-sm">
              Test your typing speed with a fixed time limit
            </p>
          </div>

          {/* Dynamic Speed Mode */}
          <div className="game-mode-card bg-indigo-900/30 border border-indigo-500/30 hover:border-indigo-400/60">
            <h3 className="text-xl font-semibold mb-3">Dynamic Speed Mode</h3>
            <p className="text-indigo-200 text-sm">
              Challenge yourself with increasing speeds
            </p>
          </div>

          {/* AI Rival Mode */}
          <div className="game-mode-card bg-amber-900/30 border border-amber-500/30 hover:border-amber-400/60">
            <h3 className="text-xl font-semibold mb-3">AI Rival Mode</h3>
            <p className="text-amber-200 text-sm">
              Compete against an AI that adapts to your skill level
            </p>
          </div>

          {/* Multiplayer Mode */}
          <div className="game-mode-card bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-400/60">
            <h3 className="text-xl font-semibold mb-3">Multiplayer Mode</h3>
            <p className="text-emerald-200 text-sm">
              Challenge your friends in real-time typing battles
            </p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-16 max-w-3xl text-center p-8 bg-slate-900/50 rounded-lg border border-gray-700/50">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Type Rush</h2>
          <p className="text-gray-300">
            Choose your preferred mode above to start practicing. Each mode offers a unique
            challenge to help improve your typing speed and accuracy. Track your progress and
            compete against yourself or our AI rival.
          </p>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="animate-float absolute top-20 left-[10%] w-3 h-3 rounded-full bg-teal-400/20"></div>
        <div className="animate-float-delayed absolute top-40 right-[15%] w-2 h-2 rounded-full bg-indigo-400/20"></div>
        <div className="animate-float absolute bottom-[20%] left-[20%] w-2 h-2 rounded-full bg-purple-400/20"></div>
      </div>
    </div>
  );
}
