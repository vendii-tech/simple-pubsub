import { IPublishSubscribeService } from '../interfaces';
import { ISubscriber } from '../interfaces/subscriber'
import { Machine } from '../machines/data'
import { MachineSaleEvent } from '../machines/sale.event'
import { MachineStockEvent } from './stock.event';

export class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[], private readonly pubSubService: IPublishSubscribeService) {
    this.machines = machines; 
  }

  handle(event: MachineSaleEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    
    if (theMachine) {
      Atomics.sub(theMachine.stockLevel, 0, event.getSoldQuantity())
      
      this.pubSubService.publish(new MachineStockEvent(theMachine.id))
    }
  }
}
  