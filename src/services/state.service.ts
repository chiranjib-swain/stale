import {IState} from '../interfaces/state/state.js';
import {State} from '../classes/state/state.js';
import {IIssuesProcessorOptions} from '../interfaces/issues-processor-options.js';
import {StateCacheStorage} from '../classes/state/state-cache-storage.js';

export const getStateInstance = (options: IIssuesProcessorOptions): IState => {
  const storage = new StateCacheStorage();
  return new State(storage, options);
};
