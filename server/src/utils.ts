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

export class Result<T> {
    public readonly isSuccess: boolean;
    public readonly isFailure: boolean;
    private readonly _value?: T;
    private readonly _error?: string;

    private constructor(isSuccess: boolean, value?: T, error?: string) {
        this.isSuccess = isSuccess;
        this.isFailure = !isSuccess;
        this._value = value;
        this._error = error;

        // prevents change
        Object.freeze(this);
    }

    // Factory method for Success
    public static ok<T>(value?: T): Result<T> {
        return new Result<T>(true, value);
    }

    // Factory method for Failure
    public static fail<T>(error: string): Result<T> {
        return new Result<T>(false, undefined, error);
    }

    // Get the success value
    public getValue(): T {
        if (!this.isSuccess) {
            throw new Error("Cannot get value from a failure result. Use 'error' instead.");
        }
        return this._value!;
    }

    // Get the error message
    public get error(): string {
        return this._error || 'No error message provided.';
    }

    // Transform the value if successful
    public map<R>(f: (value: T) => R): Result<R> {
        if (this.isFailure) return Result.fail<R>(this.error);
        return Result.ok<R>(f(this._value!));
    }

    // Chain operations that also return Results
    public flatMap<R>(f: (value: T) => Result<R>): Result<R> {
        if (this.isFailure) return Result.fail<R>(this.error);
        return f(this._value!);
    }
}
