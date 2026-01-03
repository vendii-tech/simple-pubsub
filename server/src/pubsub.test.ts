import * as Events from './events';
import {
    MachineSaleSubscriber,
    MachineRefillSubscriber,
    StockLevelMonitorSubscriberPublisher,
    MachineStatusMonitorSubscriber,
    PubSubService,
} from './pubsub'; // Adjust path based on your file structure
import { Machine, MachineRepository, IMachineRepository } from './machine';
import { Maybe } from './utils';

describe('Machine Subscribers Unit Tests', () => {
    let mockRepo: jest.Mocked<IMachineRepository>;
    let mockPubSub: jest.Mocked<PubSubService>;

    beforeEach(() => {
        mockRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            updateId: jest.fn(),
            delete: jest.fn(),
        } as any;

        mockPubSub = {
            publish: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
        } as any;
    });

    describe('MachineSaleSubscriber', () => {
        it('should reduce stock level when a sale occurs', async () => {
            const machine = new Machine('m1');
            machine.stockLevel = 10;
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            const subscriber = new MachineSaleSubscriber(mockRepo);
            const event = new Events.MachineSaleEvent('m1', 2, 10, 8);

            await subscriber.handle(event);

            expect(machine.stockLevel).toBe(8);
            expect(mockRepo.updateId).toHaveBeenCalledWith(machine);
        });

        it('should do nothing if machine is not found', async () => {
            mockRepo.findById.mockResolvedValue(Maybe.none());
            const subscriber = new MachineSaleSubscriber(mockRepo);
            const event = new Events.MachineSaleEvent('m1', 1, 5, 4);

            await subscriber.handle(event);
            expect(mockRepo.updateId).not.toHaveBeenCalled();
        });
    });

    describe('MachineRefillSubscriber', () => {
        it('should increase stock level when a refill occurs', async () => {
            const machine = new Machine('m1');
            machine.stockLevel = 2;
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            const subscriber = new MachineRefillSubscriber(mockRepo);
            const event = new Events.MachineRefillEvent('m1', 5, 2, 7);

            await subscriber.handle(event);

            expect(machine.stockLevel).toBe(7);
            expect(mockRepo.updateId).toHaveBeenCalledWith(machine);
        });
    });

    describe('StockLevelMonitorSubscriberPublisher', () => {
        let monitor: StockLevelMonitorSubscriberPublisher;

        beforeEach(() => {
            monitor = new StockLevelMonitorSubscriberPublisher(mockRepo, mockPubSub);
        });

        it('should publish LowStockWarningEvent when stock drops from 3 to 2', async () => {
            const machine = new Machine('m1');
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            // Stock dropped from 3 to 2
            const event = new Events.MachineSaleEvent('m1', 1, 3, 2);
            await monitor.handle(event);

            expect(mockPubSub.publish).toHaveBeenCalledWith(
                expect.any(Events.LowStockWarningEvent),
            );
        });

        it('should publish StockLevelOkEvent when stock rises from 2 to 3', async () => {
            const machine = new Machine('m1');
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            // Refilled from 2 to 3
            const event = new Events.MachineRefillEvent('m1', 1, 2, 3);
            await monitor.handle(event);

            expect(mockPubSub.publish).toHaveBeenCalledWith(expect.any(Events.StockLevelOkEvent));
        });

        it('should NOT publish anything if stock remains above threshold (e.g., 10 to 5)', async () => {
            const machine = new Machine('m1');
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            const event = new Events.MachineSaleEvent('m1', 5, 10, 5);
            await monitor.handle(event);

            expect(mockPubSub.publish).not.toHaveBeenCalled();
        });

        it('should NOT publish anything if stock remains below threshold (e.g., 2 to 1)', async () => {
            const machine = new Machine('m1');
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            const event = new Events.MachineSaleEvent('m1', 1, 2, 1);
            await monitor.handle(event);

            expect(mockPubSub.publish).not.toHaveBeenCalled();
        });
    });

    describe('MachineStatusMonitorSubscriber', () => {
        let statusSubscriber: MachineStatusMonitorSubscriber;

        beforeEach(() => {
            statusSubscriber = new MachineStatusMonitorSubscriber(mockRepo);
        });

        it('should create a new machine on MachineCreatedEvent', async () => {
            const event = new Events.MachineCreatedEvent('new-m1');
            await statusSubscriber.handle(event);

            expect(mockRepo.updateId).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'new-m1',
                    stockLevel: 10,
                }),
            );
        });

        it('should delete a machine on MachineDeletedEvent', async () => {
            const event = new Events.MachineDeletedEvent('m1');
            await statusSubscriber.handle(event);

            expect(mockRepo.delete).toHaveBeenCalledWith('m1');
        });

        it('should update machine status on MachineStatusChangedEvent', async () => {
            const machine = new Machine('m1');
            machine.statusFlag = 'Offline';
            mockRepo.findById.mockResolvedValue(Maybe.some(machine));

            const event = new Events.MachineStatusChangedEvent('m1', 'Active');
            await statusSubscriber.handle(event);

            expect(machine.statusFlag).toBe('Active');
            expect(mockRepo.updateId).toHaveBeenCalledWith(machine);
        });
    });
});

