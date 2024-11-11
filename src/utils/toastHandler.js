import tailwindConfig from '@/tailwind.config';
import { toast } from 'react-hot-toast';
import resolveConfig from 'tailwindcss/resolveConfig';

const fullConfig = resolveConfig(tailwindConfig);

export const createToastHandler = (isDarkMode) => {
  const successStyle = {
    backgroundColor: isDarkMode
      ? fullConfig.theme.colors.background.dark
      : fullConfig.theme.colors.background.light,
    color: isDarkMode
      ? fullConfig.theme.colors.text.dark
      : fullConfig.theme.colors.text.light,
  };

  const errorStyle = {
    backgroundColor: fullConfig.theme.colors.red,
    color: fullConfig.theme.colors.text.dark,
  };

  const customStyle = {
    backgroundColor: isDarkMode
      ? fullConfig.theme.colors.surface.dark
      : fullConfig.theme.colors.surface.light,
    color: isDarkMode
      ? fullConfig.theme.colors.text.dark
      : fullConfig.theme.colors.text.light,
  };

  const loading = {
    backgroundColor: isDarkMode
      ? fullConfig.theme.colors.background.dark
      : fullConfig.theme.colors.background.light,
    color: isDarkMode
      ? fullConfig.theme.colors.text.dark
      : fullConfig.theme.colors.text.light,
  };

  return {
    showSuccessToast: (message, options = {}) => {
      toast.success(message, {
        duration: 4000,
        style: successStyle,
        ...options,
      });
    },

    showErrorToast: (message, options = {}) => {
      toast.error(message, {
        duration: 4000,
        style: errorStyle,
        ...options,
      });
    },

    showCustomToast: (message, options = {}) => {
      toast(message, {
        duration: 4000,
        style: customStyle,
        ...options,
      });
    },

    showLoadingToast: (message, options = {}) => {
      toast.loading(message, {
        duration: Infinity,
        style: loading,
        ...options,
      });
    },

    handlePromiseToast: (promise, messages) => {
      const { loadingMessage, successMessage, errorMessage } = messages;

      toast.promise(
        promise,
        {
          loading: loadingMessage,
          success: successMessage,
          error: errorMessage,
        },
        {
          style: loading,
          success: successStyle,
          error: errorStyle,
        },
      );
    },
  };
};
