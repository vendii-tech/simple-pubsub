import { IEvent } from './event'
import { ISubscriber } from './subscriber'

export interface IPublishSubscribeService {
    publish (event: IEvent): void;
    subscribe (type: string, handler: ISubscriber): void;
    // unsubscribe ( /* Question 2 - build this feature */ );
  }