import {OctokitIssue} from './issue'; // Adjust the import path based on your project structure

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
