import React, { useState, useEffect, useRef } from 'react';
import { generateGameId, isValidGameId } from '../utils/gameIdGenerator';
import { generateTypingText } from '../utils/wordLists';
import TypingTest from './TypingTest';

interface MultiplayerGameProps {
  onBack: () => void;
}

interface Player {
  name: string;
  isReady: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  restartRequested?: boolean;
}

interface GameData {
  id: string;
  host: string;
  players: { [key: string]: Player };
  isStarted: boolean;
  text: string;
  restartPending?: boolean;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ onBack }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const gameDataRef = useRef<GameData | null>(null);
  // Particle parallax state

  // Initialize game data in localStorage if it doesn't exist
  useEffect(() => {
    if (!localStorage.getItem('multiplayerGames')) {
      localStorage.setItem('multiplayerGames', JSON.stringify({}));
    }
  }, []);

  const createGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const newGameId = generateGameId();
    const newGameData: GameData = {
      id: newGameId,
      host: playerName,
      players: {
        [playerName]: {
          name: playerName,
          isReady: false,
          progress: 0,
          wpm: 0,
          accuracy: 0,
          isFinished: false
        }
      },
      isStarted: false,
      text: generateTypingText({
        type: 'sentences',
        length: 500,  // Increased from 100 to 500 characters
        useSentences: true
      })
    };

    // Store game data in localStorage
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    games[newGameId] = newGameData;
    localStorage.setItem('multiplayerGames', JSON.stringify(games));

    setGameId(newGameId);
    setGameData(newGameData);
    gameDataRef.current = newGameData;
    setError('');
  };

  const joinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!isValidGameId(gameId)) {
      setError('Invalid game ID');
      return;
    }

    // Get games from localStorage
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];

    if (!game) {
      setError('Game not found');
      return;
    }

    if (game.isStarted) {
      setError('Game has already started');
      return;
    }

    if (Object.keys(game.players).length >= 4) {
      setError('Game is full');
      return;
    }

    if (game.players[playerName]) {
      setError('Name already taken in this game');
      return;
    }

    // Add player to game
    game.players[playerName] = {
      name: playerName,
      isReady: false,
      progress: 0,
      wpm: 0,
      accuracy: 0,
      isFinished: false
    };

    // Update game in localStorage
    games[gameId] = game;
    localStorage.setItem('multiplayerGames', JSON.stringify(games));

    setGameData(game);
    gameDataRef.current = game;
    setError('');
  };

  const setPlayerReady = (gameId: string, playerName: string) => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];

    if (game && game.players[playerName]) {
      game.players[playerName].isReady = true;
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const startGame = (gameId: string) => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];

    if (game) {
      game.isStarted = true;
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const updatePlayerProgress = (gameId: string, playerName: string, progress: number, wpm: number, accuracy: number) => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];

    if (game && game.players[playerName]) {
      game.players[playerName].progress = progress;
      game.players[playerName].wpm = wpm;
      game.players[playerName].accuracy = accuracy;
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const handleGameComplete = (stats: { wpm: number; accuracy: number }) => {
    if (!gameData || !gameId) return;

    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];

    if (game && game.players[playerName]) {
      game.players[playerName].isFinished = true;
      game.players[playerName].wpm = stats.wpm;
      game.players[playerName].accuracy = stats.accuracy;
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const endGame = () => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    delete games[gameId];
    localStorage.setItem('multiplayerGames', JSON.stringify(games));
    // Reset game state
    setGameData(null);
    setGameId('');
    setPlayerName('');
    // Return to menu
    onBack();
  };

  const requestRestart = () => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];
    
    if (game) {
      game.restartPending = true;
      // Reset host's restart status
      game.players[playerName].restartRequested = true;
      // Generate new text for the next round
      game.text = generateTypingText({
        type: 'sentences',
        length: 500,
        useSentences: true
      });
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const acceptRestart = () => {
    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
    const game = games[gameId];
    
    if (game) {
      game.players[playerName].restartRequested = true;
      
      // Check if all players have accepted
      const allAccepted = Object.values(game.players).every(player => player.restartRequested);
      
      if (allAccepted) {
        // Reset all players' states
        Object.keys(game.players).forEach(playerName => {
          game.players[playerName] = {
            ...game.players[playerName],
            isFinished: false,
            progress: 0,
            wpm: 0,
            accuracy: 0,
            restartRequested: false
          };
        });
        game.restartPending = false;
      }
      
      games[gameId] = game;
      localStorage.setItem('multiplayerGames', JSON.stringify(games));
      setGameData(game);
      gameDataRef.current = game;
    }
  };

  const renderWaitingRoom = () => {
    if (!gameData) return null;
    
    const isHost = gameData.host === playerName;
    const allPlayersReady = Object.values(gameData.players).every(
      player => player.isReady
    );

    // Copy Game ID to clipboard
    const handleCopyGameId = () => {
      navigator.clipboard.writeText(gameId);
    };
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#23243a] via-[#1a1b2f] to-[#23243a]">
        {/* Static particles background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-30"
              style={{
                width: Math.random() * 12 + 8 + 'px',
                height: Math.random() * 12 + 8 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                background: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
              }}
            />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-2xl mx-auto p-8 bg-white/10 dark:bg-gray-900/60 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-xl flex flex-col items-center">
          <h2 className="text-4xl font-extrabold mb-2 text-center drop-shadow-lg" style={{
            fontFamily: 'Comic Sans MS, Comic Sans, cursive',
            color: '#f8f8ff',
            textShadow: '0 0 16px #b3e5fc, 0 0 32px #b3e5fc'
          }}>Waiting Room</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 mb-4">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Game ID:</span>
            <span className="text-lg font-mono text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-lg select-all">{gameId}</span>
            <button
              onClick={handleCopyGameId}
              className="ml-2 px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all"
            >
              Copy
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center text-base">Share this ID with your friends to join the game!</p>
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Players</h3>
            <div className="space-y-4">
              {Object.entries(gameData.players).map(([name, player]) => (
                <div key={name} className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${player.isReady ? 'bg-green-400 border-green-500' : 'bg-gray-300 border-gray-400'}`}></div>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span>
                    {name === gameData.host && (
                      <span className="text-xs text-blue-500 dark:text-blue-300 ml-1">(Host)</span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${player.isReady ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{player.isReady ? 'Ready' : 'Not Ready'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-4 w-full">
            {isHost && (
              <>
                <button
                  onClick={() => {
                    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
                    const game = games[gameId];
                    if (game && game.players[playerName]) {
                      game.players[playerName].isReady = true;
                      games[gameId] = game;
                      localStorage.setItem('multiplayerGames', JSON.stringify(games));
                      setGameData(game);
                      gameDataRef.current = game;
                    }
                  }}
                  disabled={gameData.players[playerName]?.isReady}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-all"
                >
                  {gameData.players[playerName]?.isReady ? 'Ready' : 'I\'m Ready'}
                </button>
                <button
                  onClick={() => {
                    const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
                    const game = games[gameId];
                    if (game) {
                      game.isStarted = true;
                      games[gameId] = game;
                      localStorage.setItem('multiplayerGames', JSON.stringify(games));
                      setGameData(game);
                      gameDataRef.current = game;
                    }
                  }}
                  disabled={!allPlayersReady || Object.keys(gameData.players).length < 2}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-all"
                >
                  Start Game
                </button>
              </>
            )}
            {!isHost && (
              <button
                onClick={() => {
                  const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
                  const game = games[gameId];
                  if (game && game.players[playerName]) {
                    game.players[playerName].isReady = true;
                    games[gameId] = game;
                    localStorage.setItem('multiplayerGames', JSON.stringify(games));
                    setGameData(game);
                    gameDataRef.current = game;
                  }
                }}
                disabled={gameData.players[playerName]?.isReady}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-all"
              >
                {gameData.players[playerName]?.isReady ? 'Ready' : 'I\'m Ready'}
              </button>
            )}
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-lg font-bold transition-all"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add polling for game state updates
  useEffect(() => {
    if (!gameId || !gameData) return;

    const pollInterval = setInterval(() => {
      const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
      const game = games[gameId];
      
      if (game) {
        // Always update the game data to ensure real-time updates
        setGameData(game);
        gameDataRef.current = game;
      }
    }, 50); // Poll every 50ms for more real-time updates

    return () => clearInterval(pollInterval);
  }, [gameId, gameData]);

  if (gameData?.isStarted) {
    const allFinished = Object.values(gameData.players).every(player => player.isFinished);
    const otherPlayer = Object.entries(gameData.players).find(([name]) => name !== playerName)?.[1];
    const showRestartControls = allFinished && !gameData.restartPending;
    const showRestartRequest = gameData.restartPending && !gameData.players[playerName].restartRequested;

    return (
      <div className="flex flex-col h-full">
        <TypingTest
          gameMode="multiplayer"
          timeLimit={60}
          onComplete={handleGameComplete}
          onBack={onBack}
          text={gameData.text}
          gameData={gameData}
          playerName={playerName}
          updatePlayerProgress={(progress, wpm, accuracy) => {
            const games = JSON.parse(localStorage.getItem('multiplayerGames') || '{}');
            const game = games[gameId];
            if (game && game.players[playerName]) {
              game.players[playerName].progress = progress;
              game.players[playerName].wpm = wpm;
              game.players[playerName].accuracy = accuracy;
              games[gameId] = game;
              localStorage.setItem('multiplayerGames', JSON.stringify(games));
              setGameData(game);
              gameDataRef.current = game;
            }
          }}
        />
        
        {/* Game controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-4 p-4 backdrop-blur-lg bg-white/10 rounded-lg shadow-lg border border-white/20">
            {playerName === gameData.host ? (
              <>
                {showRestartControls && (
                  <button
                    onClick={requestRestart}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Request Restart
                  </button>
                )}
                <button
                  onClick={endGame}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  End Game & Return to Menu
                </button>
              </>
            ) : (
              <>
                {showRestartRequest && (
                  <div className="flex items-center gap-4">
                    <span className="text-white">Host requested to restart the game</span>
                    <button
                      onClick={acceptRestart}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept Restart
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameData) {
    return renderWaitingRoom();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#23243a] via-[#1a1b2f] to-[#23243a]">
      {/* Static particles background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{
              width: Math.random() * 12 + 8 + 'px',
              height: Math.random() * 12 + 8 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
            }}
          />
        ))}
      </div>
      <div className="relative z-10 w-full max-w-lg mx-auto p-8 bg-white/10 dark:bg-gray-900/60 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-xl flex flex-col items-center">
        <h1 className="text-4xl font-extrabold mb-2 text-center drop-shadow-lg" style={{
          fontFamily: 'Comic Sans MS, Comic Sans, cursive',
          color: '#7ecbff',
          textShadow: '0 0 16px #b3e5fc, 0 0 32px #b3e5fc'
        }}>Multiplayer Game</h1>
        <p className="text-gray-200 mb-6 text-center text-base">Create a new game or join an existing one to race your friends in real-time typing battles!</p>
        <div className="w-full flex flex-col gap-4 mb-6">
          <label className="text-gray-200 font-semibold" htmlFor="playerName">Your Name</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg transition"
          />
        </div>
        <div className="w-full flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={createGame}
            className="flex-1 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-md transition-all duration-200"
          >
            Create Game
          </button>
          <input
            type="text"
            value={gameId}
            onChange={e => setGameId(e.target.value)}
            placeholder="Enter Game ID"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg transition"
          />
          <button
            onClick={joinGame}
            className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md transition-all duration-200"
          >
            Join Game
          </button>
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold text-lg mt-2 transition-all duration-200"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}; 