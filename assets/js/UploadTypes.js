// @flow
import {Map} from 'immutable';

export type Action =
    | {
          type: 'upload/bytesUploaded',
          path: string,
          bytesUploaded: number
      }
    | {
          type: 'upload/statusChanged',
          status: string,
          message: string
      }
    | {
          type: 'upload/configurationUpdated',
          accessKeyId: string,
          secretAccessKey: string,
          bucket: string,
          region: string,
          keyPrefix: string
      };

export type State = {
    bytesUploaded: Map<string, number>,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    region: string,
    keyPrefix: string,
    status: string, // TODO: 'Untested' | 'Untested' | 'Successful' | 'Unsuccessful',
    message: string
};

export type Dispatch = (action: Action) => void;
