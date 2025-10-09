import {Issue} from '../src/classes/issue';
import {IIssuesProcessorOptions} from '../src/interfaces/issues-processor-options';
import {IssuesProcessorMock} from './classes/issues-processor-mock';
import {DefaultProcessorOptions} from './constants/default-processor-options';
import {generateIssue} from './functions/generate-issue';
import {alwaysFalseStateMock} from './classes/state-mock';

describe('only-issue-types option (single type)', () => {
  test('should only process issues with the specified type', async () => {
    const opts: IIssuesProcessorOptions = {
      ...DefaultProcessorOptions,
      onlyIssueTypes: 'Bug' // Single type
    };
    const TestIssueList: Issue[] = [
      generateIssue(
        opts,
        1,
        'A bug',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Bug'} // Matches the onlyIssueTypes value
      ),
      generateIssue(
        opts,
        2,
        'A feature',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Feature'} // Does not match the onlyIssueTypes value
      )
    ];
    const processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async p => (p === 1 ? TestIssueList : []),
      async () => [],
      async () => new Date().toDateString()
    );
    await processor.processIssues(1);
    expect(processor.staleIssues.map(i => i.title)).toEqual(['A bug']); // Only the bug issue should be processed
  });

  test('should process all issues if onlyIssueTypes is unset', async () => {
    const opts: IIssuesProcessorOptions = {
      ...DefaultProcessorOptions,
      onlyIssueTypes: '' // No type specified
    };
    const TestIssueList: Issue[] = [
      generateIssue(
        opts,
        1,
        'A bug',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Bug'}
      ),
      generateIssue(
        opts,
        2,
        'A feature',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Feature'}
      )
    ];
    const processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async p => (p === 1 ? TestIssueList : []),
      async () => [],
      async () => new Date().toDateString()
    );
    await processor.processIssues(1);
    expect(processor.staleIssues.map(i => i.title)).toEqual([
      'A bug',
      'A feature'
    ]); // All issues should be processed
  });

  test('should process issues with any type  when onlyIssueTypes is "*"', async () => {
    const opts: IIssuesProcessorOptions = {
      ...DefaultProcessorOptions,
      onlyIssueTypes: '*' // Wildcard for all types
    };
    const TestIssueList: Issue[] = [
      generateIssue(
        opts,
        1,
        'A bug',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Bug'}
      ),
      generateIssue(
        opts,
        2,
        'A feature',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Feature'}
      ),
      generateIssue(
        opts,
        3,
        'A question',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Question'}
      )
    ];
    const processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async p => (p === 1 ? TestIssueList : []),
      async () => [],
      async () => new Date().toDateString()
    );
    await processor.processIssues(1);
    expect(processor.staleIssues.map(i => i.title)).toEqual([
      'A bug',
      'A feature',
      'A question'
    ]); // All issues should be processed
  });

  test('should process issues without a type when onlyIssueTypes is "none"', async () => {
    const opts: IIssuesProcessorOptions = {
      ...DefaultProcessorOptions,
      onlyIssueTypes: 'none' // No type specified
    };
    const TestIssueList: Issue[] = [
      generateIssue(
        opts,
        1,
        'An issue with no type',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        undefined // No type
      ),
      generateIssue(
        opts,
        2,
        'A bug',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Bug'}
      )
    ];
    const processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async p => (p === 1 ? TestIssueList : []),
      async () => [],
      async () => new Date().toDateString()
    );
    await processor.processIssues(1);
    expect(processor.staleIssues.map(i => i.title)).toEqual([
      'An issue with no type'
    ]); // Only the issue with no type should be processed
  });

  test('should handle invalid onlyIssueTypes gracefully', async () => {
    const opts: IIssuesProcessorOptions = {
      ...DefaultProcessorOptions,
      onlyIssueTypes: 'invalid-type' // Invalid type
    };
    const TestIssueList: Issue[] = [
      generateIssue(
        opts,
        1,
        'A bug',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Bug'}
      ),
      generateIssue(
        opts,
        2,
        'A feature',
        '2020-01-01T17:00:00Z',
        '2020-01-01T17:00:00Z',
        false,
        false,
        [],
        false,
        false,
        undefined,
        [],
        {name: 'Feature'}
      )
    ];
    const processor = new IssuesProcessorMock(
      opts,
      alwaysFalseStateMock,
      async p => (p === 1 ? TestIssueList : []),
      async () => [],
      async () => new Date().toDateString()
    );
    await processor.processIssues(1);
    expect(processor.staleIssues).toHaveLength(0); // No issues should be processed
  });
});
