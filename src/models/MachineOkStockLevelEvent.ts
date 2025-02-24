import { IEvent } from '../interfaces/IEvent';
import { StockEventType } from '../constants/StockEventType';

class MachineOkStockLevelEvent implements IEvent {
    constructor(private readonly _machineId: string) { }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return StockEventType.OkStockLevel;
    }
}

export { MachineOkStockLevelEvent}
