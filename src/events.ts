import {IEvent} from './types';
export class MachineSaleEvent implements IEvent{
    constructor(
        private readonly _sold: number,
        private readonly _machineId: string,
    ){}

    machineId(): string {
        return this._machineId;
    }

    getSoldQuantity(): number{
        return this._sold;
    }
    type(): string{
        return 'sale';
    }
}


export class MachineRefillEvent implements IEvent{
    constructor(
        private readonly _refill: number,
        private readonly _machineId: string,
    ){}

    machineId(): string {
        return this._machineId;
    }

    getRefillQuantity(): number{
        return this._refill;
    }

    type(): string{
        return 'refill';
    }
}

export class LowStockWarningEvent implements IEvent{
    constructor(
        private readonly _machineId: string,
        private readonly _currentStock: number,
    ){}

    machineId(): string {
        return this._machineId;
    }
    getCurrentStock(): number{
        return this._currentStock;
    }

    type(): string{
        return 'low-stock-warning';
    }
}
export class StockLevelOkEvent implements IEvent{
    constructor(
        private readonly _machineId: string,
        private readonly _currentStock: number,
    ){}

    machineId(): string {
        return this._machineId;
    }

    getCurrentStock(): number{
        return this._currentStock;
    }

    type(): string{
        return 'stock-level-ok'
    }
}
