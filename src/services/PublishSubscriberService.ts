import { IEvent } from '../interfaces/IEvent';
import { IPublishSubscribeService } from '../interfaces/IPublishSubscribeService';
import { ISubscriber } from '../interfaces/ISubscriber';

class PublishSubscriberService implements IPublishSubscribeService {
    private subscribers: Map<string, ISubscriber> = new Map();

    publish(event: IEvent): void {
        const handler = this.subscribers.get(event.type());
        if (handler) {
            handler.handle(event);
        }
    }

    subscribe(type: string, handler: ISubscriber): void {
        this.subscribers.set(type, handler);       
    }

    unsubscribe(type: string, handler: ISubscriber): void {
        if (this.subscribers.get(type) === handler) {
            this.subscribers.delete(type);
        }
    }
}

export { PublishSubscriberService }