describe('PubSubService Unit Tests', () => {
    let pubsub: PubSubService;

    // A simple mock subscriber helper
    const createMockSubscriber = () => ({
        handle: jest.fn().mockResolvedValue(undefined),
    });

    const createMockEvent = (
        type: string,
        id: string = '1',
        uuid: string = crypto.randomUUID(),
    ) => ({
        type: () => type,
        machineId: () => id,
        eventUUID: uuid, // Property, not a function
    });

    beforeEach(() => {
        pubsub = new PubSubService();
    });

    it('should correctly register a subscriber', () => {
        const handler = createMockSubscriber();
        const eventType = 'test.event';

        pubsub.subscribe(eventType, handler);

        // Verify using the public 'subscribers' map
        const handlers = pubsub.subscribers.get(eventType);
        expect(handlers).toBeDefined();
        expect(handlers?.length).toBe(1);
        expect(handlers![0]).toBe(handler);
    });

    it('should correctly unsubscribe a handler', () => {
        const handler1 = createMockSubscriber();
        const handler2 = createMockSubscriber();
        const eventType = 'test.event';

        // Add two subscribers
        pubsub.subscribe(eventType, handler1);
        pubsub.subscribe(eventType, handler2);

        // Verify both are present
        expect(pubsub.subscribers.get(eventType)?.length).toBe(2);

        // Remove the first one
        pubsub.unsubscribe(eventType, handler1);

        // Verify handler1 is gone, but handler2 remains
        const remainingHandlers = pubsub.subscribers.get(eventType);
        expect(remainingHandlers?.length).toBe(1);
        expect(remainingHandlers).toContain(handler2);
        expect(remainingHandlers).not.toContain(handler1);
    });

    it('should NOT deliver an event to a subscriber that joins after the event is processed', async () => {
        const handler = createMockSubscriber();
        const eventType = 'historical.event';

        console.log('ISSUSSEEEEE~~~~~~~`');
        // 1. Publish the event BEFORE subscribing
        // The service receives it, processes it (finds no subscribers), and discards it from the queue.
        await pubsub.publish(createMockEvent(eventType));

        // 2. Subscribe AFTER the event has been flushed from the queue
        pubsub.subscribe(eventType, handler);

        // 3. Publish a new event to prove the connection works now
        await pubsub.publish(createMockEvent(eventType));

        // Assertion:
        // The handler should only have been called 1 time (for the second event).
        // It should not have received the first event.
        expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribing a handler that was never subscribed (graceful failure)', () => {
        const handler = createMockSubscriber();
        // Should not throw an error
        expect(() => pubsub.unsubscribe('non.existent', handler)).not.toThrow();
    });
});

