import {jest, afterEach, describe, expect, it} from '@jest/globals';
import type {IIssue} from '../../interfaces/issue.js';
import type {IIssuesProcessorOptions} from '../../interfaces/issues-processor-options.js';
import type {IState} from '../../interfaces/state/state.js';

jest.unstable_mockModule('@actions/core', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
}));

const {State} = await import('./state.js');
const core = await import('@actions/core');

type IssueID = number;

const mockStorage = {
  save: () => Promise.resolve(),
  restore: () => Promise.resolve('')
};

const getProcessedIssuesIDs = (state: IState): Set<IssueID> =>
  (state as unknown as {processedIssuesIDs: Set<IssueID>}).processedIssuesIDs;

describe('State', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializing and resetting', () => {
    it('new state should not contain any issues marked as proceeded', async () => {
      const state = new State(
        mockStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      expect(getProcessedIssuesIDs(state)).toEqual(new Set());
      expect(jest.mocked(core.debug)).not.toHaveBeenCalled();
    });
    it('reset state should not contain any issues marked as proceeded', async () => {
      const state = new State(
        mockStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      state.addIssueToProcessed({number: 1} as unknown as IIssue);
      expect(getProcessedIssuesIDs(state)).not.toEqual(new Set());
      state.reset();
      expect(getProcessedIssuesIDs(state)).toEqual(new Set());
      expect(jest.mocked(core.debug)).toHaveBeenCalledTimes(2);
      expect(jest.mocked(core.debug)).toHaveBeenCalledWith('state: reset');
    });
  });
  describe('marking as proceeded', () => {
    it('state marked with issues 1,2,3 as proceeded should report the as proceeded', async () => {
      const state = new State(
        mockStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      state.addIssueToProcessed({number: 1} as unknown as IIssue);
      state.addIssueToProcessed({number: 2} as unknown as IIssue);
      state.addIssueToProcessed({number: 3} as unknown as IIssue);
      expect(getProcessedIssuesIDs(state)).toEqual(new Set([1, 2, 3]));
      expect(
        state.isIssueProcessed({number: 1} as unknown as IIssue)
      ).toBeTruthy();
      expect(
        state.isIssueProcessed({number: 2} as unknown as IIssue)
      ).toBeTruthy();
      expect(
        state.isIssueProcessed({number: 3} as unknown as IIssue)
      ).toBeTruthy();
      expect(
        state.isIssueProcessed({number: 0} as unknown as IIssue)
      ).toBeFalsy();
      expect(
        state.isIssueProcessed({number: 4} as unknown as IIssue)
      ).toBeFalsy();
      expect(jest.mocked(core.debug)).toHaveBeenCalledTimes(3);
      expect(jest.mocked(core.debug)).toHaveBeenCalledWith(
        'state: mark 1 as processed'
      );
      expect(jest.mocked(core.debug)).toHaveBeenCalledWith(
        'state: mark 2 as processed'
      );
      expect(jest.mocked(core.debug)).toHaveBeenCalledWith(
        'state: mark 3 as processed'
      );
    });
  });
  describe('persisting', () => {
    it('[1,2,3] should be serialized and persisted as "1|2|3|', async () => {
      const localStorage = {
        save: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        async restore(): Promise<string> {
          return '';
        }
      };
      const state = new State(
        localStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      state.addIssueToProcessed({number: 1} as unknown as IIssue);
      state.addIssueToProcessed({number: 2} as unknown as IIssue);
      state.addIssueToProcessed({number: 3} as unknown as IIssue);
      await state.persist();
      expect(localStorage.save).toHaveBeenCalledTimes(1);
      expect(localStorage.save).toHaveBeenCalledWith('1|2|3');
      expect(jest.mocked(core.info)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.info)).toHaveBeenCalledWith(
        'state: persisting info about 3 issue(s)'
      );
    });
  });
  describe('rehydrating', () => {
    it('"1|2|3" should be rehydrate to the IState with issues 1,2,3 marked as proceeded', async () => {
      const localStorage = {
        save: () => Promise.resolve(),
        restore: () => Promise.resolve('1|2|3')
      };
      const state = new State(
        localStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      await state.restore();
      const processedIssuesIDs = (
        state as unknown as {processedIssuesIDs: Set<IssueID>}
      ).processedIssuesIDs;
      expect(processedIssuesIDs).toEqual(new Set([1, 2, 3]));
      expect(jest.mocked(core.info)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.info)).toHaveBeenCalledWith(
        'state: restored with info about 3 issue(s)'
      );
    });
  });
  describe('debugOnly', () => {
    it('state should persisted if debugOnly not set', () => {
      const localStorage = {
        save: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        async restore(): Promise<string> {
          return '';
        }
      };
      const state = new State(
        localStorage,
        {} as unknown as IIssuesProcessorOptions
      );
      state.persist();
      expect(localStorage.save).toHaveBeenCalledTimes(1);
    });
    it('state should not be persisted if debugOnly set true', () => {
      const localStorage = {
        save: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        async restore(): Promise<string> {
          return '';
        }
      };
      const state = new State(localStorage, {
        debugOnly: true
      } as unknown as IIssuesProcessorOptions);
      state.persist();
      expect(localStorage.save).not.toHaveBeenCalled();
      expect(jest.mocked(core.warning)).toHaveBeenCalledTimes(1);
      expect(jest.mocked(core.warning)).toHaveBeenCalledWith(
        'The state is not persisted in the debug mode'
      );
    });
  });
});
