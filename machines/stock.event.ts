import { EventType } from '../enums/event.types';
import { IEvent } from '../interfaces/index'

export class MachineStockEvent implements IEvent {
    constructor(private readonly _machineId: string) {}
  
    machineId(): string {
      return this._machineId;
    }
  
    type(): string {
      return EventType.STOCK;
    }
  }
  