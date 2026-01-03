import { validMachineStatus } from './utils';

export interface IEvent {
    type(): string;
    machineId(): string;
    eventUUID: string;
}

export class MachineSaleEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();

    constructor(
        private readonly _machineId: string,
        private readonly _sold: number,
        private readonly _stockThen: number,
        private readonly _stockNow: number,
    ) {}

    type() {
        return 'machine.sale';
    }

    machineId() {
        return this._machineId;
    }

    getSoldQuantity(): number {
        return this._sold;
    }

    getStockThen() {
        return this._stockThen;
    }

    getStockNow() {
        return this._stockNow;
    }
}

export class MachineRefillEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();

    constructor(
        private readonly _machineId: string,
        private readonly _refill: number,
        private readonly _stockThen: number,
        private readonly _stockNow: number,
    ) {}

    type() {
        return 'machine.refill';
    }

    machineId() {
        return this._machineId;
    }

    getRefillAmount() {
        return this._refill;
    }

    getStockThen() {
        return this._stockThen;
    }

    getStockNow() {
        return this._stockNow;
    }
}

export class LowStockWarningEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();

    constructor(private readonly _machineId: string) {}
    type() {
        return 'machine.stock.low';
    }
    machineId() {
        return this._machineId;
    }
}

export class StockLevelOkEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();

    constructor(private readonly _machineId: string) {}
    type() {
        return 'machine.stock.ok';
    }
    machineId() {
        return this._machineId;
    }
}

export class MachineCreatedEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();

    constructor(private readonly _machineId: string) {}

    type() {
        return 'machine.create';
    }
    machineId() {
        return this._machineId;
    }
}

export class MachineDeletedEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();
    constructor(private readonly _machineId: string) {}

    type(): string {
        return 'machine.delete';
    }
    machineId() {
        return this._machineId;
    }
}

export class MachineStatusChangedEvent implements IEvent {
    public readonly eventUUID = crypto.randomUUID();
    constructor(
        private readonly _machineId: string,
        private readonly _statusFlag: validMachineStatus,
    ) {}

    type(): string {
        return 'machine.status.change';
    }
    machineId() {
        return this._machineId;
    }
    newStatus(): validMachineStatus {
        return this._statusFlag;
    }
}
