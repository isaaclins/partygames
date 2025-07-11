// Test setup for backend tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Set reasonable test timeout
jest.setTimeout(10000);

// Mock timers for tests that use setTimeout/setInterval
beforeEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  // Force garbage collection if available (for Node.js)
  if (global.gc) {
    global.gc();
  }
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
  // Force garbage collection if available (for Node.js)
  if (global.gc) {
    global.gc();
  }
});
