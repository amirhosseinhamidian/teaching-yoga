/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // For custom matchers like toBeInTheDocument
import Input from './Input';

describe('Input Component', () => {
  // Test to ensure the label is rendered when provided
  test('renders label when provided', () => {
    render(<Input label='Email Address' />);
    const labelElement = screen.getByText('Email Address');
    expect(labelElement).toBeInTheDocument();
  });

  // Test to ensure no label is rendered when none is provided
  test('does not render label when not provided', () => {
    render(<Input />);
    const labelElement = screen.queryByText('Email Address');
    expect(labelElement).toBeNull();
  });

  // Test to check if the input renders with the correct placeholder
  test('renders input with placeholder', () => {
    render(<Input placeholder='Enter your email' />);
    const inputElement = screen.getByPlaceholderText('Enter your email');
    expect(inputElement).toBeInTheDocument();
  });

  // Test to ensure error message is displayed when provided
  test('shows error message when provided', () => {
    render(<Input errorMessage='Invalid email address' />);
    const errorElement = screen.getByText(/Invalid email address/i);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-red'); // Ensure error styling is applied
  });

  // Test to ensure no error message is displayed when not provided
  test('does not show error message when not provided', () => {
    render(<Input />);
    const errorElement = screen.queryByText('Invalid email address');
    expect(errorElement).toBeNull();
  });

  // Test to check if the onChange handler is called when input changes
  test('calls onChange when typing in input', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const inputElement = screen.getByRole('textbox'); // Find the input
    fireEvent.change(inputElement, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // Test to ensure input renders with the correct value
  test('renders input with the correct value', () => {
    render(<Input value='test@example.com' />);
    const inputElement = screen.getByDisplayValue('test@example.com');
    expect(inputElement).toBeInTheDocument();
  });
});
