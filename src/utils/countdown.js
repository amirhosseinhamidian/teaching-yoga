export const countdown = (seconds, onTick) => {
    return new Promise((resolve) => {
      let remainingTime = seconds;
  
      const interval = setInterval(() => {
        if (remainingTime > 0) {
          remainingTime--;
          const minutes = String(Math.floor(remainingTime / 60)).padStart(2, '0');
          const seconds = String(remainingTime % 60).padStart(2, '0');
          onTick(`${minutes}:${seconds}`);  // Send updated time on each tick
        } else {
          clearInterval(interval);
          resolve({ time: '00:00', isFinished: true });  // When countdown ends
        }
      }, 1000);
    });
  };