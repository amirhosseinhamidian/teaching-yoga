/* eslint-disable no-undef */
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';
import React from 'react';

test('renders Button component', () => {
  // Test to check if the Button component renders with the correct text
  render(<Button>Click Me</Button>);
  const buttonElement = screen.getByText(/Click Me/i);
  expect(buttonElement).toBeInTheDocument();

  // Test to check if the default color classes (primary) are applied
  expect(buttonElement).toHaveClass('bg-primary');
  expect(buttonElement).toHaveClass('text-text-light');
});

test('calls onClick function when clicked', () => {
  // Test to verify if the onClick function is called when the button is clicked
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  const buttonElement = screen.getByText(/Click Me/i);
  fireEvent.click(buttonElement);
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('applies the correct color class based on the color prop', () => {
  // Test to ensure the correct color class is applied based on the color prop
  render(<Button color='red'>Click Me</Button>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button has the 'red' color classes
  expect(buttonElement).toHaveClass('bg-red');
  expect(buttonElement).toHaveClass('text-background-light');
});

test('applies shadow class when shadow prop is true', () => {
  // Test to verify if the shadow class is applied when the shadow prop is true
  render(<Button shadow>Click Me</Button>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button has the shadow class
  expect(buttonElement).toHaveClass(
    'shadow-[1px_5px_14px_rgba(255,175,41,0.4)]',
  );
});

test('does not apply shadow class when shadow prop is false', () => {
  // Test to ensure the shadow class is not applied when the shadow prop is false
  render(<Button shadow={false}>Click Me</Button>);
  const buttonElement = screen.getByText(/Click Me/i);

  // Check if the button does not have the shadow class
  expect(buttonElement).not.toHaveClass(
    'shadow-[1px_5px_14px_rgba(255,175,41,0.4)]',
  );
});
