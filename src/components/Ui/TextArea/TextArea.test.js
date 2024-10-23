/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextArea from './TextArea'; // Adjust the path as needed

describe('TextArea Component', () => {
  const setup = (props = {}) => {
    render(<TextArea {...props} />);
  };

  test('renders with the placeholder text', () => {
    // Test if the textarea renders with the correct placeholder
    setup({ placeholder: 'Enter text here' });
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  test('displays the label when provided', () => {
    // Test if the label is displayed when provided
    setup({ label: 'Test Label' });
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
  });

  test('handles value changes', () => {
    // Test if the textarea updates its value on change
    const handleChange = jest.fn();
    setup({ value: '', onChange: handleChange });
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'New value' } });
    expect(handleChange).toHaveBeenCalledWith('New value');
  });

  test('shows error message when errorMessage prop is passed', () => {
    // Test if the error message is displayed when errorMessage is provided
    setup({ errorMessage: 'This is an error message' });
    const errorMessage = screen.getByText('*This is an error message');
    expect(errorMessage).toBeInTheDocument();
  });

  test('applies error styles when errorMessage is provided', () => {
    // Test if error styles are applied when errorMessage is present
    setup({ errorMessage: 'This is an error message' });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-red');
    expect(textarea).toHaveClass('focus:ring-red');
  });

  test('applies custom className prop', () => {
    // Test if the textarea applies the custom className correctly
    setup({ className: 'custom-class' });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  test('sets textarea to full width if fullWidth is true', () => {
    // Test if the container is full width when fullWidth prop is true
    setup({ fullWidth: true });
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveClass('w-full');
  });

  test('has the correct number of rows', () => {
    // Test if the textarea has the correct number of rows
    setup({ rows: 5 });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});