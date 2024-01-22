import { IEvent } from '../interfaces/event'
import { EventType } from '../enums/event.types'

// implementations
export class MachineSaleEvent implements IEvent {
    constructor(private readonly _sold: number, private readonly _machineId: string) {}
  
    machineId(): string {
      return this._machineId;
    }
  
    getSoldQuantity(): number {
      return this._sold
    }
  
    type(): string {
      return EventType.SALE;
    }
  }

export interface IMachineSaleEvent extends MachineSaleEvent {}