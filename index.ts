import {
    IEvent,
    IPublishSubscribeService
} from './src/interfaces/';

import {
    PublishSubscriberService
} from './src/services/'

import {
    StockEventType
} from './src/constants/';

import {
    Machine,
    MachineSaleEvent,
    MachineRefillEvent,
    MachineSaleSubscriber,
    MachineRefillSubscriber,
} from './src/models/';

const randomMachine = (): string => {
    const random = Math.random() * 3;
    if (random < 1) {
        return '001';
    } else if (random < 2) {
        return '002';
    }
    return '003';
}

const eventGenerator = (): IEvent => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
    return new MachineRefillEvent(refillQty, randomMachine());
}

(async () => {
    const machines: Machine[] = [new Machine('001'), new Machine('002'), new Machine('003')];

    // project should only init IPublishSubscribeService once, ref: singleton design pattern.
    const pubSubService: IPublishSubscribeService = new PublishSubscriberService();
    const saleSubscriber = new MachineSaleSubscriber(pubSubService, machines);
    const refillSubscriber = new MachineRefillSubscriber(pubSubService, machines);

    pubSubService.subscribe(StockEventType.Sale, saleSubscriber)
    pubSubService.subscribe(StockEventType.Refill, refillSubscriber)

    // const events = [1, 2, 3, 4, 5].map(i => eventGenerator());
    const events: IEvent[] = [
        new MachineSaleEvent(8, '001'), // stock level decrease to 2, this will fire low stock warning event.
        new MachineSaleEvent(1, '001'), // stock level decrease to 1, this won't fire low stock warning event because it's already had.
        new MachineRefillEvent(5, '001'), // stock level increase to 6, this will fire ok stock event and reset low stock warning.
        new MachineRefillEvent(1, '001'), // stock level increase to 7, this won't fire ok stock event because it's already had.
        new MachineSaleEvent(5, '001'), // stock level decrease to 2, this will fire low stock warning event again because it's already reset.
        new MachineRefillEvent(5, '001') // stock level increase to 7, this will fire ok stock event again because it's already reset.
    ];

    events.map(event => pubSubService.publish(event));
})();
