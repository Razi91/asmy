import Cpu from './Cpu';

export enum DataType {
    U8,
    I8,
    U16,
    I16,
    U32,
    I32
}

export enum ConditionCode {
    EQ = 0b0000,
    NE = 0b0001,
    HS = 0b0010, // alternative
    CS = 0b0010,
    LO = 0b0011, // alternative
    CC = 0b0011,
    MI = 0b0100,
    PL = 0b0101,
    VS = 0b0110,
    VC = 0b0111,
    HI = 0b1000,
    LS = 0b1001,
    GE = 0b1010,
    LT = 0b1011,
    GT = 0b1100,
    LE = 0b1101,
    AL = 0b1110
}

export interface Arg {
    isPointer?: boolean;
    isLiteral?: boolean;
    value?: number;
    source?: string | any;

    get(preview?: boolean): number;

    set(value: number): void;
}

export function literalArg(value: number): Arg {
    return {
        value,
        isLiteral: true,
        get(): number {
            return value;
        },
        set() {
            throw new Error('Trying to store in raw value');
        }
    };
}

export function labelArg(cpu: Cpu, label: string): Arg {
    return {
        source: label,
        get(): number {
            return cpu.getLabelPtr(label);
        },
        set() {
            throw new Error('Trying to modify label value');
        }
    };
}

export function sumArg(args: Arg[], applyOffset: boolean): Arg {
    if (applyOffset && (args.length != 2 || !args[args.length - 1].isLiteral)) {
        throw new Error('Last argument must be literal value');
    }
    return {
        isPointer: true,
        source: args,
        get(preview?: boolean): number {
            const offset = args[args.length - 1].get();
            if (preview) {
                return args.reduce((val, reg) => val + reg.get(true), 0);
            }
            const ret = args.reduce((val, reg) => val + reg.get(), 0);
            if (applyOffset) {
                args[args.length - 2].set(args[args.length - 2].get() + offset);
            }
            return ret;
        },
        set(value: number) {
            if (args.length == 1) {
                args[0].set(args[0].get() + value);
                return;
            }
            throw new Error('Read only argument');
        }
    };
}
