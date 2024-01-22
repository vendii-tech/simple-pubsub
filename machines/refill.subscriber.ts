import { ISubscriber, IEvent } from '../interfaces/index'
import { Machine } from './data';
import { MachineRefillEvent } from './refill.event';

export class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];
  
  constructor (machines: Machine[]) {
    this.machines = machines; 
  }  
  
  handle(event: MachineRefillEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    theMachine ? Atomics.add(theMachine.stockLevel, 0, event.getRefilledQuantity()) : undefined
  }
}