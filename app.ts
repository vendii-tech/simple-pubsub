// const
const LEVEL_STOCK_THRESHOLD = 3;
// enums
enum MachineEventType {
  SALE = "sale",
  REFILL = "refill",
  LOW_STOCK_WARNING = "low_stock_warning",
  STOCK_LEVEL_OK = "stock_level_ok",
}

// interfaces

interface IEvent {
  machineId(): string;
  type(): string;
}

interface ISubscriber {
  getMachine(id: string): Maybe<Machine>;
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish(event: IEvent): void;
  subscribe(type: string, handler: ISubscriber): void;
  unsubscribe(type: string, handler: ISubscriber): void;
}

interface Repository<T> {
  create(args: T): void;
  findById(id: string): Maybe<Machine>;
  findAll(): T[];
  remove(id: string): void;
  update(args: T): void;
}

// implementations

abstract class BaseEvent implements IEvent {
  readonly _machineId: string;
  constructor(_machineId: string) {
    this._machineId = _machineId;
  }

  machineId(): string {
    return this._machineId;
  }

  abstract type(): string;
}
class MachineSaleEvent extends BaseEvent {
  constructor(private readonly _sold: number, _machineId: string) {
    super(_machineId);
  }

  getSoldQuantity(): number {
    return this._sold;
  }

  type(): string {
    return MachineEventType.SALE;
  }
}

class MachineRefillEvent extends BaseEvent {
  constructor(private readonly _refill: number, _machineId: string) {
    super(_machineId);
  }

  getRefillQuantity(): number {
    return this._refill;
  }

  type(): string {
    return MachineEventType.REFILL;
  }
}

class MachineLowStockWarningEvent extends BaseEvent {
  constructor(_machineId: string) {
    super(_machineId);
  }

  type(): string {
    return MachineEventType.LOW_STOCK_WARNING;
  }
}

class MachineStockLevelOkEvent extends BaseEvent {
  constructor(_machineId: string) {
    super(_machineId);
  }

  type(): string {
    return MachineEventType.STOCK_LEVEL_OK;
  }
}

abstract class BaseSubscriber implements ISubscriber {
  private _machineRepository: MachineRepository;
  constructor(machineRepository: MachineRepository) {
    this._machineRepository = machineRepository;
  }

  getMachine(id: string): Maybe<Machine> {
    return this._machineRepository.findById(id);
  }

  abstract handle(event: IEvent): void;
}

class MachineSaleSubscriber extends BaseSubscriber {
  constructor(machineRepository: MachineRepository) {
    super(machineRepository);
  }
  handle(event: MachineSaleEvent): void {
    const machineMaybe = this.getMachine(event.machineId());

    machineMaybe.map((machine) => {
      if (machine.stockLevel < event.getSoldQuantity()) {
        console.error(
          `Machine ${machine?.id} stock level is less than quantity sold`
        );
        return;
      }
      machine.stockLevel -= event.getSoldQuantity();
      if (machine.stockLevel < LEVEL_STOCK_THRESHOLD) {
        const pubSubService: IPublishSubscribeService =
          PublishSubscribeServiceSingleton.getInstance();
        pubSubService.publish(new MachineLowStockWarningEvent(machine.id));
      }
    });
  }
}

class MachineRefillSubscriber extends BaseSubscriber {
  constructor(machineRepository: MachineRepository) {
    super(machineRepository);
  }

  handle(event: MachineRefillEvent): void {
    const machineMaybe = this.getMachine(event.machineId());
    machineMaybe.map((machine) => {
      const wasBelowThreshold = machine.stockLevel < LEVEL_STOCK_THRESHOLD;
      machine.stockLevel += event.getRefillQuantity();
      if (wasBelowThreshold && machine.stockLevel >= LEVEL_STOCK_THRESHOLD) {
        const pubSubService: IPublishSubscribeService =
          PublishSubscribeServiceSingleton.getInstance();
        pubSubService.publish(new MachineStockLevelOkEvent(machine.id));
      }
    });
  }
}

