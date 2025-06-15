import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AITypingSimulator } from '@/utils/aiTyping';
import { generateTypingText } from '@/utils/wordLists';

interface TypingTestProps {
  gameMode: 'classic' | 'dynamic' | 'ai';
  timeLimit: number;
  onComplete: (stats: TypingStats) => void;
  onBack: () => void;
  text?: string;
}

interface TypingStats {
  wpm: number;
  accuracy: number;
  totalTime: number;
  mistakes: number;
}

type TextType = 'common' | 'medium' | 'difficult' | 'programming' | 'sentences' | 'tongueTwisters';
type AIPersonality = 'careful' | 'balanced' | 'aggressive';



const TypingTest: React.FC<TypingTestProps> = ({ 
  gameMode, 
  timeLimit, 
  onComplete, 
  onBack,
  text: initialText
}) => {
  const [text, setText] = useState<string>(initialText || '');
  const [userInput, setUserInput] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(timeLimit);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiMistakes, setAiMistakes] = useState<number>(0);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('balanced');
  const [aiSimulator, setAiSimulator] = useState(() => new AITypingSimulator({ personality: 'balanced' }));
  const [currentWPM, setCurrentWPM] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const textContainerRef = useRef<HTMLDivElement>(null);  const [typedText, setTypedText] = useState<string>('');
  
  // Dynamic speed mode states
  const [textSpeed, setTextSpeed] = useState<number>(3.0); // Start at 3x speed
  const [speedIncreasing, setSpeedIncreasing] = useState<boolean>(true); // Track direction
  const [visibleText, setVisibleText] = useState<string>('');
  const [textPosition, setTextPosition] = useState<number>(0);
  const lastPerformanceCheck = useRef<number>(Date.now());
  const performanceHistory = useRef<{accuracy: number, timestamp: number}[]>([]);
  
  // Text selection
  const [textType, setTextType] = useState<TextType>('sentences');
  const [useSentences, setUseSentences] = useState<boolean>(true);
  const [showTextOptions, setShowTextOptions] = useState<boolean>(false);
  const [showAIOptions, setShowAIOptions] = useState<boolean>(false);
  const [isTestComplete, setIsTestComplete] = useState<boolean>(false);
  
  // Timer refs for more reliable timing
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerUpdateRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Generate initial text
  useEffect(() => {
    let newText = generateTypingText({
      type: textType,
      length: 200,
      useSentences
    });
    setText(newText);
    
    // Initialize visible text for dynamic speed mode
    if (gameMode === 'dynamic') {
      setVisibleText(newText.substring(0, 20)); // Show first 20 characters initially
      setTextPosition(20);
    }
    
    // Reset states
    setUserInput('');
    setCurrentIndex(0);
    setMistakes(0);
    setAiInput('');
    setAiMistakes(0);
    setIsActive(false);
    setRemainingTime(timeLimit);
    setTextSpeed(3.0); // Start at 3x speed
    setSpeedIncreasing(true); // Start in increasing mode
    setElapsedTime(0);
    setIsTestComplete(false);
    lastTickRef.current = Date.now();
    startTimeRef.current = null;
    
    // Clear any existing intervals
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
    }
    if (timerUpdateRef.current !== null) {
      cancelAnimationFrame(timerUpdateRef.current);
    }
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
    }
  }, [gameMode, aiSimulator, textType, useSentences, timeLimit, initialText]);

  // Handle AI personality change
  const handleAIPersonalityChange = (personality: AIPersonality) => {
    setAiPersonality(personality);
    setAiSimulator(new AITypingSimulator({ personality }));
    setShowAIOptions(false);
  };

  // Handle dynamic speed mode text scrolling
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;
    
    if (gameMode === 'dynamic' && isActive) {
      const scrollInterval = Math.max(20, 1000 / textSpeed); // Minimum 20ms interval for smoother scrolling at high speeds
      
      scrollTimer = setInterval(() => {
        setTextPosition(prev => {
          const newPosition = prev + 1;
          if (newPosition <= text.length) {
            setVisibleText(text.substring(0, newPosition));
            return newPosition;
          } else {
            clearInterval(scrollTimer);
            return prev;
          }
        });
      }, scrollInterval);
    }
    
    return () => clearInterval(scrollTimer);
  }, [gameMode, isActive, text, textSpeed]);

  // Check performance and adjust speed for dynamic speed mode
  useEffect(() => {
    if (gameMode === 'dynamic' && isActive && userInput.length > 0) {
      const now = Date.now();
      const timeSinceLastCheck = now - lastPerformanceCheck.current;
      
      // Check performance more frequently - every 300ms for even faster response
      if (timeSinceLastCheck > 300) {
        const accuracy = ((userInput.length - mistakes) / userInput.length) * 100;
        
        // Add to performance history
        performanceHistory.current.push({
          accuracy,
          timestamp: now
        });
        
        // Keep only last 2 performance checks for even faster response
        if (performanceHistory.current.length > 2) {
          performanceHistory.current.shift();
        }
        
        // Calculate average accuracy
        const avgAccuracy = performanceHistory.current.reduce((sum, item) => sum + item.accuracy, 0) / 
                           performanceHistory.current.length;
        
        // Oscillating speed adjustments
        if (avgAccuracy > 85) {
          setTextSpeed(prev => {
            let newSpeed;
            if (speedIncreasing) {
              newSpeed = prev + 1.0;
              if (newSpeed >= 20.0) {
                setSpeedIncreasing(false);
                return 20.0;
              }
            } else {
              newSpeed = prev - 1.0;
              if (newSpeed <= 3.0) {
                setSpeedIncreasing(true);
                return 3.0;
              }
            }
            return newSpeed;
          });
        }
        
        lastPerformanceCheck.current = now;
      }
    }
  }, [gameMode, isActive, userInput, mistakes, speedIncreasing]);

  // Handle AI typing
  useEffect(() => {
    let aiTimer: NodeJS.Timeout;
    if (gameMode === 'ai' && isActive) {
      aiTimer = setInterval(() => {
        const { char, isMistake } = aiSimulator.getNextChar();
        if (char) {
          setAiInput(prev => prev + char);
          if (isMistake) {
            setAiMistakes(prev => prev + 1);
          }
        }
      }, 50); // Update AI typing every 50ms
    }
    return () => clearInterval(aiTimer);
  }, [gameMode, isActive, aiSimulator]);

  // Improved timer using a combination of approaches for smoother updates
  useEffect(() => {
    if (isActive && !isTestComplete) {
      // Store the start time in a ref to avoid closure issues
      startTimeRef.current = Date.now();
      
      if (gameMode === 'classic') {
        // For classic mode, use requestAnimationFrame for smooth elapsed time
        const tick = () => {
          const now = Date.now();
          const deltaTime = (now - lastTickRef.current) / 1000; // Convert to seconds
          lastTickRef.current = now;
          
          // For classic mode, just track elapsed time
          setElapsedTime(prev => prev + deltaTime);
          
          // Continue the animation frame loop
          timerRef.current = requestAnimationFrame(tick);
        };
        
        // Start the animation frame loop
        timerRef.current = requestAnimationFrame(tick);
      } else if (gameMode === 'ai') {
        // For AI mode, use a simple interval that updates every second
        const timerInterval = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);

        // Store the interval ID for cleanup
        intervalRef.current = timerInterval;
      } else if (gameMode === 'dynamic') {
        // For dynamic mode, use a dedicated interval that runs independently
        // Clear any existing interval first
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        
        // Create a new interval that runs every 100ms
        countdownIntervalRef.current = setInterval(() => {
          // Calculate remaining time based on absolute time difference
          const now = Date.now();
          const elapsed = (now - startTimeRef.current!) / 1000;
          const remaining = Math.max(0, timeLimit - elapsed);
          
          // Update the remaining time state
          setRemainingTime(remaining);
          
          // If time is up, clear the interval
          if (remaining <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
          }
        }, 100);
      }

    } else if ((gameMode !== 'classic' && gameMode !== 'ai' && gameMode !== 'dynamic' && remainingTime === 0) || isTestComplete) {
      // Only calculate stats if not already done in handleInput
      if (!isTestComplete) {
        // Calculate stats
        const endTime = Date.now();        const totalTime = gameMode === 'classic' 
          ? elapsedTime 
          : (endTime - (startTimeRef.current || endTime)) / 1000;
        const words = userInput.length / 5;
        const wpm = (words / totalTime) * 60;
        const accuracy = ((userInput.length - mistakes) / userInput.length) * 100;

        onComplete?.({
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy),
          totalTime: totalTime,
          mistakes
        });
      }
    }

    // Cleanup function to cancel the animation frame and interval
    return () => {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      if (timerUpdateRef.current !== null) {
        cancelAnimationFrame(timerUpdateRef.current);
      }
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isActive, remainingTime, userInput, mistakes, onComplete, gameMode, elapsedTime, isTestComplete, timeLimit]);

  

 

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) {
      setIsActive(true);
      setStartTime(Date.now());
      startTimeRef.current = Date.now();
      lastTickRef.current = Date.now(); // Reset the last tick time when starting
      
      // For ai mode, start the AI typing immediately when user starts
      if (gameMode === 'ai') {
        aiSimulator.startTyping(text);
      }
    }

    const input = e.target.value;
    
    // Prevent deleting mistakes - only allow adding new characters
    if (input.length < userInput.length) {
      // If trying to delete, keep the previous input
      e.target.value = userInput;
      return;
    }
    
    // If test is already complete, don't update anything
    if (isTestComplete) {
      e.target.value = userInput;
      return;
    }
    
    setUserInput(input);
    setTypedText(input);

    // Check for mistakes
    let newMistakes = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== text[i]) {
        newMistakes++;
      }
    }
    
    // Calculate current WPM and accuracy
    const timeElapsed = (Date.now() - (startTime || Date.now())) / 1000 / 60; // in minutes
    const wordsTyped = input.length / 5;
    const currentWPM = Math.round(wordsTyped / timeElapsed);
    const currentAccuracy = Math.round(((input.length - newMistakes) / input.length) * 100) || 100;

    setCurrentWPM(currentWPM);
    setAccuracy(currentAccuracy);
    
    // Handle classic mode - add time for each new mistake
    if (gameMode === 'classic' && newMistakes > mistakes) {
      const additionalMistakes = newMistakes - mistakes;
      setElapsedTime(prev => prev + (additionalMistakes * 1)); // Add 1 second per mistake
    }
    
    setMistakes(newMistakes);

    // Update current index
    setCurrentIndex(input.length);
    
    // Check if test is complete (all text typed)
    if (input.length === text.length) {
      setIsTestComplete(true);
      
      // Calculate stats immediately when test is complete
      const endTime = Date.now();      const totalTime = gameMode === 'classic' 
        ? elapsedTime 
        : (endTime - (startTimeRef.current || endTime)) / 1000;
      const words = input.length / 5;
      const wpm = (words / totalTime) * 60;
      const accuracy = ((input.length - newMistakes) / input.length) * 100;

      onComplete?.({
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        totalTime: totalTime,
        mistakes: newMistakes
      });
    }
  }, [isActive, text, mistakes, gameMode, userInput, isTestComplete, elapsedTime, onComplete, aiSimulator, startTime]);

  // Handle text type change
  const handleTextTypeChange = (type: TextType) => {
    setTextType(type);
    setShowTextOptions(false);
  };

  // Handle sentence toggle
  const handleSentenceToggle = () => {
    setUseSentences(!useSentences);
  };

  // Render text based on mode
  const renderText = () => {
    if (gameMode === 'dynamic') {
      return (
        <div className="text-lg leading-relaxed">
          {visibleText.split('').map((char, index) => (
            <span
              key={index}
              className={`${
                index < currentIndex
                  ? userInput[index] === char
                    ? 'text-green-500'
                    : 'text-red-500'
                  : index === currentIndex
                  ? 'bg-blue-200 dark:bg-blue-800'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {char}
            </span>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-lg leading-relaxed">
          {text.split('').map((char, index) => (
            <span
              key={index}
              className={`${
                index < currentIndex
                  ? userInput[index] === char
                    ? 'text-green-500'
                    : 'text-red-500'
                  : index === currentIndex
                  ? 'bg-blue-200 dark:bg-blue-800'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {char}
            </span>
          ))}
        </div>
      );
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-500"
        style={{
          background: gameMode === 'dynamic' 
            ? `radial-gradient(circle at ${currentIndex % 100}% ${(textSpeed * 5) % 100}%, 
                rgba(${Math.min(255, textSpeed * 20)}, ${Math.max(0, 255 - textSpeed * 10)}, ${Math.max(0, 255 - textSpeed * 20)}, 0.3),
                rgba(17, 24, 39, 0.95))`
            : 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2), rgba(17, 24, 39, 0.95))'
        }}
      >
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-30 animate-float"
              style={{
                width: Math.random() * 10 + 5 + 'px',
                height: Math.random() * 10 + 5 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                background: gameMode === 'dynamic' 
                  ? `rgba(${Math.min(255, textSpeed * 20)}, ${Math.max(0, 255 - textSpeed * 10)}, ${Math.max(0, 255 - textSpeed * 20)}, 0.5)`
                  : 'rgba(59, 130, 246, 0.5)',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto p-6">
        <div className="mb-8 text-center">          <h1 
            className="text-4xl font-bold mb-4 text-white" 
            style={{ 
              fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
              textShadow: `0 0 10px ${
                gameMode === 'classic' ? 'hsla(210, 70%, 60%, 0.7)' :
                gameMode === 'dynamic' ? 'hsla(120, 70%, 60%, 0.7)' :
                'hsla(270, 70%, 60%, 0.7)'
              }`
            }}
          >
            {gameMode === 'classic' ? 'Classic Mode' :
             gameMode === 'dynamic' ? 'Dynamic Speed Mode' :
             'AI Rival Mode'}
          </h1>
          <p className="text-gray-300 text-lg mb-6" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
            {gameMode === 'classic' ? 'Test your typing speed with a fixed time limit. Focus on accuracy and consistency. Each mistake will cost you a second to the timer. Try to finish with the quickest time!' :
             gameMode === 'dynamic' ? 'Challenge yourself with increasing speeds. The text moves faster as you type accurately. Change the text type to see how you perform with different types of text.' :
             'Compete against an AI that adapts to your skill level. Can you outpace the machine?'}
          </p>
        </div>

        <div className="mb-4 flex justify-between items-center backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 rounded-lg p-4">
          <button
            onClick={() => {
              // Reset all states and go back
              setUserInput('');
              setCurrentIndex(0);
              setMistakes(0);
              setAiInput('');
              setAiMistakes(0);
              setIsActive(false);
              setRemainingTime(timeLimit);
              setTextSpeed(3.0);
              setSpeedIncreasing(true);
              setElapsedTime(0);
              setIsTestComplete(false);
              if (onBack) onBack();
            }}
            className="px-1 py-1.5 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-lg transition-colors backdrop-blur-sm flex items-center gap-0 text-sm mr-6"
          >
            <span>←</span> Back to Modes
          </button>
          <div className="flex items-center gap-7">
            {!isTestComplete ? (
              <>
                {gameMode === 'classic' && (
                  <div className="text-xl font-bold text-white">Time: {elapsedTime.toFixed(1)}s</div>
                )}
                {gameMode === 'dynamic' && (
                  <div className="text-xl font-bold text-white">
                    Speed: <span className="text-blue-400">{textSpeed.toFixed(1)}x</span>
                  </div>
                )}
                {gameMode === 'ai' && (
                  <div className="text-xl font-bold text-white">
                    AI Progress: <span className="text-purple-400">{Math.round((aiInput.length / text.length) * 100)}%</span>
                  </div>
                )}
                <div className="text-xl font-bold text-white">Mistakes: {mistakes}</div>
                <div className="text-xl font-bold text-white">WPM: {currentWPM}</div>
                <div className="text-xl font-bold text-white">Accuracy: {accuracy}%</div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-white">Final WPM: {currentWPM}</div>
                <div className="text-xl font-bold text-white">Accuracy: {accuracy}%</div>
                <div className="text-xl font-bold text-white">Mistakes: {mistakes}</div>
                {gameMode === 'classic' && (
                  <div className="text-xl font-bold text-white">Time: {elapsedTime.toFixed(1)}s</div>
                )}
                {gameMode === 'dynamic' && (
                  <div className="text-xl font-bold text-white">
                    Max Speed: <span className="text-blue-400">{textSpeed.toFixed(1)}x</span>
                  </div>
                )}
                {gameMode === 'ai' && (
                  <div className="text-xl font-bold text-white">
                    AI Mistakes: <span className="text-purple-400">{aiMistakes}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      
        {/* Text selection options */}
        {!isActive && (
          <div className="mb-4 p-4 backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 rounded-lg border border-white/20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Text Options</h3>
              <button 
                onClick={() => setShowTextOptions(!showTextOptions)}
                className="px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded transition-colors backdrop-blur-sm"
              >
                {showTextOptions ? 'Hide Options' : 'Change Text'}
              </button>
            </div>
            
            {showTextOptions && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['common', 'medium', 'difficult', 'programming', 'sentences', 'tongueTwisters'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => handleTextTypeChange(type as TextType)}
                      className={`px-3 py-1 rounded transition-all duration-300 ${
                        textType === type 
                          ? 'bg-green-500/80 text-white scale-105' 
                          : 'bg-gray-200/20 hover:bg-gray-300/20 text-white'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer text-white">
                    <input 
                      type="checkbox" 
                      checked={useSentences} 
                      onChange={handleSentenceToggle}
                      className="mr-2"
                    />
                    <span>Use complete sentences</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      
        {/* AI personality options */}
        {gameMode === 'ai' && !isActive && (
          <div className="mb-4 p-4 backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 rounded-lg border border-white/20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">AI Personality</h3>
              <button 
                onClick={() => setShowAIOptions(!showAIOptions)}
                className="px-3 py-1 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded transition-colors backdrop-blur-sm"
              >
                {showAIOptions ? 'Hide Options' : 'Change AI'}
              </button>
            </div>
            
            {showAIOptions && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleAIPersonalityChange('careful')}
                    className={`px-3 py-1 rounded ${aiPersonality === 'careful' ? 'bg-green-500/80 text-white' : 'bg-gray-200/20 hover:bg-gray-300/20 text-white'}`}
                  >
                    Careful (Slow & Accurate)
                  </button>
                  <button 
                    onClick={() => handleAIPersonalityChange('balanced')}
                    className={`px-3 py-1 rounded ${aiPersonality === 'balanced' ? 'bg-green-500/80 text-white' : 'bg-gray-200/20 hover:bg-gray-300/20 text-white'}`}
                  >
                    Balanced
                  </button>
                  <button 
                    onClick={() => handleAIPersonalityChange('aggressive')}
                    className={`px-3 py-1 rounded ${aiPersonality === 'aggressive' ? 'bg-green-500/80 text-white' : 'bg-gray-200/20 hover:bg-gray-300/20 text-white'}`}
                  >
                    Aggressive (Fast & Error-Prone)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      
        <div className="mb-8 p-4 backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 rounded-lg border border-white/20">
          {renderText()}
        </div>

        {gameMode === 'ai' && (
          <div className="mb-4 p-4 backdrop-blur-lg bg-white/10 dark:bg-gray-800/30 rounded-lg border border-white/20">
            <div className="text-sm text-gray-300 mb-2">
              AI Progress ({aiPersonality}):
            </div>
            <div className="text-lg leading-relaxed">
              {text.split('').map((char, index) => (
                <span
                  key={index}
                  className={`${
                    index < aiInput.length
                      ? aiInput[index] === char
                        ? 'text-green-400'
                        : 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-300">
              AI Mistakes: {aiMistakes}
            </div>
          </div>
        )}

        {/* Input field */}
        {(
          <input
            type="text"
            value={userInput}
            onChange={handleInput}
            className="w-full p-4 text-lg backdrop-blur-lg bg-white/5 dark:bg-gray-800/30 border-2 border-white/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white placeholder-gray-400"
            placeholder="Start typing..."
            disabled={isTestComplete || (gameMode !== 'ai' && remainingTime === 0)}
          />
        )}
        {isTestComplete && (          <div className="mt-4 p-6 backdrop-blur-lg bg-white/10 rounded-lg text-center border border-white/20">
            <h3 className="text-2xl font-bold text-green-400 mb-4">Test Complete!</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  // Reset all states
                  setUserInput('');
                  setCurrentIndex(0);
                  setMistakes(0);
                  setAiInput('');
                  setAiMistakes(0);
                  setIsActive(false);
                  setRemainingTime(timeLimit);
                  setTextSpeed(3.0);
                  setSpeedIncreasing(true);
                  setElapsedTime(0);
                  setIsTestComplete(false);
                  // Generate new text
                  const newText = generateTypingText({
                    type: textType,
                    length: 200,
                    useSentences
                  });
                  setText(newText);
                  if (gameMode === 'dynamic') {
                    setVisibleText(newText.substring(0, 20));
                    setTextPosition(20);
                  }
                }}
                className="px-6 py-3 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-lg transition-colors backdrop-blur-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (onBack) onBack();
                }}
                className="px-6 py-3 bg-gray-500/80 hover:bg-gray-600/80 text-white rounded-lg transition-colors backdrop-blur-sm"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>

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
};

export default TypingTest;