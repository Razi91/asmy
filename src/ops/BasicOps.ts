import Cpu, { ConditionCode } from '../Cpu';
import { OpCodesList } from '../OpCodes';
import Op from './op';
import { Arg } from '../Arg';

export const supported = ['add', 'sub', 'mul', 'div'];

export abstract class Basic extends Op {
    cpu: Cpu;
    condition: ConditionCode;
    assign: boolean;
    args: Arg[];
    argLen: number;
    setStatus = false;
    signed = true;

    abstract innerExe(a: Arg, b: Arg): number;

    abstract updateStatus(result: number): void;

    protected constructor(cpu: Cpu, opcode: string, args: string[]) {
        super();
        this.assign = true;
        this.cpu = cpu;
        this.args = cpu.getArgs(args);
        this.argLen = args.length;
        this.setStatus = opcode[3] == 's';
        this.condition = ConditionCode.AL;
        if (opcode.length > 3) {
            const condition: string = opcode
                .substr(3 + (this.setStatus ? 1 : 0), 2)
                .toUpperCase();

            if (condition.length == 2) {
                if (!(condition in ConditionCode)) {
                    throw new Error('Wrong condition code');
                }
                this.condition = (ConditionCode as any)[condition];
            }
        }
    }

    exe() {
        if (this.condition != ConditionCode.AL) {
            if (!this.cpu.status.check(this.condition)) {
                return false;
            }
        }
        let result = 0;
        if (this.argLen == 2) {
            result = this.innerExe(this.args[0], this.args[1]);
        } else if (this.argLen >= 3) {
            result = this.innerExe(this.args[1], this.args[2]);
        } else {
            throw new Error('Invalid number of arguments');
        }
        if (this.assign) {
            this.args[0].set(result);
        }
        if (this.setStatus) {
            this.updateStatus(result);
        }
        return true;
    }
}

export class Add extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() + b.get();
    }

    updateStatus(result: number) {
        this.cpu.status.n = (result & 0x80000000) != 0;
        this.cpu.status.z = this.args[0].get() === 0;
        this.cpu.status.c = this.signed
            ? result > 0x7fffffff
            : result > 0xffffffff;
        this.cpu.status.v = result < 0;
    }
}

export class Sub extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() - b.get();
    }

    updateStatus(result: number) {
        this.cpu.status.n = (result & 0x80000000) != 0;
        this.cpu.status.z = this.args[0].get() === 0;
        this.cpu.status.c = result >= 0;
        this.cpu.status.v = result >= 0x80000000 || result <= -0x80000000;
    }
}

export class Mul extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() * b.get();
    }

    updateStatus(result: number) {
        this.cpu.status.n = (result & 0x80000000) != 0;
        this.cpu.status.z = this.args[0].get() === 0;
    }
}

export class Div extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() / b.get();
    }

    updateStatus(result: number) {
        //literally nothing
    }
}

export class And extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() / b.get();
    }

    updateStatus(result: number) {
        this.cpu.status.n = (result & 0x80000000) != 0;
        this.cpu.status.z = this.args[0].get() === 0;
        this.cpu.status.c = result >= 0;
    }
}

export class Mov extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe(a: Arg, b: Arg) {
        return b.get();
    }

    updateStatus(result: number) {
        throw new Error(`Mov opCode doesn't change CPU status registers`);
    }
}

export class Cmp extends Basic {
    constructor(cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
        this.assign = false;
        this.setStatus = true;
    }

    innerExe(a: Arg, b: Arg) {
        return a.get() - b.get();
    }

    updateStatus(result: number) {
        this.cpu.status.n = (result & 0x80000000) != 0;
        this.cpu.status.z = this.args[0].get() === this.args[1].get();
        this.cpu.status.c = result >= 0;
        this.cpu.status.v = result >= 0x80000000 || result <= -0x80000000;
    }
}

export class Nop extends Op {
    args: Arg[] = [];

    constructor() {
        super();
    }

    exe() {
        return true;
    }
}

const BasicOps: OpCodesList = {
    nop: [Nop, false, false],
    mov: [Mov, false, true],
    add: [Add, true, true],
    sub: [Sub, true, true],
    mul: [Mul, true, true],
    div: [Div, true, true],
    and: [And, true, true],
    // orr: null,
    // eor: null,
    // bic: null,
    // asr: null,
    // lsl: null,
    // lsr: null,
    // ror: null,

    cmp: [Cmp, false, true]
    // cmn: null,
    // tst: null,
    // teq: null
};

export function ArithmeticCreate(
    cpu: Cpu,
    opcode: string,
    args: string[]
): Basic {
    const code = opcode.slice(0, 3);
    if (Object.keys(BasicOps).indexOf(code) == -1) {
        throw new Error(`Unknown arithmetic opcode: ${opcode}`);
    }
    return new BasicOps[opcode.slice(0, 3)]![0](cpu, opcode, args);
}

export default function() {
    return BasicOps;
}