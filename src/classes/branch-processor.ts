import * as core from '@actions/core';
import {context} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';
import {IIssuesProcessorOptions} from '../interfaces/issues-processor-options';
import {Logger} from './loggers/logger';
import {LoggerService} from '../services/logger.service';
import {StaleOperations} from './stale-operations';

interface IBranchInfo {
  name: string;
  commit: {
    sha: string;
    date: Date;
  };
  protected: boolean;
}

interface IBranchDeletionResult {
  name: string;
  deleted: boolean;
  reason?: string;
}

export class BranchProcessor {
  private readonly client: InstanceType<typeof GitHub>;
  private readonly options: IIssuesProcessorOptions;
  private readonly operations: StaleOperations;
  private readonly logger: Logger = new Logger();
  private deletedBranchesCount = 0;

  constructor(
    client: InstanceType<typeof GitHub>,
    options: IIssuesProcessorOptions,
    operations: StaleOperations
  ) {
    this.client = client;
    this.options = options;
    this.operations = operations;
  }

  async processBranches(): Promise<string[]> {
    if (!this.options.staleBranches) {
      this.logger.info(
        'Branch cleanup is disabled. Skipping branch processing.'
      );
      return [];
    }

    this.logger.info(LoggerService.yellow('Starting stale branch cleanup...'));

    const deletedBranches: string[] = [];

    try {
      // Get default branch
      const defaultBranch = await this._getDefaultBranch();
      this.logger.info(`Default branch: ${LoggerService.cyan(defaultBranch)}`);

      // List all branches
      const branches = await this._listBranches();
      this.logger.info(
        `Found ${LoggerService.cyan(branches.length)} total branches`
      );

      // Filter out default branch
      const nonDefaultBranches = branches.filter(b => b.name !== defaultBranch);
      this.logger.info(
        `Scanning ${LoggerService.cyan(
          nonDefaultBranches.length
        )} non-default branches`
      );

      // Process each branch
      for (const branch of nonDefaultBranches) {
        if (
          this.deletedBranchesCount >= this.options.maxBranchDeletionsPerRun
        ) {
          this.logger.warning(
            `Reached maximum branch deletions per run (${this.options.maxBranchDeletionsPerRun}). Stopping.`
          );
          break;
        }

        if (this.operations.hasRemainingOperations() === false) {
          this.logger.warning(
            'Reached operations limit. Stopping branch processing.'
          );
          break;
        }

        const result = await this._processBranch(branch);
        if (result.deleted) {
          deletedBranches.push(result.name);
          this.deletedBranchesCount++;
        }
      }

      this.logger.info(
        LoggerService.green(
          `Branch cleanup complete. Deleted ${this.deletedBranchesCount} branches.`
        )
      );
    } catch (error) {
      this.logger.error(`Error during branch processing: ${error.message}`);
      core.error(error);
    }

    return deletedBranches;
  }

  private async _processBranch(
    branch: IBranchInfo
  ): Promise<IBranchDeletionResult> {
    this.logger.info(`\nProcessing branch: ${LoggerService.cyan(branch.name)}`);

    // Check if protected and should be exempted
    if (branch.protected && this.options.exemptProtectedBranches) {
      this.logger.info(`├── Skipping: branch is protected`);
      return {name: branch.name, deleted: false, reason: 'protected'};
    }

    // Check exempt patterns
    if (this._isExemptBranch(branch.name)) {
      this.logger.info(`├── Skipping: branch matches exempt pattern`);
      return {name: branch.name, deleted: false, reason: 'exempt pattern'};
    }

    // Check staleness
    const isStale = this._isBranchStale(branch);
    if (!isStale) {
      this.logger.info(
        `├── Skipping: branch is not stale (last commit: ${branch.commit.date.toISOString()})`
      );
      return {name: branch.name, deleted: false, reason: 'not stale'};
    }

    this.logger.info(
      `├── Branch is stale (last commit: ${LoggerService.cyan(
        branch.commit.date.toISOString()
      )})`
    );

    // Check for open PR
    this.operations.consumeOperation();
    const hasOpenPR = await this._hasOpenPullRequest(branch.name);
    if (hasOpenPR) {
      this.logger.info(`└── Skipping: branch has an open pull request`);
      return {name: branch.name, deleted: false, reason: 'has open PR'};
    }

    // Delete branch
    if (
      this.options.deleteStaleBranches &&
      !this.options.dryRun &&
      !this.options.debugOnly
    ) {
      this.logger.info(
        `└── Deleting stale branch: ${LoggerService.cyan(branch.name)}`
      );
      await this._deleteBranch(branch.name);
      return {name: branch.name, deleted: true};
    } else {
      const mode =
        this.options.dryRun || this.options.debugOnly
          ? 'DRY-RUN'
          : 'WOULD DELETE';
      this.logger.info(
        `└── ${LoggerService.yellow(
          `[${mode}]`
        )} Would delete branch: ${LoggerService.cyan(branch.name)}`
      );
      return {name: branch.name, deleted: false, reason: 'dry-run or disabled'};
    }
  }

