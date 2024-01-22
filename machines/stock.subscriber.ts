import { ISubscriber } from '../interfaces/subscriber'
import { Machine } from '../machines/data'
import { MachineStockEvent } from './stock.event'

export class MachineStockSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }

  handle(event: MachineStockEvent): void {
    const theMachine = this.machines.find((machine) => machine.id === event.machineId())
    if (theMachine && theMachine.stockLevel[0] < 3) {
      console.log(theMachine.id, ' has low stock level')
    } else if(theMachine && theMachine.stockLevel[0] >= 3 ) {
      console.log(theMachine.id, ' has ok stock level')
    }
  }
}