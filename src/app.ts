import {eventGenerator} from "./helpers";
import {Machine} from "./machine";
import {EVENT, PublishSubscribeService} from "./pubsub";
import {MachineRefillSubscriber, MachineSaleSubscriber, StockLowSubscriber, StockOkSubscriber} from "./subscriber";

(async () => {
    // create 3 machines with a quantity of 10 stock
    const machines: Machine[] = [new Machine('001'), new Machine('002'), new Machine('003')];

    // init pub sub service
    const pubSub = new PublishSubscribeService();

    // create a machine sale event subscriber. inject the machines (all subscribers should do this)
    const saleSubscriber = new MachineSaleSubscriber(machines, pubSub);
    const refillSubscriber = new MachineRefillSubscriber(machines, pubSub);
    const stockLowSubscriber = new StockLowSubscriber(machines);
    const stockOkSubscriber = new StockOkSubscriber(machines);

    // create the PubSub service
    const pubSubService = new PublishSubscribeService();

    // add subscribers
    pubSubService.subscribe(EVENT.SALE, saleSubscriber);
    pubSubService.subscribe(EVENT.REFILL, refillSubscriber);
    pubSubService.subscribe(EVENT.STOCK_LOW, stockLowSubscriber);
    pubSubService.subscribe(EVENT.STOCK_OK, stockOkSubscriber);

    // create 5 random events
    const events = [1, 2, 3, 4, 5].map(i => eventGenerator());

    // publish the events
    events.map(pubSubService.publish);
})();
