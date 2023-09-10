import {IEvent, MachineRefillEvent, MachineSaleEvent} from "./event";

const randomMachine = (): string => {
    const random = Math.random() * 3;
    if (random < 1) {
        return '001';
    } else if (random < 2) {
        return '002';
    }
    return '003';

}

const eventGenerator = (): IEvent => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
    return new MachineRefillEvent(refillQty, randomMachine());
}

const randomId = (): string => {
    return (Math.random() + 1).toString(36).substring(7);
}

export {
    randomMachine,
    eventGenerator,
    randomId
}