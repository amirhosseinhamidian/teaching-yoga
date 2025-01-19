import { gregorianToJalali } from 'shamsi-date-converter';

// Get the current date and time
export function getCurrentDateTime() {
  const now = new Date();
  return now;
}

// Get the current day of the month
export function getDay() {
  const now = new Date();
  return now.getDate(); // Day of the month (1-31)
}

// Get the current month (Months are zero-based, so we add 1)
export function getMonth() {
  const now = new Date();
  return now.getMonth() + 1; // Month (1-12)
}

// Get the current year
export function getYear() {
  const now = new Date();
  return now.getFullYear(); // Current year
}

// Get the current day of the week (0-6, where 0 is Sunday)
export function getDayOfWeek() {
  const now = new Date();
  return now.getDay(); // Day of the week (0-6)
}

// Get the current hour
export function getHours() {
  const now = new Date();
  return now.getHours(); // Hours (0-23)
}

// Get the current minutes
export function getMinutes() {
  const now = new Date();
  return now.getMinutes(); // Minutes (0-59)
}

// Get the current seconds
export function getSeconds() {
  const now = new Date();
  return now.getSeconds(); // Seconds (0-59)
}

// Format the date as yyyy-mm-dd
export function formatDateYYYYMMDD() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Add leading zero to the month
  const day = String(now.getDate()).padStart(2, '0'); // Add leading zero to the day
  return `${year}-${month}-${day}`;
}

export function formatTime(seconds, format = 'hh:mm:ss') {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hours = h.toString().padStart(2, '0');
  const minutes = m.toString().padStart(2, '0');
  const secs = s.toString().padStart(2, '0');

  switch (format) {
    case 'mm:ss':
      return `${minutes}:${secs}`;
    case 'hh:mm':
      return `${hours}:${minutes}`;
    case 'hh:mm:ss':
    default:
      return `${hours}:${minutes}:${secs}`;
  }
}

export function getStringTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hours = h.toString().padStart(2, '0');
  const minutes = m.toString().padStart(2, '0');
  const secs = s.toString().padStart(2, '0');
  return `${hours} ساعت ${minutes} دقیقه ${secs} ثانیه`;
}

export function getShamsiDate(dateString) {
  const date = new Date(dateString);
  return gregorianToJalali(date).join('/');
}

export function getTimeFromDate(dateString) {
  const date = new Date(dateString);
  return `${date.getHours()}:${date.getMinutes()}`;
}
