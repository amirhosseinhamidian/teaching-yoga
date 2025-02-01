export const validatePhoneNumber = (phone) => {
  // Regex to match Iranian mobile numbers starting with 09 and 11 digits in total
  const iranPhoneRegex = /^09\d{9}$/;

  if (iranPhoneRegex.test(phone)) {
    return { isValid: true, errorMessage: null };
  } else {
    return {
      isValid: false,
      errorMessage:
        'شماره موبایل معتبر نیست. شماره شما باید ۱۱ رقم باشد و با ۰۹ شروع شود.',
    };
  }
};
