import {IEvent, MachineRefillEvent, MachineSaleEvent, StockLowEvent, StockOkEvent} from "./event";
import {randomId} from "./helpers";
import {Machine} from "./machine";
import {PublishSubscribeService} from "./pubsub";

interface ISubscriber {
    handle(event: IEvent): void;

    getId(): string
}

// We should add some abstractions to reduce code duplication
class MachineSaleSubscriber implements ISubscriber {
    private pubSub: PublishSubscribeService;
    public machines: Machine[];
    private id: string;

    constructor(machines: Machine[], pubSub: PublishSubscribeService) {
        this.machines = machines;
        this.pubSub = pubSub;
        this.id = randomId();
    }

    handle(event: MachineSaleEvent): void {
        const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
        const oldStockLevel = this.machines[machineIndex].stockLevel;
        const newStockLevel = oldStockLevel - event.getSoldQuantity();

        this.machines[machineIndex].stockLevel = newStockLevel;

        if (newStockLevel < 3) {
            this.pubSub.publish(new StockLowEvent(event.machineId()))
        }

    }

    getId(): string {
        return this.id;
    }
}

class MachineRefillSubscriber implements ISubscriber {
    private pubSub: PublishSubscribeService;
    public machines: Machine[];
    private id: string;

    constructor(machines: Machine[], pubSub: PublishSubscribeService) {
        this.machines = machines;
        this.pubSub = pubSub;
        this.id = randomId();
    }

    handle(event: MachineRefillEvent): void {
        const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
        const oldStockLevel = this.machines[machineIndex].stockLevel;
        const newStockLevel = oldStockLevel + event.getRefillNumber();

        this.machines[machineIndex].stockLevel = newStockLevel;

        if (newStockLevel >= 3) {
            this.pubSub.publish(new StockOkEvent(event.machineId()))
        }

    }

    getId(): string {
        return this.id;
    }
}

class StockLowSubscriber implements ISubscriber {
    private id: string;

    constructor(private readonly _machines: Machine[]) {
        this.id = randomId();
    }

    getId(): string {
        return this.id;
    }

    handle(event: StockLowEvent): void {
        const machineIndex = this._machines.findIndex(machine => machine.id === event.machineId());
        const stockLevel = this._machines[machineIndex].stockLevel;

        console.log(`Machine ID: ${event.machineId()} has triggered StockLowEvent with Stock Level: ${stockLevel}`);
    }

}

class StockOkSubscriber implements ISubscriber {
    private id: string;

    constructor(private readonly _machines: Machine[]) {
        this.id = randomId();
    }

    getId(): string {
        return this.id;
    }

    handle(event): void {
        const machineIndex = this._machines.findIndex(machine => machine.id === event.machineId());
        const stockLevel = this._machines[machineIndex].stockLevel;

        console.log(`Machine ID: ${event.machineId()} has triggered StockOkEvent with Stock Level: ${stockLevel}`);
    }

}

export {
    ISubscriber,
    MachineSaleSubscriber,
    MachineRefillSubscriber,
    StockLowSubscriber,
    StockOkSubscriber
}