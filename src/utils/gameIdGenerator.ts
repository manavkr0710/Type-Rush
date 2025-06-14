/**
 * Generates a random game ID for multiplayer mode
 * @returns A random 6-character alphanumeric string
 */
export const generateGameId = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Validates if a string is a valid game ID
 * @param id The ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export const isValidGameId = (id: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(id);
}; 