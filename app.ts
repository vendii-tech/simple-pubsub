// enums

enum MachineEventType {
  SALE = "sale",
  REFILL = "refill",
}

// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface IBaseSubscriber {
  getMachine(id: string): Machine | undefined;
}
interface ISubscriber {
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish(event: IEvent): void;
  subscribe(type: string, handler: ISubscriber): void;
  unsubscribe(type: string, handler: ISubscriber): void;
}

// implementations
class MachineSaleEvent implements IEvent {
  constructor(
    private readonly _sold: number,
    private readonly _machineId: string
  ) {}

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold;
  }

  type(): string {
    return MachineEventType.SALE;
  }
}

class MachineRefillEvent implements IEvent {
  constructor(
    private readonly _refill: number,
    private readonly _machineId: string
  ) {}

  machineId(): string {
    return this._machineId;
  }

  getRefillQuantity(): number {
    return this._refill;
  }

  type(): string {
    return MachineEventType.REFILL;
  }
}

class BaseSubscriber implements IBaseSubscriber {
  protected machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  getMachine(id: string): Machine | undefined {
    return this.machines.find((m) => m.id === id);
  }
}

class MachineSaleSubscriber extends BaseSubscriber implements ISubscriber {
  constructor(machines: Machine[]) {
    super(machines);
  }
  handle(event: MachineSaleEvent): void {
    const machine = this.getMachine(event.machineId());
    logMachine("before", machine);

    if (machine) {
      if (machine.stockLevel < event.getSoldQuantity()) {
        console.error(
          `Machine ${machine?.id} stock level less than sold quantity`
        );
        return;
      }
      machine.stockLevel -= event.getSoldQuantity();
    }
    logMachine("after", machine);
  }
}

class MachineRefillSubscriber extends BaseSubscriber implements ISubscriber {
  constructor(machines: Machine[]) {
    super(machines);
  }
  handle(event: MachineRefillEvent): void {
    const machine = this.getMachine(event.machineId());
    logMachine("before", machine);
    if (machine) machine.stockLevel += event.getRefillQuantity();
    logMachine("after", machine);
  }
}

class PublishSubscribeService implements IPublishSubscribeService {
  private _subscribers: Map<string, ISubscriber[]> = new Map();

  publish(event: IEvent): void {
    const subscribers = this._subscribers.get(event.type()) || [];
    subscribers.map((s) => s.handle(event));
  }

  subscribe(type: string, handler: ISubscriber): void {
    const handlers = this._subscribers.get(type) || [];
    handlers.push(handler);
    this._subscribers.set(type, handlers);
  }

  unsubscribe(type: string, handler: ISubscriber): void {
    let subscribers = this._subscribers.get(type) || [];
    subscribers = subscribers.filter((h) => h !== handler);
    this._subscribers.set(type, subscribers);
  }
}

// objects
class Machine {
  public stockLevel = 10;
  public id: string;

  constructor(id: string) {
    this.id = id;
  }
}

// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return "001";
  } else if (random < 2) {
    return "002";
  }
  return "003";
};

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 10 : 20; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  }
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
};

const logEvent = (events: IEvent[]) => {
  events.forEach((event) => {
    console.log(event);
  });
};

const logMachine = (prefix: string, machine?: Machine) => {
  console.log(prefix, machine);
};

// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [
    new Machine("001"),
    new Machine("002"),
    new Machine("003"),
  ];

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines);
  const refillSubscriber = new MachineRefillSubscriber(machines);

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService();

  pubSubService.subscribe(MachineEventType.SALE, saleSubscriber);
  pubSubService.subscribe(MachineEventType.REFILL, refillSubscriber);

  // create 5 random events
  const events = [1, 2, 3, 4, 5].map((i) => eventGenerator());
  logEvent(events);
  // publish the events
  events.forEach((e) => pubSubService.publish(e));
})();
