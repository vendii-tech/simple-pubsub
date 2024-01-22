import { ISubscriber } from '../interfaces/subscriber'
import { Machine } from '../machines/data'
import { MachineSaleEvent } from '../machines/sale.event'

export class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: MachineSaleEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    theMachine ? Atomics.sub(theMachine.stockLevel, 0, event.getSoldQuantity()) : undefined
  }
}
  