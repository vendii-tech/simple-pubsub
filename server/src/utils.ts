export type validMachineStatus = 'Active' | 'Offline' | 'Idle';

export class Maybe<T> {
    constructor(private value: T | null | undefined) {}

    static some<T>(value: T): Maybe<T> {
        if (value === null || value === undefined) {
            throw new Error('Cannot create Some with a null or undefined value');
        }
        return new Maybe<T>(value);
    }

    // Create an empty Maybe
    static none<T>(): Maybe<T> {
        return new Maybe<T>(null);
    }

    static fromValue<T>(value: T | null | undefined) {
        if (value === null || value === undefined) return Maybe.none<T>();
        else return Maybe.some<T>(value);
    }

    public getValue(): T {
        if (this.isNone) {
            throw new Error('Called getValue on a None Maybe');
        }
        return this.value!;
    }

    get isSome(): boolean {
        return this.value != null && this.value != undefined;
    }

    get isNone(): boolean {
        return !this.isSome;
    }

    map<R>(f: (value: T) => R): Maybe<R> {
        return this.isSome ? Maybe.fromValue(f(this.value!)) : Maybe.none<R>();
    }

    // Retrieve the value or return a default
    getOrElse(defaultValue: T): T {
        return this.isSome ? this.value! : defaultValue;
    }

    // Use this to chain operations that return other Maybes
    flatMap<R>(f: (value: T) => Maybe<R>): Maybe<R> {
        return this.isSome ? f(this.value!) : Maybe.none<R>();
    }
}
