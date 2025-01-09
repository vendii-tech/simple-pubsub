// interfaces

// Represents an event with a type and a machine ID
interface IEvent {
  type(): string;
  machineId(): string;
}

// Defines the structure for event subscribers
interface ISubscriber {
  handle(event: IEvent): void;
}

// Provides methods for managing publish/subscribe behavior
interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  unsubscribe(type: string, handler: ISubscriber): void;
}

// implementations

// Events happen when a sale is made.
class MachineSaleEvent implements IEvent {
  constructor(private readonly _sold: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold
  }

  type(): string {
    return 'sale';
  }
}

// Event triggered when a refill occurs
class MachineRefillEvent implements IEvent {
  constructor(private readonly _refill: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  getRefillQuantity(): number {
    return this._refill;
  }

  type(): string {
    return 'refill';
  }
}

// Event triggered when stock is low
class LowStockWarningEvent implements IEvent {
  constructor(private readonly _machineId: string) {}
  machineId(): string {
    return this._machineId;
  }
  type(): string {
    return 'low-stock-warning';
  }
}

// Event triggered when stock level returns to normal
class StockLevelOkEvent implements IEvent {
  constructor(private readonly _machineId: string) {}
  machineId(): string {
    return this._machineId;
  }
  type(): string {
    return 'stock-level-ok';
  }
}

// Handles sale events by reducing stock
class MachineSaleSubscriber implements ISubscriber {
  constructor(private machines: Machine[]) {}

  // Handles refill events by increasing stock
  handle(event: MachineSaleEvent): void {
    const machine = this.machines.find(m => m.id === event.machineId());
    if (machine) {
      if (machine.stock >= event.getSoldQuantity()) {
        machine.stock -= event.getSoldQuantity();
        console.log(`[INFO] Machine ID: ${machine.id} stock decreased by ${event.getSoldQuantity()}. New stock: ${machine.stock}`);
      } else {
        console.log(`[WARNING] Cannot sell ${event.getSoldQuantity()} items from Machine ${machine.id}. Not enough stock.`);
      }
    }
  }
}

// MachineRefillSubscriber: Add stock and generate StockLevelOkEvent if needed
class MachineRefillSubscriber implements ISubscriber {
  pubSubService: any;
  constructor(private machines: Machine[]) {}

  handle(event: MachineRefillEvent): void {
    const machine = this.machines.find(m => m.id === event.machineId());
    if (machine) {
      machine.updateStock(event.getRefillQuantity());
      console.log(`[INFO] Machine ID: ${machine.id} stock increased by ${event.getRefillQuantity()}. New stock: ${machine.stock}`);

      // Generate StockLevelOkEvent if stock is now >= 3 and warning was active
      if (machine.stock >= 3 && machine.hasWarning()) {
        machine.toggleWarning(false); // Reset warning
        const okEvent = new StockLevelOkEvent(machine.id);
        this.pubSubService.publish(okEvent);
      }
    }
  }
}

// Manages low stock warnings and resets them when stock normalizes
class StockWarningSubscriber implements ISubscriber {
  constructor(private machines: Machine[], private pubSubService: IPublishSubscribeService) {}

  handle(event: IEvent): void {
    const machine = this.machines.find(m => m.id === event.machineId());
    if (!machine) return;

    if (machine.isLowStock() && !machine.hasWarning()) {
      // Generate LowStockWarningEvent
      machine.toggleWarning(true);
      console.log(`[WARNING] LowStockWarningEvent: Machine ${machine.id} is low on stock.`);
      const warningEvent = new LowStockWarningEvent(machine.id);
      this.pubSubService.publish(warningEvent);
    }
  }
}

// Publish-Subscribe Service to manage the publish/subscribe system
class PublishSubscribeService implements IPublishSubscribeService {
  private subscribers: { [key: string]: ISubscriber[] } = {};
  private eventQueue: IEvent[] = []; // Queue to manage event order

  // Publish events to the subscribed handlers
  publish(event: IEvent): void {
    console.log(`[DEBUG] Publishing event: ${event.type()} for Machine ID: ${event.machineId()}`);
    this.eventQueue.push(event);

    // Process events one at a time from the queue
    while (this.eventQueue.length > 0) {
      const currentEvent = this.eventQueue.shift()!;
      const eventType = currentEvent.type();
      const handlers = this.subscribers[eventType] || [];
      for (const handler of handlers) {
        handler.handle(currentEvent);
      }
    }
  }

  // Subscribe to an event type
  subscribe(type: string, handler: ISubscriber): void {
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push(handler);
    console.log(`[INFO] ${handler.constructor.name} subscribed to ${type}`);
  }

  // Unsubscribe from an event type
  unsubscribe(type: string, handler: ISubscriber): void {
    if (!this.subscribers[type]) return;
    this.subscribers[type] = this.subscribers[type].filter(sub => sub !== handler);
    console.log(`[INFO] ${handler.constructor.name} unsubscribed from ${type}`);
  }
}

// objects
class Machine {
  public stock: number;
  private warnedLowStock: boolean = false;

  constructor (public id: string, stock: number = 10) {
    this.stock = stock;
  }
    // Used to update stock
    updateStock(quantity: number): void {
      if (this.stock + quantity < 0) {
        console.log(`[WARNING] Stock update for Machine ID: ${this.id} would result in negative stock. Operation canceled.`);
        return;
      }
      this.stock += quantity;
    }
  
    // Used to check if stock < 3
    isLowStock(): boolean {
      return this.stock < 3;
    }
  
    // Used to toggle low stock warning
    toggleWarning(flag: boolean): void {
      this.warnedLowStock = flag;
    }
  
    hasWarning(): boolean {
      return this.warnedLowStock;
    }
  }

// Helper functions
const randomMachine = (): string => {
  const machines = ['001', '002', '003'];
  const index = Math.floor(Math.random() * machines.length);
  return machines[index];
};

// Randomly generates a sale or refill event
const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2;
    return new MachineSaleEvent(saleQty, randomMachine());
  }
  const refillQty = Math.random() < 0.5 ? 3 : 5;
  return new MachineRefillEvent(refillQty, randomMachine());
};

// Main Program
(async () => {
  // Initialize machines
  const machines: Machine[] = [
    new Machine('001',2),
    new Machine('002',5),
    new Machine('003',10)
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
  const eventCount = 5;  // Set to simulate a total of 5 events
  const events: IEvent[] = []; // Store the events that are created

  // Randomly generate MachineSaleEvent or MachineRefillEvent and add them to the events array
  for (let i = 0; i < eventCount; i++) {
    const event = eventGenerator();
    events.push(event);
  }

  // Publish events
  events.forEach(event => pubSubService.publish(event));

  // Unsubscribe
  pubSubService.unsubscribe('sale', warningSubscriber);
  pubSubService.unsubscribe('refill', warningSubscriber);

  console.log("Finished processing events.");
})();