describe('Integration: All Subscribers Working Together', () => {
    it('should process a full lifecycle: create, sale (trigger warning), and refill (trigger ok)', async () => {
        const repo = new MachineRepository();
        const pubsub = new PubSubService();

        // 1. Setup Subscribers
        const statusSub = new MachineStatusMonitorSubscriber(repo);
        const saleSub = new MachineSaleSubscriber(repo);
        const refillSub = new MachineRefillSubscriber(repo);
        const monitorSub = new StockLevelMonitorSubscriberPublisher(repo, pubsub);

        // 2. Register Subscriptions
        pubsub.subscribe('machine.create', statusSub);
        pubsub.subscribe('machine.delete', statusSub);
        pubsub.subscribe('machine.status.change', statusSub);
        pubsub.subscribe('machine.sale', saleSub);
        pubsub.subscribe('machine.sale', monitorSub);
        pubsub.subscribe('machine.refill', refillSub);
        pubsub.subscribe('machine.refill', monitorSub);

        // Track warnings/ok events for verification
        const lowStockHandler = { handle: jest.fn() };
        const okStockHandler = { handle: jest.fn() };
        pubsub.subscribe('machine.stock.low', lowStockHandler);
        pubsub.subscribe('machine.stock.ok', okStockHandler);

        // 3. Execution Flow

        // A. Create Machine (Starts with 10 stock)
        await pubsub.publish(new Events.MachineCreatedEvent('machine-abc'));
        let machine = (await repo.findById('machine-abc')).getValue();
        expect(machine).toBeDefined();

        pubsub.printTypesAndSubscribers();
        // B. Large Sale: 10 -> 2 (Should trigger LowStockWarning)
        // Since subscribers are async and PubSub processes in a queue:
        await pubsub.publish(new Events.MachineSaleEvent('machine-abc', 8, 10, 2));

        machine = (await repo.findById('machine-abc')).getValue();
        expect(machine.stockLevel).toBe(2);
        expect(lowStockHandler.handle).toHaveBeenCalledTimes(1);
        expect(lowStockHandler.handle).toHaveBeenCalledWith(
            expect.any(Events.LowStockWarningEvent),
        );

        // C. Refill: 2 -> 5 (Should trigger StockLevelOk)
        await pubsub.publish(new Events.MachineRefillEvent('machine-abc', 3, 2, 5));

        machine = (await repo.findById('machine-abc')).getValue();
        expect(machine.stockLevel).toBe(5);
        expect(okStockHandler.handle).toHaveBeenCalledTimes(1);
        expect(okStockHandler.handle).toHaveBeenCalledWith(expect.any(Events.StockLevelOkEvent));

        // D. Status Change
        await pubsub.publish(new Events.MachineStatusChangedEvent('machine-abc', 'Active'));
        machine = (await repo.findById('machine-abc')).getValue();
        expect(machine.statusFlag).toBe('Active');

        // E. Delete
        await pubsub.publish(new Events.MachineDeletedEvent('machine-abc'));
        const deletedCheck = await repo.findById('machine-abc');
        expect(deletedCheck.isNone).toBe(true);
    });
});

describe('PubSubService Deduplication Tests', () => {
    let pubsub: PubSubService;

    beforeEach(() => {
        pubsub = new PubSubService();
    });

    it('should ignore a duplicate event (same instance sent twice)', async () => {
        // 1. Setup Subscriber
        const handler = { handle: jest.fn() };
        pubsub.subscribe('machine.stock.low', handler);

        // 2. Create ONE event instance
        // The constructor generates a random UUID (e.g., "abc-123")
        const warningEvent = new Events.LowStockWarningEvent('machine-01');

        // Store the UUID to verify we are testing what we think we are
        const originalUUID = warningEvent.eventUUID;

        // 3. Publish the First Time
        await pubsub.publish(warningEvent);

        expect(handler.handle).toHaveBeenCalledTimes(1);
        expect(handler.handle).toHaveBeenCalledWith(warningEvent);

        // 4. Publish the SAME instance a Second Time
        await pubsub.publish(warningEvent);

        // 5. Assert: The handler count should still be 1 (deduplicated)
        expect(handler.handle).toHaveBeenCalledTimes(1);

        // Sanity check: ensure the UUID didn't change
        expect(warningEvent.eventUUID).toBe(originalUUID);
    });

    it('should process two different events of the same type', async () => {
        const handler = { handle: jest.fn() };
        pubsub.subscribe('machine.stock.low', handler);

        // Create TWO distinct instances (different UUIDs)
        const eventA = new Events.LowStockWarningEvent('m1');
        const eventB = new Events.LowStockWarningEvent('m1');

        await pubsub.publish(eventA);
        await pubsub.publish(eventB);

        expect(handler.handle).toHaveBeenCalledTimes(2);
    });
});
