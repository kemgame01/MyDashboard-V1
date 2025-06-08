import { render, screen } from '@testing-library/react';
import App from './App';

test('shows loading spinner at startup', () => {
  render(<App />);
  // This matches your actual UI!
  const loading = screen.getByText(/loading dashboard/i);
  expect(loading).toBeInTheDocument();
});
