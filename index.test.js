const backdoor = require('./index');

const getAMockedRes = success => ({ success });
const actualPromRes = { theReal: 'thing' };

let params;
let actualThenable;
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  actualThenable = jest.fn(() => Promise.resolve(actualPromRes));
  params = {
    input: 'backdoor',
    resolvedValue: getAMockedRes('yup'),
    rejectedValue: getAMockedRes('nope'),
    config: {
      fast: 1,
      slow: 2
    }
  };
});

describe('backdoor', () => {
  describe('triggers the actual thenable', () => {
    test('when NODE_ENV is "production"', () => {
      process.env.NODE_ENV = 'production';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toEqual(actualPromRes);
        expect(actualThenable).toHaveBeenCalled();
      });
    });
    // This test ensures that not just "any" truthy value enables in production
    // It's just one more layer of validation of intent
    test('when NODE_ENV is "production" and enabledInProd is not set with the boolean true', () => {
      process.env.NODE_ENV = 'production';
      params.config.enabledInProd = 'true';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toEqual(actualPromRes);
        expect(actualThenable).toHaveBeenCalled();
      });
    });
    test('when input does not start with "backdoor"', () => {
      params.input = 'fast-backdoor';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toEqual(actualPromRes);
        expect(actualThenable).toHaveBeenCalled();
      });
    });
  });
  describe('resolves', () => {
    test('slow when input is "backdoor"', () => {
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toBe(params.resolvedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
    test('slow on "backdoor" when in prod only if enabledInProd is true', () => {
      process.env.NODE_ENV = 'production';
      params.config.enabledInProd = true;
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toBe(params.resolvedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
    test('fast when input is "backdoor-fast"', () => {
      params.input = 'backdoor-fast';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toBe(params.resolvedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
  });
  describe('rejects', () => {
    test('slow when input is "backdoor-error"', () => {
      params.input = 'backdoor-error';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().catch((err) => {
        expect(err).toBe(params.rejectedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
    test('fast when input is "backdoor-error-fast"', () => {
      params.input = 'backdoor-error-fast';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().catch((err) => {
        expect(err).toBe(params.rejectedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
  });
  describe('allows configuration of the separator and', () => {
    test('resolves fast when input is "backdoor+fast"', () => {
      params.config.separator = '+';
      params.input = 'backdoor+fast';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toBe(params.resolvedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
    test('rejects fast when input is "backdoor+error+fast"', () => {
      params.config.separator = '+';
      params.input = 'backdoor+error+fast';
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().catch((err) => {
        expect(err).toBe(params.rejectedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
  });
  describe('allows override of the assessor function', () => {
    test('resolves when the assessor returns "isBackdoor" and "doResolve" as true', () => {
      params.input = 5;
      params.config.assessor = input => ({ isBackdoor: input > 1, doResolve: input > 2 });
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().then((res) => {
        expect(res).toBe(params.resolvedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
    test('rejects when the assessor returns only "isBackdoor" as true', () => {
      params.input = 5;
      params.config.assessor = input => ({ isBackdoor: input > 1 });
      const withBackdoor = backdoor(params);
      return withBackdoor(actualThenable)().catch((err) => {
        expect(err).toBe(params.rejectedValue);
        expect(actualThenable).not.toHaveBeenCalled();
      });
    });
  });
  // Keep this test at the bottom. "jest.useFakeTimers();" has scoping issues with describe and test
  test('works without config (slow 5s)', () => {
    jest.useFakeTimers('legacy');
    params.config = null;
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
  test('works without config (fast 1s)', () => {
    jest.useFakeTimers('legacy');
    params.config = null;
    params.input = 'backdoor-fast';
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
  test('defaults to slow === 5000 when config exists without "slow" override', () => {
    jest.useFakeTimers('legacy');
    params.config = {};
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
  test('defaults to fast === 1000 when config exists without "fast" override', () => {
    jest.useFakeTimers('legacy');
    params.config = {};
    params.input = 'backdoor-fast';
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
  test('accepts 0 for the "slow" override config', () => {
    jest.useFakeTimers('legacy');
    params.config = { slow: 0 };
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
  test('accepts 0 for the "fast" override config', () => {
    jest.useFakeTimers('legacy');
    params.config = { fast: 0 };
    params.input = 'backdoor-fast';
    const withBackdoor = backdoor(params)
    const pendingPromise = withBackdoor(actualThenable)().then(res => {
      expect(res).toBe(params.resolvedValue);
      expect(actualThenable).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
    });
    jest.runAllTimers();
    return pendingPromise;
  });
});
