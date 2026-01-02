import { Maybe, validMachineStatus } from './utils';

export class Machine {
    public stockLevel = 10;
    public id: string;
    public statusFlag: validMachineStatus = 'Offline';
    constructor(id: string) {
        this.id = id;
    }
}

export interface IMachineRepository {
    findAll(): Promise<Machine[]>;
    findById(id: string): Promise<Maybe<Machine>>;
    updateId(machine: Machine): Promise<void>;
    delete(id: string): Promise<void>;
}

export class MachineRepository {
    private machines: Map<string, Machine> = new Map();

    constructor(initialMachines: Machine[] = []) {
        initialMachines.forEach((m) => this.machines.set(m.id, m));
    }

    async findAll(): Promise<Machine[]> {
        return Array.from(this.machines.values());
    }

    async findById(id: string): Promise<Maybe<Machine>> {
        const machine = this.machines.get(id);
        if (machine) return Maybe.fromValue(new Machine(machine.id));
        else return Maybe.none();
    }

    async updateId(machine: Machine): Promise<void> {
        // replaces if machine exist, adds if machine does not exist
        this.machines.set(machine.id, machine);
    }

    async delete(id: string): Promise<void> {
        this.machines.delete(id);
    }
}
