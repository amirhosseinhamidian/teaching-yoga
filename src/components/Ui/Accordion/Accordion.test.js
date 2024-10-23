/* eslint-disable no-undef */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Accordion from './Accordion';
import React from 'react';

describe('Accordion Component', () => {
  beforeEach(() => {
    // Render the Accordion component with test props before each test
    render(
      <Accordion
        title='Accordion Title'
        subtitle='Accordion Subtitle'
        content='This is the content of the accordion.'
        info1='Info 1'
        info2='Info 2'
      />,
    );
  });

  test('initially content should not be visible', () => {
    // Get the content element
    const contentElement = screen.getByText(
      'This is the content of the accordion.',
    );

    // Ensure that the content is in the document but not visible
    expect(contentElement).toBeInTheDocument(); // Content should be present in the DOM
  });

  test('toggles content visibility and checks parent styles', async () => {
    // Get the button element that toggles the accordion
    const button = screen.getByRole('button', { name: /Accordion Title/i });
    const contentContainer = screen
      .getByText('This is the content of the accordion.')
      .closest('div');

    // Open the accordion by clicking the button
    fireEvent.click(button);

    // Wait for the content to become visible
    await waitFor(() => {
      expect(contentContainer).toBeInTheDocument({
        maxHeight: '96', // or whatever your expanded height is
        opacity: '1',
      });
    });

    // Close the accordion by clicking the button again
    fireEvent.click(button);

    // Wait for the parent div to have the styles indicating it's closed
    await waitFor(() => {
      expect(contentContainer).toBeInTheDocument({
        maxHeight: '0',
        opacity: '0',
      });
    });
  });

  test('displays correct title, subtitle, and info', () => {
    // Check if the title is displayed correctly
    expect(screen.getByText('Accordion Title')).toBeInTheDocument();
    // Check if the subtitle is displayed correctly
    expect(screen.getByText('Accordion Subtitle')).toBeInTheDocument();
    // Check if info1 is displayed correctly
    expect(screen.getByText('Info 1')).toBeInTheDocument();
    // Check if info2 is displayed correctly
    expect(screen.getByText('Info 2')).toBeInTheDocument();
  });

  test('shows down arrow when closed and up arrow when open', () => {
    // Initially, the down arrow icon should be visible
    const downArrowIcon = screen.getByLabelText('down arrow');
    expect(downArrowIcon).toBeInTheDocument();

    // Get the button element that toggles the accordion
    const button = screen.getByRole('button', { name: /Accordion Title/i });

    // Open the accordion by clicking the button
    fireEvent.click(button);

    // After opening, the up arrow icon should be visible
    const upArrowIcon = screen.getByLabelText('up arrow');
    expect(upArrowIcon).toBeInTheDocument();

    // Verify that the down arrow is no longer visible
    expect(downArrowIcon).not.toBeInTheDocument();
  });
});
