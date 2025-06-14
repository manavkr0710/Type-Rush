// Word lists for typing challenges
export const wordLists = {
  common: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", 
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what"
  ],
  
  medium: [
    "about", "which", "when", "make", "like", "time", "just", "people", "into", "year",
    "good", "some", "could", "them", "see", "other", "than", "then", "now", "look",
    "only", "come", "its", "over", "think", "also", "back", "after", "use", "two",
    "how", "our", "work", "first", "well", "way", "even", "new", "want", "because"
  ],
  
  difficult: [
    "through", "during", "million", "available", "experience", "development", "technology", "information", "government", "education",
    "different", "important", "necessary", "particular", "difficult", "possible", "successful", "beautiful", "wonderful", "excellent",
    "challenge", "opportunity", "responsibility", "environment", "relationship", "communication", "organization", "management", "leadership", "professional"
  ],
    programming: [
    "function", "variable", "class", "object", "method", "array", "string", "integer", "boolean", "loop",
    "condition", "algorithm", "database", "interface", "component", "parameter", "argument", "return", "import", "export",
    "async", "await", "promise", "callback", "event", "handler", "state", "props", "context", "hook"
  ],
  
  sentences: [
    "The quick brown fox jumps over the lazy dog.",
    "Pack my box with five dozen liquor jugs.",
    "How vexingly quick daft zebras jump!",
    "The five boxing wizards jump quickly.",
    "Sphinx of black quartz, judge my vow.",
    "Crazy Fredrick bought many very exquisite opal jewels.",
    "We promptly judged antique ivory buckles for the next prize.",
    "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.",
    "Jaded zombies acted quaintly but kept driving their oxen forward.",
    "The job requires extra pluck and zeal from every young wage earner."
  ],
  
  tongueTwisters: [
    "Peter Piper picked a peck of pickled peppers.",
    "She sells seashells by the seashore.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "All that glitters is not gold.",
    "Red rabbits rarely run right.",
    "Unique New York, unique New York, you know you need unique New York.",
    "I scream, you scream, we all scream for ice cream.",
    "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn't fuzzy, was he?",
    "Betty Botter bought some butter, but she said the butter's bitter.",
    "If I put it in my batter, it will make my batter bitter."
  ]
};

export type TextType = 'common' | 'medium' | 'difficult' | 'programming' | 'sentences' | 'tongueTwisters';

export const sampleTexts = {
  common: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
    "Sphinx of black quartz, judge my vow. The wizard quickly jinxed the gnomes before they vaporized. How quickly daft jumping zebras vex!",
    "Jaded zombies acted quaintly but kept driving their oxen forward. The job requires extra pluck and zeal from every young wage earner.",
    "All questions asked by five watch experts amazed the judge. Sixty zippers were quickly picked from the woven jute bag.",
    "Crazy Fredrick bought many very exquisite opal jewels. We promptly judged antique ivory buckles for the next prize."
  ],
  medium: [
    "The enigmatic quantum computer processed complex algorithms with unprecedented efficiency, revolutionizing data analysis.",
    "Neuroscientists discovered remarkable plasticity in the human brain, enabling rapid adaptation to new cognitive challenges.",
    "The intricate ecosystem of the Amazon rainforest harbors countless undiscovered species, each playing a vital role.",
    "Quantum entanglement continues to baffle physicists, challenging our fundamental understanding of space and time.",
    "The Renaissance period witnessed an extraordinary fusion of art, science, and humanism, transforming European culture."
  ],
  difficult: [
    "The juxtaposition of quantum mechanics and general relativity presents an epistemological conundrum that challenges our ontological assumptions about the nature of reality.",
    "The phenomenological approach to consciousness necessitates a thorough examination of the intersubjective nature of human experience and its transcendental conditions.",
    "The anthropomorphic tendencies in artificial intelligence development raise profound ethical questions about the ontological status of machine consciousness.",
    "The hermeneutic circle of interpretation reveals the dialectical relationship between the whole and its constituent parts in textual analysis.",
    "The epistemological foundations of scientific methodology must account for the inherent uncertainty principle in quantum measurement."
  ],
  programming: [
    "const debounce = (fn, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => fn.apply(this, args), delay); }; };",
    "async function* asyncGenerator() { for await (const chunk of stream) { yield processChunk(chunk); } }",
    "class Observable { constructor() { this.subscribers = new Set(); } subscribe(callback) { this.subscribers.add(callback); return () => this.subscribers.delete(callback); } }",
    "const memoize = fn => { const cache = new Map(); return (...args) => { const key = JSON.stringify(args); return cache.has(key) ? cache.get(key) : cache.set(key, fn(...args)).get(key); }; };",
    "function* fibonacci() { let [prev, curr] = [0, 1]; while (true) { yield curr; [prev, curr] = [curr, prev + curr]; } }"
  ],
  sentences: [
    "The sun cast long shadows across the meadow as the day drew to a close, painting the sky in brilliant hues of orange and purple.",
    "Quantum computers, leveraging the principles of superposition and entanglement, promise to revolutionize fields from cryptography to drug discovery.",
    "The ancient library, with its towering shelves of leather-bound volumes, held centuries of accumulated knowledge waiting to be discovered.",
    "Neural networks, inspired by the human brain's structure, have transformed our approach to solving complex pattern recognition problems.",
    "The symphony orchestra, with its perfect harmony of diverse instruments, created a masterpiece that moved the audience to tears."
  ],
  tongueTwisters: [
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood? He would chuck, he would, as much as he could, and chuck as much wood as a woodchuck would if a woodchuck could chuck wood.",
    "Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked. If Peter Piper picked a peck of pickled peppers, where's the peck of pickled peppers Peter Piper picked?",
    "She sells seashells by the seashore. The shells she sells are surely seashells. So if she sells shells on the seashore, I'm sure she sells seashore shells.",
    "How can a clam cram in a clean cream can? If a clam can cram in a clean cream can, then a clean cream can can cram a clam.",
    "Betty Botter bought some butter, but she said the butter's bitter. If I put it in my batter, it will make my batter bitter."
  ]
};

export const generateTypingText = ({ type, length, useSentences }: { type: TextType, length: number, useSentences: boolean }) => {
  const texts = sampleTexts[type];
  const randomText = texts[Math.floor(Math.random() * texts.length)];
  
  if (useSentences) {
    return randomText;
  }
  
  // If not using sentences, split into words and take a random subset
  const words = randomText.split(/\s+/);
  const selectedWords = [];
  let currentLength = 0;
  
  while (currentLength < length && words.length > 0) {
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];
    selectedWords.push(word);
    currentLength += word.length + 1; 
    words.splice(randomIndex, 1);
  }
  
  return selectedWords.join(' ');
};

// Get a specific word list
export function getWordList(type: keyof typeof wordLists): string[] {
  return wordLists[type];
} 