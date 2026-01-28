import {IIssuesProcessorOptions} from '../src/interfaces/issues-processor-options';
import {IssuesProcessorMock} from './classes/issues-processor-mock';
import {DefaultProcessorOptions} from './constants/default-processor-options';
import {alwaysFalseStateMock} from './classes/state-mock';

describe('stale-branches options', (): void => {
  let opts: IIssuesProcessorOptions;
  let processor: IssuesProcessorMock;

  beforeEach((): void => {
    opts = {...DefaultProcessorOptions};
  });

  test('when stale-branches is disabled, branch processing is not triggered', async () => {
    opts = {
      ...opts,
      staleBranches: false
    };

    processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async () => [], // No issues
      async () => [],
      async () => new Date().toDateString()
    );

    await processor.processIssues(1);

    expect(processor.deletedBranches).toHaveLength(0);
  });

  test('when stale-branches is enabled but delete-stale-branches is false, no branches are deleted', async () => {
    opts = {
      ...opts,
      staleBranches: true,
      deleteStaleBranches: false,
      staleBranchDays: 30
    };

    processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async () => [], // No issues
      async () => [],
      async () => new Date().toDateString()
    );

    await processor.processIssues(1);

    // Should not delete branches when deleteStaleBranches is false
    expect(processor.deletedBranches).toHaveLength(0);
  });

  test('when dry-run is enabled, no branches are deleted', async () => {
    opts = {
      ...opts,
      staleBranches: true,
      deleteStaleBranches: true,
      dryRun: true,
      staleBranchDays: 30
    };

    processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async () => [], // No issues
      async () => [],
      async () => new Date().toDateString()
    );

    await processor.processIssues(1);

    // Should not delete branches in dry-run mode
    expect(processor.deletedBranches).toHaveLength(0);
  });

  test('when debug-only is enabled, no branches are deleted', async () => {
    opts = {
      ...opts,
      staleBranches: true,
      deleteStaleBranches: true,
      debugOnly: true,
      staleBranchDays: 30
    };

    processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async () => [], // No issues
      async () => [],
      async () => new Date().toDateString()
    );

    await processor.processIssues(1);

    // Should not delete branches in debug mode
    expect(processor.deletedBranches).toHaveLength(0);
  });

  test('branch cleanup respects operations limit', async () => {
    opts = {
      ...opts,
      staleBranches: true,
      deleteStaleBranches: true,
      operationsPerRun: 1, // Very low limit
      staleBranchDays: 30
    };

    processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async () => [], // No issues
      async () => [],
      async () => new Date().toDateString()
    );

    await processor.processIssues(1);

    // With operations limit of 1, branch processing should stop early
    expect(processor.deletedBranches).toHaveLength(0);
  });
});
