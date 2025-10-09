import {OctokitIssue} from './issue';

export interface ExtendedOctokitIssue extends OctokitIssue {
  type?: {
    id: number;
    node_id: string;
    name: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
    is_enabled: boolean;
  };
}
