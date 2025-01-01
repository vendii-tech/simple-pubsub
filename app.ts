// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent,subscribeService: IPublishSubscribeService): void;
}

interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  unsubscribe (type: string): void;
}


// implementations
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

class MachineRefillEvent implements IEvent {
  constructor(private readonly _refill: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return 'buy'
  }

  getStockQuantity(): number {
    return this._refill;
  }
}

class LowStockWarningEvent implements IEvent {
  constructor(private readonly _current: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return "lowStockWarning";
  }

  getMessage(): string {
    return "[Low] Current stock of machine " + this._machineId + " has " + this._current;
  }

}

class StockLevelOkEvent implements IEvent {
  constructor(private readonly _current: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return "stockLevelOkEvent";
  }

  getMessage(): string {
    return "[Ok] Current stock of machine " + this._machineId + " has " + this._current;
  }

}
class MachineSaleSubscriber implements ISubscriber {
  // Set mapping machine with id, to index machines
  public machines: Map<string, Machine> = new Map<string, Machine>();

  constructor (machines: Machine[]) {
    machines.forEach(machine => {
      this.machines.set(machine.id, machine);
    });
  }

  handle(event: MachineSaleEvent,service: IPublishSubscribeService): void {
    this.machines.get(event.machineId()).stockLevel -= event.getSoldQuantity();
    // Check machine's stock level and under stock threshold state
    if (this.machines.get(event.machineId()).stockLevel < 3 && !this.machines.get(event.machineId()).getIsLowerThanThree()) {
      // Save the machine to be under threshold state
      this.machines.get(event.machineId()).setIsLowerThanThree(true);
      // Publish LowStockWarningEvent
      service.publish(new LowStockWarningEvent(this.machines.get(event.machineId()).stockLevel, event.machineId()));
    }
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Map<string, Machine> = new Map<string, Machine>();

  constructor (machines: Machine[]) {
    machines.forEach(machine => {
      this.machines.set(machine.id, machine);
    });
  }

  handle(event: MachineRefillEvent,service: IPublishSubscribeService): void {
    this.machines.get(event.machineId()).stockLevel += event.getStockQuantity();
    // Check machine's stock level and stock state
    if (this.machines.get(event.machineId()).stockLevel >= 3 && this.machines.get(event.machineId()).getIsLowerThanThree()) {
      // Save the machine to be on above threshold state
      this.machines.get(event.machineId()).setIsLowerThanThree(false);
      // Publish StockLevelOkEvent
      service.publish(new StockLevelOkEvent(this.machines.get(event.machineId()).stockLevel, event.machineId()));
    }
  }
}

class StockWarningSubscriber implements ISubscriber {
  handle(event: LowStockWarningEvent | StockLevelOkEvent, service: IPublishSubscribeService): void {
    console.log(event.getMessage());
  }
}
// Initiate IPublishSubscribeService as an IService class
class IService implements IPublishSubscribeService {
  public subHandlers: Map<string, ISubscriber> = new Map<string, ISubscriber>();

  publish(event: IEvent): void {
    // Handle an event based on event type to specific subscriber
    if (this.subHandlers.has(event.type())){
      this.subHandlers.get(event.type()).handle(event, this);
    }
  }
  // Set subscribe in subHandlers mapping based on event type
  subscribe(type: string, handler: ISubscriber): void {
    this.subHandlers.set(type, handler);
  }
  // Remove a subscribe by type
  unsubscribe(type: string): void {
    this.subHandlers.delete(type);
  }

}
// objects
class Machine {
  public stockLevel = 10;
  public id: string;
  private isLowerThanThree: boolean = false;
  constructor (id: string) {
    this.id = id;
  }
  setIsLowerThanThree = (isLowerThanThree: boolean) => {
    this.isLowerThanThree = isLowerThanThree;
  }
  getIsLowerThanThree() {
    return this.isLowerThanThree;
  }
}


// helpers
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


// program
// @ts-ignore
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [ new Machine('001'), new Machine('002'), new Machine('003') ];

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines);
  const buySubscriber = new MachineRefillSubscriber(machines);
  // create a warning events subscriber
  const warningSubscriber = new StockWarningSubscriber();

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new IService(); // implement and fix this
  pubSubService.subscribe('sale',saleSubscriber);
  // Add MachineRefillSubscriber
  pubSubService.subscribe('buy',buySubscriber);
  // Add StockWarningSubscriber for stockLevelOkEvent
  pubSubService.subscribe('stockLevelOkEvent',warningSubscriber);
  // Add StockWarningSubscriber for lowStockWarning
  pubSubService.subscribe('lowStockWarning',warningSubscriber);


  // create more to 22 random events
  const events = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(i => eventGenerator());

  // publish the events
  events.map(event => pubSubService.publish(event));
})();
