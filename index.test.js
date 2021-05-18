const backdoor = require('./index');

const getAMockedRes = success => ({ success });
const actualPromRes = { theReal: 'thing' };

let params;
let config;
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  params = {
    actualPromise: jest.fn(() => Promise.resolve(actualPromRes)),
    input: 'backdoor',
    resolvedRes: getAMockedRes('yup'),
    rejectedRes: getAMockedRes('nope')
  };
  config = {
    fast: 1,
    slow: 2
  };
});

describe('backdoor', () => {
  describe('triggers the actual promise', () => {
    test('when NODE_ENV is "production"', () => {
      process.env.NODE_ENV = 'production';
      return backdoor(params, config).then((res) => {
        expect(res).toEqual(actualPromRes);
        expect(params.actualPromise).toHaveBeenCalled();
      });
    });
    test('when input does not start with "backdoor"', () => {
      params.input = 'fast-backdoor';
      return backdoor(params, config).then((res) => {
        expect(res).toEqual(actualPromRes);
        expect(params.actualPromise).toHaveBeenCalled();
      });
    });
  });
  describe('resolves', () => {
    test('slow when input is "backdoor"', () => {
      return backdoor(params, config).then((res) => {
        expect(res).toBe(params.resolvedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
    test('fast when input is "backdoor-fast"', () => {
      params.input = 'backdoor-fast';
      return backdoor(params, config).then((res) => {
        expect(res).toBe(params.resolvedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
  });
  describe('rejects', () => {
    test('slow when input is "backdoor-error"', () => {
      params.input = 'backdoor-error';
      return backdoor(params, config).catch((err) => {
        expect(err).toBe(params.rejectedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
    test('fast when input is "backdoor-error-fast"', () => {
      params.input = 'backdoor-error-fast';
      return backdoor(params, config).catch((err) => {
        expect(err).toBe(params.rejectedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
  });
  describe('allows configuration of the separator and', () => {
    test('resolves fast when input is "backdoor+fast"', () => {
      config.separator = '+';
      params.input = 'backdoor+fast';
      return backdoor(params, config).then((res) => {
        expect(res).toBe(params.resolvedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
    test('rejects fast when input is "backdoor+error+fast"', () => {
      config.separator = '+';
      params.input = 'backdoor+error+fast';
      return backdoor(params, config).catch((err) => {
        expect(err).toBe(params.rejectedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
  });
  describe('allows override of the assessor function', () => {
    test('resolves when the assessor returns "isBackdoor" and "doResolve" as true', () => {
      params.input = 5;
      params.assess = input => ({ isBackdoor: input > 1, doResolve: input > 2 });
      return backdoor(params, config).then((res) => {
        expect(res).toBe(params.resolvedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
    test('rejects when the assessor returns "isBackdoor" as true', () => {
      params.input = 5;
      params.assess = input => ({ isBackdoor: input > 1 });
      return backdoor(params, config).catch((err) => {
        expect(err).toBe(params.rejectedRes);
        expect(params.actualPromise).not.toHaveBeenCalled();
      });
    });
  });
  // Keep this test at the bottom. "jest.useFakeTimers();" has scoping issues with describe and test
  test('works without config', () => {
    jest.useFakeTimers();
    const pendingPromise = backdoor(params).then(res => {
      expect(res).toBe(params.resolvedRes);
      expect(params.actualPromise).not.toHaveBeenCalled();
    });
    jest.runAllTimers();
    return pendingPromise;
  });
});
