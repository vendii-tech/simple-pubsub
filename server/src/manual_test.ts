import * as Events from './events';
import {
    PubSubService,
    MachineSaleSubscriber,
    MachineRefillSubscriber,
    StockLevelMonitorSubscriberPublisher,
    MachineStatusMonitorSubscriber,
} from './pubsub';
import { Machine, MachineRepository } from './machine';
import { validMachineStatus } from './utils';

async function main() {
    console.log('--- Setting up manual test ---');

    // 1. Create repository and PubSub service
    const machineRepo = new MachineRepository();
    const pubSub = new PubSubService();

    // 2. Instantiate subscribers
    const saleSubscriber = new MachineSaleSubscriber(machineRepo);
    const refillSubscriber = new MachineRefillSubscriber(machineRepo);
    const statusMonitor = new MachineStatusMonitorSubscriber(machineRepo);
    const stockMonitor = new StockLevelMonitorSubscriberPublisher(machineRepo, pubSub);

    // 3. Subscribe handlers to events
    pubSub.subscribe('machine.create', statusMonitor);
    pubSub.subscribe('machine.delete', statusMonitor);
    pubSub.subscribe('machine.status.change', statusMonitor);
    pubSub.subscribe('machine.sale', saleSubscriber);
    pubSub.subscribe('machine.refill', refillSubscriber);

    // Stock monitor listens to both sales and refills
    pubSub.subscribe('machine.sale', stockMonitor);
    pubSub.subscribe('machine.refill', stockMonitor);

    pubSub.printTypesAndSubscribers();

    // 4. Start publishing events
    console.log('\n--- Running simulation ---\n');

    const machineId1 = 'machine-001';
    const machineId2 = 'machine-002';

    // Create two machines
    await pubSub.publish(new Events.MachineCreatedEvent(machineId1));
    await pubSub.publish(new Events.MachineCreatedEvent(machineId2));

    let machine1 = (await machineRepo.findById(machineId1)).getValue();
    console.log(`Initial state of ${machineId1}:`, machine1);

    // Change status
    await pubSub.publish(
        new Events.MachineStatusChangedEvent(machineId1, 'Idle' as validMachineStatus),
    );

    // Make a sale
    let stockThen = machine1.stockLevel;
    let saleQty = 2;
    await pubSub.publish(
        new Events.MachineSaleEvent(machineId1, saleQty, stockThen, stockThen - saleQty),
    );

    // Make another sale to trigger low stock
    machine1 = (await machineRepo.findById(machineId1)).getValue();
    stockThen = machine1.stockLevel;
    saleQty = 6;
    console.log(`\nSelling ${saleQty} items from ${machineId1} (current stock: ${stockThen})`);
    await pubSub.publish(
        new Events.MachineSaleEvent(machineId1, saleQty, stockThen, stockThen - saleQty),
    );

    // Refill machine to bring it back to normal
    machine1 = (await machineRepo.findById(machineId1)).getValue();
    stockThen = machine1.stockLevel;
    let refillQty = 5;
    console.log(`\nRefilling ${machineId1} with ${refillQty} items (current stock: ${stockThen})`);
    await pubSub.publish(
        new Events.MachineRefillEvent(machineId1, refillQty, stockThen, stockThen + refillQty),
    );

    // Delete a machine
    console.log(`\nDeleting machine ${machineId2}`);
    await pubSub.publish(new Events.MachineDeletedEvent(machineId2));

    const allMachines = await machineRepo.findAll();
    console.log('\nFinal state of machines:', allMachines);

    console.log('\n--- Manual test finished ---');
}

main().catch(console.error);
