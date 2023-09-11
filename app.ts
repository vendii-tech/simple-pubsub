// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): void;
}

interface IUnsubscriber {
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  unsubscribe (type: string, handler: IUnsubscriber): void;
}

class PublishSubscribeService implements IPublishSubscribeService {
  private event: IEvent;

  publish(_event: IEvent) {
    this.event = _event
  }

  subscribe(_type: string, _handler: ISubscriber) {
    _handler.handle(this.event);
  }

  unsubscribe(_type: string, _handler: IUnsubscriber) {
    _handler.handle(this.event);
  }
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

   getRefillQuantity(): number {
    return this._refill
  }

  type(): string {
    return 'refill';
  }
}

class LowStockWarningEvent implements IEvent {
  constructor(private readonly _remain: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  getRemainQuantity(): number {
    return this._remain
  }

  generateMessage(): string {
    return `low stock! remain quantity: ${this.getRemainQuantity()}`
  }

  type(): string {
    return 'lowstock';
  }
}

class StockLevelOkEvent implements IEvent {
  constructor(private readonly _remain: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

   getRemainQuantity(): number {
    return this._remain
  }

  generateMessage(): string {
    return `stock ok! remain quantity: ${this.getRemainQuantity()}`
  }

  type(): string {
    return 'ok';
  }
}

class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: MachineSaleEvent): void {
    this.machines[2].stockLevel -= event.getSoldQuantity();
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: MachineRefillEvent): void {
    this.machines[2].stockLevel += event.getRefillQuantity();
  }
}

class  MachineLowStockWarningSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: LowStockWarningEvent): void {
    if(this.machines[2].stockLevel < 3) {
      event.generateMessage();
    }
  }
}

class  MachineStockLevelOkSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: StockLevelOkEvent): void {
    if(this.machines[2].stockLevel >= 3) {
      event.generateMessage();
    }
  }
}

// objects
class Machine {
  public stockLevel = 10;
  public id: string;

  constructor (id: string) {
    this.id = id;
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
  const random = Math.floor(Math.random() * 4);

  switch (random) {
    case 1: {
      const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
      return new MachineSaleEvent(saleQty, randomMachine());
    }
    case 2: {
      const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
      return new MachineRefillEvent(refillQty, randomMachine());
    }
    case 3: {
      return new LowStockWarningEvent(2, randomMachine());
    }
    case 4: {
      return new StockLevelOkEvent(5, randomMachine());
    }
    default:
      return new MachineRefillEvent(1, randomMachine());
  }

  // if (random < 0.5) {
  //   const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
  //   return new MachineSaleEvent(saleQty, randomMachine());
  // } 


  // const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  // return new MachineRefillEvent(refillQty, randomMachine());
}


// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [ new Machine('001'), new Machine('002'), new Machine('003') ];

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines);

  const refillSubscriber = new MachineRefillSubscriber(machines);

  const lowstockSubscriber = new MachineLowStockWarningSubscriber(machines);

  const stockokSubscriber = new MachineStockLevelOkSubscriber(machines);

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService();

  // create 5 random events
  const events = [1,2,3,4,5].map(i => eventGenerator());

  // publish the events
  events.map(pubSubService.publish);
})();
