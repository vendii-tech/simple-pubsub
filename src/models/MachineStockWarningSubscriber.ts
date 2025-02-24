import { ISubscriber } from '../interfaces/ISubscriber';
import { MachineLowStockLevelEvent } from './MachineLowStockLevelEvent';
import { MachineOkStockLevelEvent } from './MachineOkStockLevelEvent'
import { Machine } from './Machine';
import { StockEventType } from '../constants';

class MachineStockWarningSubscriber implements ISubscriber {
    public machines: Machine[];

    constructor(machines: Machine[]) {
        this.machines = machines;
    }

    handle(event: MachineLowStockLevelEvent | MachineOkStockLevelEvent): void {
        this.machines.forEach(machine => {
            if (machine.id === event.machineId()) {
                if (event.type() === StockEventType.LowStockLevel) {
                    console.log(`Machine ${machine.id} is low on stock`);
                }
                if (event.type() === StockEventType.OkStockLevel) {
                    console.log(`Machine ${machine.id} is ok on stock`);
                }
            }
        });
    }
}

export { MachineStockWarningSubscriber }
