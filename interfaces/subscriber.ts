import {IEvent} from './event'

export interface ISubscriber {
    handle(event: IEvent): void;
  }