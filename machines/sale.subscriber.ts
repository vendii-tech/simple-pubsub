import { IPublishSubscribeService } from '../interfaces/publish.subscribe.service';
import { ISubscriber } from '../interfaces/subscriber'
import { Machine } from '../machines/data'
import { IMachineSaleEvent } from '../machines/sale.event'
import { MachineStockEvent } from './stock.event';

export class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[], private readonly pubSubService: IPublishSubscribeService) {
    this.machines = machines; 
  }

  handle(event: IMachineSaleEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())

    if (theMachine) {
    
      const current = Atomics.load(theMachine.stockLevel, 0)
      const limit = 0
      if ((current - event.getSoldQuantity()) > limit) {
        Atomics.sub(theMachine.stockLevel, 0, event.getSoldQuantity())
      } 

      this.pubSubService.publish(new MachineStockEvent(theMachine.id));
    }
  }
}
  