  private async _getDefaultBranch(): Promise<string> {
    this.operations.consumeOperation();
    const {data: repo} = await this.client.rest.repos.get({
      owner: context.repo.owner,
      repo: context.repo.repo
    });
    return repo.default_branch;
  }

  private async _listBranches(): Promise<IBranchInfo[]> {
    const branches: IBranchInfo[] = [];
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      this.operations.consumeOperation();
      const {data} = await this.client.rest.repos.listBranches({
        owner: context.repo.owner,
        repo: context.repo.repo,
        per_page: perPage,
        page
      });

      for (const branch of data) {
        // Get commit details to fetch timestamp
        this.operations.consumeOperation();
        const {data: commit} = await this.client.rest.repos.getCommit({
          owner: context.repo.owner,
          repo: context.repo.repo,
          ref: branch.commit.sha
        });

        branches.push({
          name: branch.name,
          commit: {
            sha: branch.commit.sha,
            date: new Date(
              commit.commit.committer?.date ||
                commit.commit.author?.date ||
                new Date()
            )
          },
          protected: branch.protected
        });
      }

      hasMore = data.length === perPage;
      page++;
    }

    return branches;
  }

  private _isBranchStale(branch: IBranchInfo): boolean {
    const now = new Date();
    const daysSinceLastCommit =
      (now.getTime() - branch.commit.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastCommit > this.options.staleBranchDays;
  }

  private _isExemptBranch(branchName: string): boolean {
    if (!this.options.exemptBranches) {
      return false;
    }

    const exemptPatterns = this.options.exemptBranches
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    for (const pattern of exemptPatterns) {
      if (this._matchesPattern(branchName, pattern)) {
        return true;
      }
    }

    return false;
  }

  private _matchesPattern(branchName: string, pattern: string): boolean {
    // Exact match
    if (branchName === pattern) {
      return true;
    }

    // Glob pattern matching (simple implementation)
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(branchName);
  }

  private async _hasOpenPullRequest(branchName: string): Promise<boolean> {
    try {
      const {data: pulls} = await this.client.rest.pulls.list({
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'open',
        head: `${context.repo.owner}:${branchName}`,
        per_page: 1
      });

      return pulls.length > 0;
    } catch (error) {
      this.logger.warning(`Error checking for open PRs: ${error.message}`);
      return true; // Err on the side of caution
    }
  }

  private async _deleteBranch(branchName: string): Promise<void> {
    try {
      this.operations.consumeOperation();
      await this.client.rest.git.deleteRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `heads/${branchName}`
      });
      this.logger.info(
        `Successfully deleted branch: ${LoggerService.cyan(branchName)}`
      );
    } catch (error) {
      this.logger.error(
        `Error deleting branch ${LoggerService.cyan(branchName)}: ${
          error.message
        }`
      );
      throw error;
    }
  }

  getDeletedBranchesCount(): number {
    return this.deletedBranchesCount;
  }
}
