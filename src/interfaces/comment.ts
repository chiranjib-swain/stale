import {IUser} from './user.js';

export interface IComment {
  user: IUser | null;
  body?: string;
}
