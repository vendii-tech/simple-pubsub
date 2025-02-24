import { IEvent } from '../interfaces/IEvent';
import { StockEventType } from '../constants/StockEventType';

class MachineSaleEvent implements IEvent {
    constructor(private readonly _sold: number, private readonly _machineId: string) { }

    machineId(): string {
        return this._machineId;
    }

    getSoldQuantity(): number {
        return this._sold;
    }

    type(): string {
        return StockEventType.Sale;
    }
}

export { MachineSaleEvent }
