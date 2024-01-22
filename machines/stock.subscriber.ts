import { ISubscriber } from '../interfaces/subscriber'
import { Machine } from '../machines/data'
import { IMachineStockEvent } from './stock.event'

export class MachineStockSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  protected isTooLow(stock: Uint16Array): boolean {
    return Atomics.load(stock, 0) < 3
  }

  handle(event: IMachineStockEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    if (theMachine) {
      
      if (this.isTooLow(theMachine.stockLevel)) {
        console.log(theMachine.id, ' has low stock level')
      } else {
        console.log(theMachine.id, ' has ok stock level')
      }
    }
  }
}