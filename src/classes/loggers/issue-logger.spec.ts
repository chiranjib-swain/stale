import {jest, beforeEach, describe, expect, it} from '@jest/globals';
import type {Issue as IssueType} from '../issue.js';
import type {IssueLogger as IssueLoggerType} from './issue-logger.js';

jest.unstable_mockModule('@actions/core', () => ({
  warning: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

const {DefaultProcessorOptions} =
  await import('../../../__tests__/constants/default-processor-options.js');
const {generateIIssue} =
  await import('../../../__tests__/functions/generate-iissue.js');
const {Issue} = await import('../issue.js');
const {IssueLogger} = await import('./issue-logger.js');
const core = await import('@actions/core');

describe('IssueLogger', (): void => {
  let issue: IssueType;
  let issueLogger: IssueLoggerType;
  let message: string;

  describe('warning()', (): void => {
    beforeEach((): void => {
      message = 'dummy-message';
      issue = new Issue(
        DefaultProcessorOptions,
        generateIIssue({
          number: 8
        })
      );
      issueLogger = new IssueLogger(issue);
    });

    it('should log a warning with the given message and with the issue number as prefix', (): void => {
      expect.assertions(3);

      issueLogger.warning(message);

      expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining('[#8]')
      );
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });

  describe('info()', (): void => {
    beforeEach((): void => {
      message = 'dummy-message';
      issue = new Issue(
        DefaultProcessorOptions,
        generateIIssue({
          number: 8
        })
      );
      issueLogger = new IssueLogger(issue);
    });

    it('should log an information with the given message and with the issue number as prefix', (): void => {
      expect.assertions(3);

      issueLogger.info(message);

      expect(jest.mocked(core.info)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.info)).toHaveBeenCalledWith(
        expect.stringContaining('[#8]')
      );
      expect(jest.mocked(core.info)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });

  describe('error()', (): void => {
    beforeEach((): void => {
      message = 'dummy-message';
      issue = new Issue(
        DefaultProcessorOptions,
        generateIIssue({
          number: 8
        })
      );
      issueLogger = new IssueLogger(issue);
    });

    it('should log an error with the given message and with the issue number as prefix', (): void => {
      expect.assertions(3);

      issueLogger.error(message);

      expect(jest.mocked(core.error)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.error)).toHaveBeenCalledWith(
        expect.stringContaining('[#8]')
      );
      expect(jest.mocked(core.error)).toHaveBeenCalledWith(
        expect.stringContaining('dummy-message')
      );
    });
  });

  it('should prefix the message with the issue number', (): void => {
    expect.assertions(3);
    message = 'dummy-message';
    issue = new Issue(
      DefaultProcessorOptions,
      generateIIssue({
        number: 123
      })
    );
    issueLogger = new IssueLogger(issue);

    issueLogger.warning(message);

    expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
      expect.stringContaining('[#123]')
    );
    expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
      expect.stringContaining('dummy-message')
    );
  });

  it.each`
    pull_request      | replacement
    ${{key: 'value'}} | ${'pull request'}
    ${{}}             | ${'pull request'}
    ${null}           | ${'issue'}
    ${undefined}      | ${'issue'}
  `(
    'should replace the special tokens "$$type" with the corresponding type',
    ({pull_request, replacement}): void => {
      expect.assertions(3);
      message = 'The $$type will stale! $$type will soon be closed!';
      issue = new Issue(
        DefaultProcessorOptions,
        generateIIssue({
          number: 8,
          pull_request
        })
      );
      issueLogger = new IssueLogger(issue);

      issueLogger.warning(message);

      expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining(`[#8]`)
      );
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining(
          `The ${replacement} will stale! ${replacement} will soon be closed!`
        )
      );
    }
  );

  it.each`
    pull_request      | replacement
    ${{key: 'value'}} | ${'Pull request'}
    ${{}}             | ${'Pull request'}
    ${null}           | ${'Issue'}
    ${undefined}      | ${'Issue'}
  `(
    'should replace the special token "$$type" with the corresponding type with first letter as uppercase',
    ({pull_request, replacement}): void => {
      expect.assertions(3);
      message = '$$type will stale';
      issue = new Issue(
        DefaultProcessorOptions,
        generateIIssue({
          number: 8,
          pull_request
        })
      );
      issueLogger = new IssueLogger(issue);

      issueLogger.warning(message);

      expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining(`[#8]`)
      );
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        expect.stringContaining(`${replacement} will stale`)
      );
    }
  );
});
