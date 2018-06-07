import type Immutable from 'immutable';
import type BagFile from '../js/BagFile';

export type Action =
    | {
          type: 'bag/filesSelected',
          files: Map<string, File>
      }
    | {
          type: 'bag/fileHashed',
          path: string,
          hash: string
      };

export type State = Immutable.Map<string, BagFile>;
