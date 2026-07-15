import {jest, beforeEach, describe, expect, it} from '@jest/globals';
import type {Logger as LoggerType} from './logger.js';

jest.unstable_mockModule('@actions/core', () => ({
  warning: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

const {Logger} = await import('./logger.js');
const core = await import('@actions/core');

describe('Logger', (): void => {
  let logger: LoggerType;

  beforeEach((): void => {
    logger = new Logger();
  });

  describe('warning()', (): void => {
    let message: string;

    beforeEach((): void => {
      message = 'dummy-message';
    });

    it('should log a warning with the given message', (): void => {
      expect.assertions(2);

      logger.warning(message);

      expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });

  describe('info()', (): void => {
    let message: string;

    beforeEach((): void => {
      message = 'dummy-message';
    });

    it('should log an information with the given message', (): void => {
      expect.assertions(2);

      logger.info(message);

      expect(jest.mocked(core.info)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.info)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });

  describe('error()', (): void => {
    let message: string;

    beforeEach((): void => {
      message = 'dummy-message';
    });

    it('should log an error with the given message', (): void => {
      expect.assertions(2);

      logger.error(message);

      expect(jest.mocked(core.error)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.error)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });
});
