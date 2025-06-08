// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder in Jest (Node environment)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for ReadableStream in Jest (Node environment)
if (typeof global.ReadableStream === 'undefined') {
  try {
    // Node 18+ has a global ReadableStream
    global.ReadableStream = require('stream/web').ReadableStream;
  } catch (e) {
    // Fallback: minimal stub to prevent crashes (not suitable for advanced use)
    global.ReadableStream = function () {};
  }
}
