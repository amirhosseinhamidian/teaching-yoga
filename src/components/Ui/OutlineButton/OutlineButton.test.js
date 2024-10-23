/* eslint-disable no-undef */
import { render, screen, fireEvent } from '@testing-library/react';
import OutlineButton from './OutlineButton';
import React from 'react';

test('renders OutlineButton component with correct text', () => {
  // Test to check if the OutlineButton component renders with the correct text
  render(<OutlineButton>Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);
  expect(buttonElement).toBeInTheDocument();
});

test('calls onClick function when clicked', () => {
  // Test to verify if the onClick function is called when the OutlineButton is clicked
  const handleClick = jest.fn();
  render(<OutlineButton onClick={handleClick}>Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);
  fireEvent.click(buttonElement);
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('applies the correct color classes based on the color prop', () => {
  // Test to ensure the correct color class is applied based on the color prop (primary by default)
  render(<OutlineButton color="red">Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button has the 'red' color classes for text, border, and hover effects
  expect(buttonElement).toHaveClass('text-red');
  expect(buttonElement).toHaveClass('border-red');
  expect(buttonElement).toHaveClass('hover:bg-red');
  expect(buttonElement).toHaveClass('hover:text-background-light');
});

test('applies the default color classes when no color prop is provided', () => {
  // Test to verify that the default color classes (primary) are applied when no color prop is passed
  render(<OutlineButton>Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button has the primary color classes
  expect(buttonElement).toHaveClass('text-primary');
  expect(buttonElement).toHaveClass('border-primary');
  expect(buttonElement).toHaveClass('hover:bg-primary');
  expect(buttonElement).toHaveClass('hover:text-text-light');
});

test('applies custom className when provided', () => {
  // Test to check if additional custom className is applied to the button
  render(<OutlineButton className="custom-class">Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button has the custom class along with default classes
  expect(buttonElement).toHaveClass('custom-class');
  expect(buttonElement).toHaveClass('rounded-xl');
});

test('applies hover effect with transition when hovered', () => {
  // Test to verify that the hover effect is applied with transition when hovered
  render(<OutlineButton color="blue">Click Me</OutlineButton>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Simulate hover and check if the hover background and text color change
  fireEvent.mouseOver(buttonElement);
  expect(buttonElement).toHaveClass('hover:bg-blue');
  expect(buttonElement).toHaveClass('hover:text-background-light');
});

