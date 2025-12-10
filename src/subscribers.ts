
import { ISubscriber, IEvent, IPublishSubscribeService } from './types';
import { Machine } from './Machine';
import {
  MachineSaleEvent,
  MachineRefillEvent,
  LowStockWarningEvent,
  StockLevelOkEvent
} from './events';

const LOW_STOCK_THRESHOLD = 3;

export class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(
    machines: Machine[],
    private pubSub?: IPublishSubscribeService
  ) {
    this.machines = machines;
  }

  handle(event: IEvent): void {
    if (!(event instanceof MachineSaleEvent)) return;

    const machine = this.machines.find(m => m.id === event.machineId());
    if (!machine) return;

    const previousStock = machine.stockLevel;
    machine.stockLevel -= event.getSoldQuantity();

    console.log(
      `[SALE] Machine ${machine.id}: ${previousStock} -> ${machine.stockLevel}`
    );

    if (this.pubSub && 
        previousStock >= LOW_STOCK_THRESHOLD && 
        machine.stockLevel < LOW_STOCK_THRESHOLD && 
        !machine.isLowStock) {
      machine.isLowStock = true;
      this.pubSub.publish(new LowStockWarningEvent(machine.id!, machine.stockLevel));
    }
  }
}

export class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(
    machines: Machine[],
    private pubSub?: IPublishSubscribeService
  ) {
    this.machines = machines;
  }

  handle(event: IEvent): void {
    if (!(event instanceof MachineRefillEvent)) return;

    const machine = this.machines.find(m => m.id === event.machineId());
    if (!machine) return;

    const previousStock = machine.stockLevel;
    machine.stockLevel += event.getRefillQuantity();

    console.log(
      `[REFILL] Machine ${machine.id}: ${previousStock} -> ${machine.stockLevel}`
    );

    if (this.pubSub && 
        previousStock < LOW_STOCK_THRESHOLD && 
        machine.stockLevel >= LOW_STOCK_THRESHOLD && 
        machine.isLowStock) {
      machine.isLowStock = false;
      this.pubSub.publish(new StockLevelOkEvent(machine.id!, machine.stockLevel));
    }
  }
}

export class StockWarningSubscriber implements ISubscriber {
  handle(event: IEvent): void {
    if (event instanceof LowStockWarningEvent) {
      console.log(`⚠️  [LOW STOCK] Machine ${event.machineId()}`);
    } else if (event instanceof StockLevelOkEvent) {
      console.log(`✓ [STOCK OK] Machine ${event.machineId()}`);
    }
  }
}