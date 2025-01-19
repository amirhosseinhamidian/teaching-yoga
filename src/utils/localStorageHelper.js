// Function to get an item from localStorage
export const getFromLocalStorage = (key, defaultValue = null) => {
  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null; // Parse JSON or return null
  }
  return defaultValue; // Return null during SSR or if localStorage is unavailable
};

// Function to set an item in localStorage
export const setToLocalStorage = (key, value) => {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(key, JSON.stringify(value)); // Stringify value
  } else {
    console.error('Failed to set item. localStorage is unavailable.');
  }
};

// Function to remove an item from localStorage
export const removeFromLocalStorage = (key) => {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(key);
  } else {
    console.error('Failed to remove item. localStorage is unavailable.');
  }
};

const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('localStorage is not available:', error);
    return false;
  }
};
