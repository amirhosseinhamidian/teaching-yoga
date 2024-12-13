/* eslint-disable no-undef */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Switch from './Switch'; // Adjust the import according to your file structure

describe('Switch Component', () => {
  test('renders with default props', () => {
    // Check that the switch is rendered in the unchecked state by default
    const { getByRole } = render(<Switch />);
    const switchInput = getByRole('checkbox');
    expect(switchInput).not.toBeChecked(); // Default state should be unchecked
  });

  test('renders with initial checked state', () => {
    // Check that the switch is rendered in the checked state when the checked prop is true
    const { getByRole } = render(<Switch checked={true} />);
    const switchInput = getByRole('checkbox');
    expect(switchInput).toBeChecked(); // Should be checked
  });

  test('toggles checked state on click', () => {
    // Check that clicking the switch toggles its checked state and calls the onChange callback with the correct value
    const onChange = jest.fn();
    const { getByRole } = render(<Switch onChange={onChange} />);
    const switchInput = getByRole('checkbox');

    // Click to check
    fireEvent.click(switchInput);
    expect(switchInput).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true);

    // Click to uncheck
    fireEvent.click(switchInput);
    expect(switchInput).not.toBeChecked();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  test('renders with label', () => {
    // Check that the label is rendered when provided
    const { getByText } = render(<Switch label='Test Label' />);
    expect(getByText('Test Label')).toBeInTheDocument(); // Label should be rendered
  });

  test('applies custom class names', () => {
    // Check that custom class names are applied to the switch component
    const { getByRole } = render(<Switch className='custom-class' />);
    const switchInput = getByRole('checkbox');
    expect(switchInput.parentElement.parentElement).toHaveClass('custom-class'); // Check for custom class
  });

  test('renders with custom label class', () => {
    // Check that the custom label class is applied correctly
    const { getByText } = render(
      <Switch label='Test Label' labelClass='custom-label' />,
    );
    expect(getByText('Test Label')).toHaveClass('custom-label'); // Check for custom label class
  });
});
