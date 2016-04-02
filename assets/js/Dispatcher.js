// @flow
import type {Action} from './Actions';

import {Dispatcher} from 'flux';

const instance: Dispatcher<Action> = new Dispatcher();
export default instance;

const _dispatch = instance.dispatch.bind(instance);

export function dispatch(action: Action): void {
    return _dispatch(action)
}
