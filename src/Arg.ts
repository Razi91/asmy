export interface Arg {
    get(): number;

    set(value: number): void;
}

export function literalArg(value: number): Arg {
    return {
        get(): number {
            return value;
        },
        set() {
            throw new Error('Trying to store in raw value');
        }
    };
}

export function offsetArg(
    innerMemory: Uint32Array,
    register: Arg,
    offset: number
): Arg {
    return {
        get(): number {
            return innerMemory[register.get() + offset];
        },
        set(value: number) {
            innerMemory[register.get() + offset] = value;
        }
    };
}

export function regArg(innerMemory: Uint32Array, register: Arg): Arg {
    return {
        get(): number {
            return innerMemory[register.get()];
        },
        set(value: number) {
            innerMemory[register.get()] = value;
        }
    };
}