class MachineLowStockWarningSubscriber extends BaseSubscriber {
  constructor(machineRepository: MachineRepository) {
    super(machineRepository);
  }
  handle(event: MachineLowStockWarningEvent): void {
    const mayBeMachine = this.getMachine(event.machineId());
    mayBeMachine.map((machine) => {
      console.warn(
        `Machine ${machine.id} have lower stock level (${machine.stockLevel})`
      );
    });
  }
}

class MachineStockLevelOkSubscriber extends BaseSubscriber {
  constructor(machineRepository: MachineRepository) {
    super(machineRepository);
  }

  handle(event: MachineLowStockWarningEvent): void {
    const mayBeMachine = this.getMachine(event.machineId());

    mayBeMachine.map((machine) => {
      console.info(
        `Machine ${machine.id} have stock level ok (${machine.stockLevel})`
      );
    });
  }
}

class PublishSubscribeServiceSingleton implements IPublishSubscribeService {
  private static _instance: PublishSubscribeServiceSingleton;
  private _subscribers: Map<string, ISubscriber[]> = new Map();

  static getInstance() {
    return (
      this._instance ||
      (this._instance = new PublishSubscribeServiceSingleton())
    );
  }

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

class MachineRepository implements Repository<Machine> {
  private _machines: Map<string, Machine> = new Map();
  create(machine: Machine) {
    if (this._machines.get(machine.id))
      throw new Error(`Machine ${machine.id} is already created`);
    this._machines.set(machine.id, machine);
  }
  findById(id: string): Maybe<Machine> {
    const machine = this._machines.get(id);
    return machine ? Maybe.some(machine) : Maybe.none();
  }

  findAll(): Machine[] {
    return Array.from(this._machines.values());
  }
  remove(id: string): void {
    if (!this._machines.get(id)) throw new Error(`Machine ${id} is not found`);
    this._machines.delete(id);
  }
  update(machine: Machine): void {
    if (!this._machines.get(machine.id))
      throw new Error(`Machine ${machine.id} is not found`);
    this._machines.set(machine.id, machine);
  }
}

class Maybe<T> {
  private constructor(private readonly value: T | null) {}

  static some<T>(value: T): Maybe<T> {
    return new Maybe(value);
  }

  static none<T>(): Maybe<T> {
    return new Maybe<T>(null);
  }

  isSome(): boolean {
    return this.value !== null;
  }

  isNone(): boolean {
    return this.value === null;
  }

  map<U>(fn: (value: T) => U): Maybe<U> {
    if (this.value === null) {
      return Maybe.none<U>();
    }
    return Maybe.some(fn(this.value));
  }
}

// objects
class Machine {
  private _stockLevel = 10;

  constructor(private readonly _id: string) {
    this._id = _id;
  }

  get id(): string {
    return this._id;
  }

  get stockLevel(): number {
    return this._stockLevel;
  }

  set stockLevel(stockLevel) {
    this._stockLevel = stockLevel;
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
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  }
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
};

const logMachine = (prefix: string, machine: Machine) => {
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

  const machineRepository = new MachineRepository();
  machines.forEach((m) => machineRepository.create(m));

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machineRepository);
  const refillSubscriber = new MachineRefillSubscriber(machineRepository);
  const lowStockWarningSubscriber = new MachineLowStockWarningSubscriber(
    machineRepository
  );
  const stockLevelOkSubscriber = new MachineStockLevelOkSubscriber(
    machineRepository
  );

  // create the PubSub service
  const pubSubService: IPublishSubscribeService =
    PublishSubscribeServiceSingleton.getInstance();

  pubSubService.subscribe(MachineEventType.SALE, saleSubscriber);
  pubSubService.subscribe(MachineEventType.REFILL, refillSubscriber);
  pubSubService.subscribe(
    MachineEventType.LOW_STOCK_WARNING,
    lowStockWarningSubscriber
  );
  pubSubService.subscribe(
    MachineEventType.STOCK_LEVEL_OK,
    stockLevelOkSubscriber
  );

  // create 5 random events
  const events = [1, 2, 3, 4, 5].map((i) => eventGenerator());

  // publish the events
  events.forEach((e) => pubSubService.publish(e));
})();
