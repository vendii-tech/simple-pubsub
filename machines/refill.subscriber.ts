import { ISubscriber, IEvent } from '../interfaces/index'

export class MachineRefillSubscriber implements ISubscriber {
    handle(event: IEvent): void {
      throw new Error("Method not implemented.");
    }
  }
  
  