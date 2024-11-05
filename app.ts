// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): void;
}
enum eventType {
  SALE="SALE",
  REFILL="REFILL",
  LOWSTOCK="LOWSTOCK",
  STOCKLEVELOK="STOCKLEVELOK"
}
const LowStockThreshold = 3;
interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  unsubscribe (type: string, handler : ISubscriber): void;
}
class PublishSubscribeSingleton {
  static instance: PublishSubscribeService;
  private constructor() { }

  public static getInstance(): PublishSubscribeService {
    if (!PublishSubscribeSingleton.instance) {
      PublishSubscribeSingleton.instance = new PublishSubscribeService();
    }
    return this.instance

  }
}
class PublishSubscribeService implements IPublishSubscribeService {
  private subscribers : {type: string, handler: ISubscriber}[] = [];
  publish(event: IEvent) {
     this.subscribers.filter((subscriber) => {
      if (subscriber.type === event.type()) {
        return true
      }
    }).map((subscriber) => {
      subscriber.handler.handle(event);
    })
  }
  subscribe(type: string, handler: ISubscriber) {
    this.subscribers.push({type, handler});
  }
  unsubscribe(type: string, handler: ISubscriber) {
    this.subscribers.filter((subscriber) => {
      if (subscriber.type !== type && subscriber.handler !== handler) {
          return true
      }
    }).map((subscriber) => {})
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
    return eventType.SALE;
  }
}

class MachineRefillEvent implements IEvent {
  constructor(private readonly _refill: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }
  refillQuantity(): number {
    return this._refill
  }
  type(): string {
    return eventType.REFILL;
  }
}
class LowStockWarningEvent  implements IEvent {
  constructor(private readonly _lowStockQty: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }
  type(): string {
    return eventType.LOWSTOCK;
  }
}
class StockLevelOkEvent  implements IEvent {
  constructor(private readonly _stockQty: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }
  type(): string {
    return eventType.STOCKLEVELOK;
  }
}

class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor () {
    this.machines = MachineSingleton.getInstance();
  }

  handle(event: MachineSaleEvent): void {
    console.log( "event sale",JSON.stringify(event),);
    const machine = this.machines.find((machine) => machine.id === event.machineId())
    const soldQuantity = event.getSoldQuantity()
    if (machine) {
      console.log("machine before decrease",JSON.stringify(machine));

      machine.stockLevel -= soldQuantity;
      console.log("machine after decrease",JSON.stringify(machine));

    }
    if (machine && machine.stockLevel < LowStockThreshold){
      console.log("machine after decrease",JSON.stringify(machine));
      PublishSubscribeSingleton.getInstance().publish(new LowStockWarningEvent(machine.stockLevel, machine.id))
    }
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor () {
    this.machines = MachineSingleton.getInstance();
  }

  handle(event: MachineRefillEvent): void {
    console.log( "event refill",JSON.stringify(event),);

    const machine = this.machines.find((machine) => machine.id === event.machineId())
    const refillQuantity = event.refillQuantity();
    if (machine) {
      console.log("machine before increase",JSON.stringify(machine));

      machine.stockLevel +=refillQuantity;
      console.log("machine after increase",JSON.stringify(machine));

    }else{
      console.log("Not Found Machine")
    }
  }
}
class LowStockWarningSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor () {
    this.machines = MachineSingleton.getInstance();
  }

  handle(event: LowStockWarningEvent): void {
    console.log( "event low stock warning",JSON.stringify(event),);

  }
}
class StockOkSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor () {
    this.machines = MachineSingleton.getInstance();
  }

  handle(event: StockLevelOkEvent): void {
    console.log( "event stock ok",JSON.stringify(event),);
    const machine = this.machines.find((machine) => machine.id === event.machineId())
    if (machine && machine.stockLevel >=LowStockThreshold){
      PublishSubscribeSingleton.getInstance().publish(new StockLevelOkEvent(machine.stockLevel, machine.id))
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

class MachineSingleton {
  private static instance: Machine[];
  private constructor() { }

  public static getInstance(): Machine[] {
    if (!MachineSingleton.instance) {
      this.instance= [ new Machine('001'), new Machine('002'), new Machine('003') ];
    }
    return this.instance

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
(async () => {
  // create 3 machines with a quantity of 10 stock

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber();
  const refillSubscriber = new MachineRefillSubscriber();
  const lowStockWarningSubscriber = new LowStockWarningSubscriber();
  const stockOkSubscriber = new StockOkSubscriber();
  // create the PubSub service
  const pubSubService = PublishSubscribeSingleton.getInstance();
  pubSubService.subscribe(eventType.SALE,saleSubscriber)
  pubSubService.subscribe(eventType.REFILL,refillSubscriber)
  pubSubService.subscribe(eventType.LOWSTOCK,lowStockWarningSubscriber)
  pubSubService.subscribe(eventType.STOCKLEVELOK,stockOkSubscriber)


  // create 5 random events
  const events = [...Array(10)].map(i => eventGenerator());

  // publish the events
  events.map((event)=>{
    pubSubService.publish(event)
  })
})();
