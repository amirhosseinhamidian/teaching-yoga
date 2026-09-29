/* eslint-disable no-undef */
'use client';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(
  () =>
    import('react-quill').then(({ default: QuillComponent }) => {
      const QuillWithForwardedRef = ({ forwardedRef, ...props }) => (
        <QuillComponent ref={forwardedRef} {...props} />
      );

      QuillWithForwardedRef.displayName = 'QuillWithForwardedRef';
      QuillWithForwardedRef.propTypes = {
        forwardedRef: PropTypes.shape({ current: PropTypes.any }),
      };

      return QuillWithForwardedRef;
    }),
  { ssr: false }
);

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
  .ql-editor .ql-course-card {
    direction: rtl;
    display: flex;
    align-items: center;
    min-height: 72px;
    margin: 18px 0;
    padding: 16px 18px;
    border: 1px solid rgba(38, 145, 125, 0.35);
    border-radius: 16px;
    background: rgba(38, 145, 125, 0.08);
    color: #26917d;
    font-weight: 700;
    text-decoration: none;
  }
  .ql-editor .ql-course-card::before {
    content: 'دوره پیشنهادی';
    margin-left: 12px;
    padding: 5px 9px;
    border-radius: 999px;
    background: #26917d;
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
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

const TextEditor = forwardRef(function TextEditor(
  {
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
  },
  ref
) {
  const quillRef = useRef(null);
  const lastSelectionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const Quill = require('quill');
      const ImageResize = require('quill-image-resize-module-react').default;

      if (!Quill.imports['formats/courseCard']) {
        const BlockEmbed = Quill.import('blots/block/embed');

        class CourseCardBlot extends BlockEmbed {
          static create(course) {
            const node = super.create();
            const slug = String(course?.shortAddress || '').trim();
            const title = String(course?.title || '').trim();

            node.setAttribute('href', `/courses/${encodeURIComponent(slug)}`);
            node.setAttribute('data-course-slug', slug);
            node.setAttribute('contenteditable', 'false');
            node.setAttribute('title', `مشاهده جزئیات دوره ${title}`);
            node.textContent = title;

            return node;
          }

          static value(node) {
            return {
              shortAddress: node.getAttribute('data-course-slug') || '',
              title: node.textContent || '',
            };
          }
        }

        CourseCardBlot.blotName = 'courseCard';
        CourseCardBlot.tagName = 'a';
        CourseCardBlot.className = 'ql-course-card';

        Quill.register(CourseCardBlot);
      }

      Quill.register('modules/imageResize', ImageResize);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    insertCourseCard(course) {
      const editor = quillRef.current?.getEditor?.();

      if (!editor || !course?.shortAddress || !course?.title) {
        return false;
      }

      const range = lastSelectionRef.current || editor.getSelection();
      const index = range?.index ?? Math.max(0, editor.getLength() - 1);

      if (range?.length) {
        editor.deleteText(index, range.length, 'user');
      }

      editor.insertEmbed(index, 'courseCard', course, 'user');
      editor.insertText(index + 1, '\n', 'user');
      editor.setSelection(index + 2, 0, 'silent');
      lastSelectionRef.current = { index: index + 2, length: 0 };

      return true;
    },
  }));
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
        forwardedRef={quillRef}
        value={value}
        onChange={handleChange}
        onChangeSelection={(range) => {
          if (range) {
            lastSelectionRef.current = range;
          }
        }}
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
});

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
