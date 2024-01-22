import { EventType } from '../enums/event.types';
import { IEvent } from '../interfaces/index'

export class MachineRefillEvent implements IEvent {
    constructor(private readonly _refill: number, private readonly _machineId: string) {}
  
    machineId(): string {
      return this._machineId;
    }

    getRefilledQuantity(): number {
      return this._refill
    }
  
    type(): string {
      return EventType.REFILL;
    }
  }
  