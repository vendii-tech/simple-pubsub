import { IEvent } from './event'
import { ISubscriber } from './subscriber'

export interface IPublishSubscribeService {
    publish (event: IEvent): void;
    subscribe (type: string, handler: ISubscriber): void;
    unsubscribe (type: string): void;
  }