import {IsoDateString} from '../types/iso-date-string.js';
import {Assignee} from './assignee.js';
import {ILabel} from './label.js';
import {IMilestone} from './milestone.js';
import {components} from '@octokit/openapi-types';
export interface IIssue {
  title: string;
  number: number;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  draft: boolean;
  labels: ILabel[];
  pull_request?: object | null;
  state: string;
  locked: boolean;
  milestone?: IMilestone | null;
  assignees?: Assignee[] | null;
  issue_type?: string;
}

export type OctokitIssue = components['schemas']['issue'];
