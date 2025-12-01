import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const validatePhoneNumber = (phone) => {
  // اگر phone نبود یا string نبود
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      errorMessage: 'شماره موبایل معتبر نیست.',
    };
  }

  let cleaned = phone.trim();

  // اگر کاربر 00 نوشته، به + تبدیل کن
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // شماره بین‌المللی
  if (cleaned.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(cleaned);
    if (!parsed || !parsed.isValid()) {
      return {
        isValid: false,
        errorMessage: 'شماره بین‌المللی وارد شده معتبر نیست.',
      };
    }
    return { isValid: true, errorMessage: null };
  }

  // شماره ایران
  const iranPhoneRegex = /^09\d{9}$/;
  if (iranPhoneRegex.test(cleaned)) {
    return { isValid: true, errorMessage: null };
  }

  return {
    isValid: false,
    errorMessage:
      'شماره موبایل معتبر نیست. شماره باید با ۰۹ یا + شروع شود و معتبر باشد.',
  };
};
