// Function to get an item from localStorage
export const getFromLocalStorage = (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null; // Parse JSON or return null
  };
  
  // Function to set an item in localStorage
  export const setToLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value)); // Stringify value
  };
  
  // Function to remove an item from localStorage
  export const removeFromLocalStorage = (key) => {
    localStorage.removeItem(key);
  };