import { IEvent } from './IEvent';
import { ISubscriber } from './ISubscriber';

interface IPublishSubscribeService {
    publish(event: IEvent): void;
    subscribe(type: string, handler: ISubscriber): void;
    unsubscribe(type: string, handler: ISubscriber): void;
}

export { IPublishSubscribeService }
