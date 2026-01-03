import * as Events from './events';
import { IMachineRepository, Machine } from './machine';

export interface ISubscriber {
    handle(event: Events.IEvent): Promise<void>;
}

export interface IPublishSubscribeService {
    publish(event: Events.IEvent): Promise<void>;
    subscribe(type: string, handler: ISubscriber): void;
    unsubscribe(type: string, handler: ISubscriber): void;
    getTypes(): string[];
    printTypesAndSubscribers(): void;
}

export class PubSubService implements IPublishSubscribeService {
    public subscribers: Map<string, ISubscriber[]> = new Map();
    private eventQueue: Events.IEvent[] = [];
    private isProcessing = false;

    private processedEventsUUID: Map<string, boolean> = new Map();
    private readonly MAX_HISTORY = 1000;

    subscribe(type: string, handler: ISubscriber): void {
        const handlers = this.subscribers.get(type) || [];
        handlers.push(handler);
        this.subscribers.set(type, handlers);
    }

    unsubscribe(type: string, handler: ISubscriber): void {
        const handlers = this.subscribers.get(type);
        if (handlers) {
            this.subscribers.set(
                type,
                handlers.filter((h) => h !== handler),
            );
        }
    }

    async publish(event: Events.IEvent): Promise<void> {
        if (this.processedEventsUUID.has(event.eventUUID)) {
            console.warn('Events has been processed already');
            return;
        }
        this.processedEventsUUID.set(event.eventUUID, true);

        if (this.processedEventsUUID.size > this.MAX_HISTORY) {
            const oldestKey = this.processedEventsUUID.keys().next().value;
            if (oldestKey) this.processedEventsUUID.delete(oldestKey);
        }

        this.eventQueue.push(event);

        if (this.isProcessing) return;

        this.isProcessing = true;
        try {
            while (this.eventQueue.length > 0) {
                const currentEvent = this.eventQueue.shift();
                if (!currentEvent) continue;

                const handlers = this.subscribers.get(currentEvent.type());
                if (handlers) {
                    const handlersSnapshot = [...handlers];

                    for (const handler of handlersSnapshot) {
                        try {
                            await handler.handle(currentEvent);
                        } catch (err) {
                            console.log(`Error handling event ${currentEvent.type()}:`, err);
                        }
                    }
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    getTypes(): string[] {
        return Array.from(this.subscribers.keys());
    }

    printTypesAndSubscribers(): void {
        console.log('--- Active Subscriptions ---');

        for (const [type, handlers] of this.subscribers) {
            const subscriberNames = handlers.map((handler) => handler.constructor.name).join(', ');
            console.log(`${type} | ${subscriberNames}`);
        }

        console.log('----------------------------');
    }
}

export class MachineSaleSubscriber implements ISubscriber {
    // sales cannot be made if machine is idle or offline

    constructor(private repo: IMachineRepository) {}

    async handle(event: Events.IEvent): Promise<void> {
        if (event instanceof Events.MachineSaleEvent) {
            const maybe = await this.repo.findById(event.machineId());
            if (maybe.isSome) {
                const machine = maybe.getValue();

                machine.stockLevel -= event.getSoldQuantity();
                await this.repo.updateId(machine);
                console.log(`[Sale] Machine ${machine.id} stock reduced to ${machine.stockLevel}`);
            }
        }
    }
}

export class MachineRefillSubscriber implements ISubscriber {
    constructor(private repo: IMachineRepository) {}

    async handle(event: Events.IEvent): Promise<void> {
        if (event instanceof Events.MachineRefillEvent) {
            const maybe = await this.repo.findById(event.machineId());
            if (maybe.isSome) {
                const machine = maybe.getValue();

                machine.stockLevel += event.getRefillAmount();
                await this.repo.updateId(machine);
                console.log(
                    `[Refill] Machine ${machine.id} stock increased to ${machine.stockLevel}`,
                );
            }
        }
    }
}

export class StockLevelMonitorSubscriberPublisher implements ISubscriber {
    // Acts as both publisher and subscriber
    // monitors the stock levels of machines
    // when it drops below 3, LowStockWarningEvent generated
    // when it hits >=3, StockLevelOkEvent generated
    // must be tagged with respective machine ID
    // must only fire once
    constructor(
        private repo: IMachineRepository,
        private pubsub: IPublishSubscribeService,
    ) {}

    async handle(event: Events.IEvent): Promise<void> {
        const LOW_STOCK_THRESHOLD = 3;
        if (
            event instanceof Events.MachineSaleEvent ||
            event instanceof Events.MachineRefillEvent
        ) {
            const maybe = await this.repo.findById(event.machineId());
            if (maybe.isSome) {
                const machine = maybe.getValue();
                const stockThen = event.getStockThen();
                const stockNow = event.getStockNow();

                if (stockThen >= LOW_STOCK_THRESHOLD && stockNow < LOW_STOCK_THRESHOLD) {
                    await this.pubsub.publish(new Events.LowStockWarningEvent(machine.id));
                }
                if (stockThen < LOW_STOCK_THRESHOLD && stockNow >= LOW_STOCK_THRESHOLD) {
                    await this.pubsub.publish(new Events.StockLevelOkEvent(machine.id));
                }
            }
        }
    }
}
// note: for this I had to change the parameters of the MachineRefill and MachineSaleEvent
// from _sold to before and after
// this was to avoid 'race update issue' because both stocklevelmonitor
// and MachineSaleSubscriber/MachineRefillSubscriber listen to the same event.

export class MachineStatusMonitorSubscriber implements ISubscriber {
    constructor(private repo: IMachineRepository) {}

    async handle(event: Events.IEvent): Promise<void> {
        if (event instanceof Events.MachineCreatedEvent) {
            const newMachine = new Machine(event.machineId());

            await this.repo.updateId(newMachine);
            console.log(`[Status] Created Machine ${event.machineId()}`);
        } else if (event instanceof Events.MachineDeletedEvent) {
            // Assumption: repo needs a delete method.
            // If your interface doesn't have it, you'll need to add it (see below).
            await this.repo.delete(event.machineId());
            console.log(`[Status] Deleted Machine ${event.machineId()}`);
        } else if (event instanceof Events.MachineStatusChangedEvent) {
            const maybe = await this.repo.findById(event.machineId());
            if (maybe.isSome) {
                const machine = maybe.getValue();

                machine.statusFlag = event.newStatus();
                await this.repo.updateId(machine);
                console.log(
                    `[Status] Machine ${machine.id} status changed to ${machine.statusFlag}`,
                );
            }
        }
    }
}
