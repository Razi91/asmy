import Cpu, { Arg, ConditionCode, CpuRegs } from '../cpu';
import Op from '../op';

export const supported = ['add', 'sub', 'mul', 'div'];

export default abstract class Arithmetic extends Op {
    cpu: Cpu;
    condition: ConditionCode;
    args: Arg[];
    argLen: number;
    setStatus: boolean = false;
    signed: boolean = true;

    abstract innerExe(a: Arg, b: Arg): number;

    abstract updateStatus(result: number): void;

    protected constructor(cpu: Cpu, opcode: string, args: string[]) {
        super();
        this.cpu = cpu;
        this.args = cpu.getArgs(args);
        this.argLen = args.length;
        this.setStatus = opcode[3] == 's';
        this.condition = ConditionCode.AL;
        if (opcode.length > 3) {
            let condition: string = opcode
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
        this.args[0].set(result);
        if (this.setStatus) {
            this.updateStatus(result);
        }
        return true;
    }
}

export class Add extends Arithmetic {
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

export class Sub extends Arithmetic {
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

export class Mul extends Arithmetic {
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

export class Div extends Arithmetic {
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

const Types: {[key: string]: any} = {
    'add': Add,
    'sub': Sub,
    'mul': Mul,
    'div': Div
}

export function ArithmeticCreate(
    cpu: Cpu,
    opcode: string,
    args: string[]
): Arithmetic {
    let code = opcode.slice(0, 3)
    if (Object.keys(Types).indexOf(code) == -1) {
        throw new Error(`Unknown arithmetic opcode: ${opcode}`);
    }
    return new Types[opcode.slice(0, 3)](cpu, opcode, args);
}
