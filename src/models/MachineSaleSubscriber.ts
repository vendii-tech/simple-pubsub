import { ISubscriber } from '../interfaces/ISubscriber';
import { MachineSaleEvent } from './MachineSaleEvent';
import { Machine } from './Machine';
import { IPublishSubscribeService } from '../interfaces';
import { STOCK_THRESHOLD, StockEventType } from '../constants';
import { MachineStockWarningSubscriber } from './MachineStockWarningSubscriber';
import { MachineLowStockLevelEvent } from './MachineLowStockLevelEvent';

class MachineSaleSubscriber implements ISubscriber {
    public machines: Machine[];
    private pubSubService: IPublishSubscribeService;

    constructor(pubSubService: IPublishSubscribeService, machines: Machine[]) {
        this.machines = machines;
        this.pubSubService = pubSubService;
        this.pubSubService.subscribe(StockEventType.LowStockLevel, new MachineStockWarningSubscriber(this.machines))
    }

    handle(event: MachineSaleEvent): void {
        this.machines.forEach(machine => {
            if (machine.id === event.machineId()) {
                machine.stockLevel -= event.getSoldQuantity();
                console.log(`Machine ${machine.id} stock level: ${machine.stockLevel}`);
                if (!machine.logLowStock && machine.stockLevel < STOCK_THRESHOLD) {
                    this.pubSubService.publish(new MachineLowStockLevelEvent(machine.id));
                    machine.logLowStock = true
                    machine.logOkStock = false
                }
            }
        });
    }
}

export { MachineSaleSubscriber }
