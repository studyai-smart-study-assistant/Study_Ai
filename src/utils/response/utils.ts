
/**
 * Helper function to get a random element from an array
 * @param {Array} arr - The array to pick from
 * @returns {*} - Random element from array, or null if array is empty
 */
export function getRandomElement<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
