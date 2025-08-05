// import {ILabel} from './label';

// export interface IIssueEvent {
//   created_at: string;
//   event: string;
//   label: ILabel;
// }
export interface IIssueEvent {
  id: number;
  node_id: string;
  url: string;
  actor: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  event: string;
  commit_id: string | null;
  commit_url: string | null;
  created_at: string;
  label?: {
    name: string;
    color: string;
    // description: string | null;
  };
}
