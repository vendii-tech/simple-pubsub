import { ISubscriber } from '../interfaces/subscriber'
import { IPublishSubscribeService } from '../interfaces/publish.subscribe.service'
import { Machine } from './data';
import { IMachineRefillEvent } from './refill.event';
import { MachineStockEvent } from './stock.event';

export class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[], private readonly pubSubService: IPublishSubscribeService) {
    this.machines = machines;
  }

  protected maxStock(stock: Uint16Array): number {
    return Math.pow(2, 8 * stock.BYTES_PER_ELEMENT)
  }
  
  handle(event: IMachineRefillEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    if (theMachine) {
    
      const current = Atomics.load(theMachine.stockLevel, 0)
      const limit = this.maxStock(theMachine.stockLevel)

      if ((current + event.getRefilledQuantity()) < limit) {
        Atomics.add(theMachine.stockLevel, 0, event.getRefilledQuantity())
      } 

      this.pubSubService.publish(new MachineStockEvent(theMachine.id));
    }
  }
}