import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-react';
// ثبت ماژول تغییر سایز تصویر در Quill
Quill.register('modules/imageResize', ImageResize);

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const customStyles = `
  .ql-editor {
    direction: ltr;
    text-align: right;
    font-family: 'PersianNumbers', Arial, sans-serif;
    min-height: 200px;
  }
  .ql-toolbar {
    direction: ltr;
  }
  .ql-editor iframe {
    max-width: 100%;
    height: auto;
  }
     .ql-editor img {
    display: block;
    margin: 10px auto; /* تنظیم خودکار برای وسط‌چین شدن */
    max-width: 100%; /* جلوگیری از بزرگ‌تر شدن از عرض صفحه */
    height: auto;
  }
    @media (prefers-color-scheme: dark) {
    .ql-container.ql-snow .ql-editor::before {
      color: #BFBFBF;
    }
  }
`;

const getPlainText = (html) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

const TextEditor = ({
  placeholder = '',
  value,
  onChange,
  className = '',
  fullWidth = false,
  errorMessage = '',
  errorClassName = 'mr-3',
  label = '',
  maxLength,
  toolbarItems = [],
}) => {
  const handleChange = (value) => {
    if (!maxLength || getPlainText(value).length <= maxLength) {
      onChange(value);
    }
  };

  const modules = {
    toolbar: [...toolbarItems],
    imageResize: {
      displaySize: true,
      modules: ['Resize', 'DisplaySize', 'Toolbar'], // ماژول‌های فعال برای تغییر سایز
    },
  };

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      <div className='flex items-end justify-between'>
        {label && (
          <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
            {label}
          </label>
        )}

        {maxLength && (
          <div className='ml-4 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
            {getPlainText(value).length}/{maxLength}
          </div>
        )}
      </div>
      <style>{customStyles}</style>
      <ReactQuill
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-solid ${
          errorMessage
            ? 'border-red focus:ring-red'
            : 'border-accent focus:ring-accent'
        } bg-background-light px-4 py-2 text-text-light transition duration-200 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 dark:bg-background-dark dark:text-text-dark placeholder:dark:text-subtext-dark ${className}`}
        modules={modules}
      />

      {errorMessage && (
        <p className={`mt-1 text-xs text-red ${errorClassName}`}>
          *{errorMessage}
        </p>
      )}
    </div>
  );
};

TextEditor.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  errorClassName: PropTypes.string,
  fullWidth: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  maxLength: PropTypes.number,
  toolbarItems: PropTypes.array,
};

TextEditor.defaultProps = {
  toolbarItems: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ align: [] }, { direction: 'rtl' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

export default TextEditor;
