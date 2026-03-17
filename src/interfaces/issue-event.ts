import {ILabel} from './label.js';

export interface IIssueEvent {
  created_at: string;
  event: string;
  label: ILabel;
}
