import { ISubscriber, IEvent, IPublishSubscribeService } from '../interfaces/index'
import { Machine } from './data';
import { MachineRefillEvent } from './refill.event';
import { MachineStockEvent } from './stock.event';

export class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[], private readonly pubSubService: IPublishSubscribeService) {
    this.machines = machines;
  }  
  
  handle(event: MachineRefillEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    if (theMachine?.id) {
      Atomics.add(theMachine.stockLevel, 0, event.getRefilledQuantity())
      
      this.pubSubService.publish(new MachineStockEvent(theMachine.id));
    }
  }
}