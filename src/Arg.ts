export enum DataType {
    U8,
    I8,
    U16,
    I16,
    U32,
    I32
}

export interface Arg {
    get(type?: DataType): number;

    set(value: number): void;
}

export function literalArg(value: number): Arg {
    return {
        get(type?: DataType): number {
            return value;
        },
        set() {
            throw new Error('Trying to store in raw value');
        }
    };
}

export function offsetArg(
    innerMemory: DataView,
    register: Arg,
    offset: number
): Arg {
    return {
        get(type?: DataType): number {
            return innerMemory.getUint32(register.get() + offset);
        },
        set(value: number, type?: DataType) {
            innerMemory.setUint32(register.get() + offset, value);
        }
    };
}

export function regArg(innerMemory: DataView, register: Arg): Arg {
    return {
        get(type?: DataType): number {
            return innerMemory.getUint32(register.get());
        },
        set(value: number, type?: DataType) {
            innerMemory.setUint32(register.get(), value);
        }
    };
}
