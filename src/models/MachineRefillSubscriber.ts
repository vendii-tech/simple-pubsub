import { ISubscriber } from '../interfaces/ISubscriber';
import { MachineRefillEvent } from './MachineRefillEvent';
import { Machine } from './Machine';
import { IPublishSubscribeService } from '../interfaces';
import { STOCK_THRESHOLD, StockEventType } from '../constants';
import { MachineStockWarningSubscriber } from './MachineStockWarningSubscriber';
import { MachineOkStockLevelEvent } from './MachineOkStockLevelEvent';

class MachineRefillSubscriber implements ISubscriber {
    public machines: Machine[];
    private pubSubService: IPublishSubscribeService;

    constructor(pubSubService: IPublishSubscribeService, machines: Machine[]) {
        this.machines = machines;
        this.pubSubService = pubSubService;
        this.pubSubService.subscribe(StockEventType.OkStockLevel, new MachineStockWarningSubscriber(this.machines))
    }

    handle(event: MachineRefillEvent): void {
        this.machines.forEach(machine => {
            if (machine.id === event.machineId()) {
                machine.stockLevel += event.getRefillQuantity();
                console.log(`Machine ${machine.id} stock level: ${machine.stockLevel}`);
                if (!machine.logOkStock && machine.stockLevel >= STOCK_THRESHOLD) {
                    this.pubSubService.publish(new MachineOkStockLevelEvent(machine.id));
                    machine.logOkStock = true
                    machine.logLowStock = false
                }
            }
        });
    }
}

export { MachineRefillSubscriber }
