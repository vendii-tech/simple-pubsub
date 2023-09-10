import {EVENT} from "./pubsub";

interface IEvent {
    type(): string;

    machineId(): string;
}

class MachineSaleEvent implements IEvent {
    constructor(private readonly _sold: number, private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    getSoldQuantity(): number {
        return this._sold
    }

    type(): string {
        return EVENT.SALE;
    }
}

class MachineRefillEvent implements IEvent {

    constructor(private readonly _refill: number, private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return EVENT.REFILL;
    }

    getRefillNumber(): number {
        return this._refill;
    }
}

class StockLowEvent implements IEvent {

    constructor(private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return EVENT.STOCK_LOW;
    }
}

class StockOkEvent implements IEvent {
    constructor(private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return EVENT.STOCK_OK;
    }

}

export {
    IEvent,
    MachineSaleEvent,
    MachineRefillEvent,
    StockLowEvent,
    StockOkEvent
}