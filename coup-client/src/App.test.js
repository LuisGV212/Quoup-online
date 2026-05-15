import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Quoup home screen', () => {
  render(<App />);
  expect(screen.getByLabelText(/Quoup/i)).toBeInTheDocument();
  expect(screen.getByText(/Create Game/i)).toBeInTheDocument();
  expect(screen.getByText(/Join Game/i)).toBeInTheDocument();
});
