import {IEvent} from "./event";
import {ISubscriber} from "./subscriber";

const EVENT = {
    SALE: "sale",
    REFILL: "refill",
    STOCK_LOW: "stock_low",
    STOCK_OK: "stock_ok"
}

interface IPublishSubscribeService {
    publish(event: IEvent): void;

    subscribe(type: string, handler: ISubscriber): void;

    unsubscribe(type: string, handler: ISubscriber): void;
}

class PublishSubscribeService implements IPublishSubscribeService {
    private subscribers: Map<string, ISubscriber[]>

    constructor() {
        this.subscribers = new Map<string, ISubscriber[]>;
    }

    publish(event: IEvent): void {
        const handlers = this.subscribers.get(event.type()) ?? [];
        handlers.forEach(handler => handler.handle(event));
    }

    subscribe(type: string, handler: ISubscriber): void {
        const eventHandlers = this.subscribers.get(type) ?? [];
        this.subscribers.set(type, eventHandlers.concat(handler));
    }

    unsubscribe(type: string, handler: ISubscriber) {
        const handlers = this.subscribers.get(type) ?? [];
        if (handlers.length > 0) {
            const removingHandlerIndex = handlers.findIndex(h => h.getId() === handler.getId());
            const leftHandlers = handlers.slice(0, removingHandlerIndex);
            const rightHandlers = handlers.slice(removingHandlerIndex + 1);

            this.subscribers.set(type, leftHandlers.concat(rightHandlers));
        }
    }
}

export {
    EVENT,
    IPublishSubscribeService,
    PublishSubscribeService
}