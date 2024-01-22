import { IEvent } from '../interfaces/index'

export class MachineRefillEvent implements IEvent {
    constructor(private readonly _refill: number, private readonly _machineId: string) {}
  
    machineId(): string {
      throw new Error("Method not implemented.");
    }
  
    type(): string {
      throw new Error("Method not implemented.");
    }
  }
  