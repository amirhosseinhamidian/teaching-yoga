/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable no-undef */
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from './ButtonIcon'; // Import the IconButton component
import { FaBeer } from 'react-icons/fa'; // Sample icon from react-icons
import React from 'react';
import '@testing-library/jest-dom';

// Test: Renders the IconButton component correctly
test('renders IconButton with provided icon', () => {
  render(<IconButton icon={FaBeer} />);

  // Check if the icon is rendered by querying the SVG element
  const iconElement = screen.getByTestId('icon'); // Add test ID to the icon element
  expect(iconElement).toBeInTheDocument();
});

// Test: Executes the onClick function when button is clicked
test('executes onClick when button is clicked', () => {
  const handleClick = jest.fn(); // Mock function to track clicks
  render(<IconButton icon={FaBeer} onClick={handleClick} />);

  // Find the button and simulate a click
  const buttonElement = screen.getByRole('button');
  fireEvent.click(buttonElement);

  // Check if the click handler was called
  expect(handleClick).toHaveBeenCalledTimes(1);
});

// Test: Changes icon color on hover (class changes)
test('changes icon color on hover', () => {
  render(<IconButton icon={FaBeer} />);

  // Find the button
  const buttonElement = screen.getByRole('button');

  // Hover over the button to trigger the group-hover effect
  fireEvent.mouseOver(buttonElement);

  // Check if the icon's class changes (group-hover should apply `fill-secondary`)
  const iconElement = screen.getByTestId('icon');
  expect(iconElement).toHaveClass('group-hover:fill-secondary-light');
});

// Test: Accepts and applies custom size and color props
test('applies custom size and color to icon', () => {
  render(<IconButton icon={FaBeer} size={30} color='#000000' />);

  // Find the icon
  const iconElement = screen.getByTestId('icon');

  // Check if the icon size and color are correctly applied
  expect(iconElement).toHaveAttribute('width', '30');
  expect(iconElement).toHaveAttribute('color', '#000000');
});
