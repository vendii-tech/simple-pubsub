"use strict";
// interfaces
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// implementations
// Events happen when a sale is made.
class MachineSaleEvent {
    constructor(_sold, _machineId) {
        this._sold = _sold;
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    getSoldQuantity() {
        return this._sold;
    }
    type() {
        return 'sale';
    }
}
// Event triggered when a refill occurs
class MachineRefillEvent {
    constructor(_refill, _machineId) {
        this._refill = _refill;
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    getRefillQuantity() {
        return this._refill;
    }
    type() {
        return 'refill';
    }
}
// Event triggered when stock is low
class LowStockWarningEvent {
    constructor(_machineId) {
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    type() {
        return 'low-stock-warning';
    }
}
// Event triggered when stock level returns to normal
class StockLevelOkEvent {
    constructor(_machineId) {
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    type() {
        return 'stock-level-ok';
    }
}
class MachineSaleSubscriber {
    constructor(machines) {
        this.machines = machines;
    }
    handle(event) {
        const machine = this.machines.find(m => m.id === event.machineId());
        if (!machine) {
            console.log(`[ERROR] Machine ID: ${event.machineId()} not found.`);
            return;
        }
        if (machine.stock < event.getSoldQuantity()) {
            console.log(`[WARNING] Cannot sell ${event.getSoldQuantity()} items from Machine ${machine.id}. Not enough stock.`);
            return;
        }
        machine.stock -= event.getSoldQuantity();
        console.log(`[INFO] Machine ID: ${machine.id} stock decreased by ${event.getSoldQuantity()}. New stock: ${machine.stock}`);
    }
}
class MachineRefillSubscriber {
    constructor(machines) {
        this.machines = machines;
    }
    handle(event) {
        const machine = this.machines.find(m => m.id === event.machineId());
        if (machine) {
            machine.updateStock(event.getRefillQuantity());
            console.log(`[INFO] Machine ID: ${machine.id} stock increased by ${event.getRefillQuantity()}. New stock: ${machine.stock}`);
        }
    }
}
// Manages low stock warnings and resets them when stock normalizes
class StockWarningSubscriber {
    constructor(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    handle(event) {
        const machine = this.machines.find(m => m.id === event.machineId());
        if (!machine)
            return;
        // Check if stock is low (below 3)
        if (machine.isLowStock() && !machine.hasWarning()) {
            machine.toggleWarning(true);
            console.log(`[WARNING] LowStockWarningEvent: Machine ${machine.id} is low on stock.`);
            const warningEvent = new LowStockWarningEvent(machine.id);
            this.pubSubService.publish(warningEvent);
            // Refill stock when it's low
            machine.updateStock(3); // Replenish 3 items
            console.log(`[INFO] Stock replenished for Machine ID: ${machine.id}. New stock: ${machine.stock}`);
            // Notify that stock has returned to normal (when stock >= 3)
            if (machine.stock >= 3 && machine.hasWarning()) {
                machine.toggleWarning(false); // Disable warning
                const okEvent = new StockLevelOkEvent(machine.id);
                console.log(`[INFO] StockLevelOkEvent generated for Machine ID: ${machine.id}`);
                this.pubSubService.publish(okEvent);
            }
        }
        // Case when stock has returned to normal
        else if (machine.stock >= 3 && machine.hasWarning()) {
            machine.toggleWarning(false);
            const okEvent = new StockLevelOkEvent(machine.id);
            console.log(`[INFO] StockLevelOkEvent generated for Machine ID: ${machine.id}`);
            this.pubSubService.publish(okEvent);
        }
    }
}
// Publish-Subscribe Service to manage the publish/subscribe system
class PublishSubscribeService {
    constructor() {
        this.subscribers = {};
    }
    // Publish events to the subscribed handlers
    publish(event) {
        const eventType = event.type();
        const handlers = this.subscribers[eventType] || [];
        for (const handler of handlers) {
            handler.handle(event);
        }
    }
    // Subscribe to an event type
    subscribe(type, handler) {
        if (!this.subscribers[type]) {
            this.subscribers[type] = [];
        }
        this.subscribers[type].push(handler);
        console.log(`[INFO] ${handler.constructor.name} subscribed to ${type}`);
    }
    // Unsubscribe from an event type
    unsubscribe(type, handler) {
        if (!this.subscribers[type])
            return;
        this.subscribers[type] = this.subscribers[type].filter(sub => sub !== handler);
        console.log(`[INFO] ${handler.constructor.name} unsubscribed from ${type}`);
    }
}
// objects
class Machine {
    constructor(id, stock = 10) {
        this.id = id;
        this.warnedLowStock = false;
        this.stock = stock;
    }
    // Used to update stock
    updateStock(quantity) {
        if (this.stock + quantity < 0) {
            console.log(`[WARNING] Stock update for Machine ID: ${this.id} would result in negative stock. Operation canceled.`);
            return;
        }
        this.stock += quantity;
    }
    // Used to check if stock < 3
    isLowStock() {
        return this.stock < 3;
    }
    // Used to toggle low stock warning
    toggleWarning(flag) {
        this.warnedLowStock = flag;
    }
    hasWarning() {
        return this.warnedLowStock;
    }
}
// Helper functions
const randomMachine = () => {
    const machines = ['001', '002', '003'];
    const index = Math.floor(Math.random() * machines.length);
    return machines[index];
};
// Randomly generates a sale or refill event
const eventGenerator = () => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2;
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    const refillQty = Math.random() < 0.5 ? 3 : 5;
    return new MachineRefillEvent(refillQty, randomMachine());
};
// program
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Initialize machines
    const machines = [
        new Machine('001', 2),
        new Machine('002', 5),
        new Machine('003', 10)
    ];
    // Initialize PubSub service
    const pubSubService = new PublishSubscribeService();
    // Create subscribers
    const saleSubscriber = new MachineSaleSubscriber(machines);
    const refillSubscriber = new MachineRefillSubscriber(machines);
    const warningSubscriber = new StockWarningSubscriber(machines, pubSubService);
    // Subscribe to events
    pubSubService.subscribe('sale', saleSubscriber);
    pubSubService.subscribe('refill', refillSubscriber);
    pubSubService.subscribe('sale', warningSubscriber);
    pubSubService.subscribe('refill', warningSubscriber);
    // Simulate events
    const eventCount = 10; // Simulate 10 events
    for (let i = 0; i < eventCount; i++) {
        const event = eventGenerator();
        console.log(`[DEBUG] Publishing event: ${event.type()} for Machine ID: ${event.machineId()}`);
        pubSubService.publish(event);
    }
    console.log("[INFO] Finished processing events.");
}))();
