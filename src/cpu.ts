import Op from './ops/op';
import Opcodes from './OpCodes';
import { Arg, literalArg, offsetArg, regArg } from './Arg';

export enum ConditionCode {
    EQ = 0x0000,
    NE = 0x0001,
    HS = 0x0010, // alternative
    CS = 0x0010,
    LO = 0x0011, // alternative
    CC = 0x0011,
    MI = 0x0100,
    PL = 0x0101,
    VS = 0x0110,
    VC = 0x0111,
    HI = 0x1000,
    LS = 0x1001,
    GE = 0x1010,
    LT = 0x1011,
    GT = 0x1100,
    LE = 0x1101,
    AL = 0x1110
}

export class CpuStatus {
    n = false; // negative
    z = false; // zero
    c = false; // carry
    v = false; // overflow

    get(key: string) {
        return (this as any)[key];
    }

    /**
     *  Check if condition is met
     * @param code
     */
    check(code: ConditionCode): boolean {
        let res = false;
        switch (code >> 1) {
            case 0x000:
                res = this.z;
                break;
            case 0x001:
                res = this.c;
                break;
            case 0x010:
                res = this.n;
                break;
            case 0x011:
                res = this.v;
                break;
            case 0x100:
                res = this.c && !this.z;
                break;
            case 0x101:
                res = this.n == this.v;
                break;
            case 0x110:
                res = !this.z && this.n == this.v;
                break;
            case 0x111:
                res = true;
                break;
        }
        if (code & 0x1) {
            // invert if negation
            res = !res;
        }
        return res;
    }
}

export class CpuRegs {
    [key: string]: Arg;
}

interface CpuOptions {
    memorySize?: number;
    stackSize?: number;
    registers?: number;
    program?: string | string[];
}

class Cpu {
    regs: CpuRegs = {};
    innerMemory: Uint32Array;
    status = new CpuStatus();
    program: Op[] = [];
    labels: { [key: string]: number } = {};

    constructor(options: CpuOptions) {
        const {
            memorySize = 32 * 1024,
            stackSize = 2 << 16,
            registers = 10,
            program = 'nop'
        } = options;
        const code = Array.isArray(program) ? program : program.split('\n');
        this.innerMemory = new Uint32Array(memorySize);

        const innerMemory = this.innerMemory;
        const createRegisters: string[] = [
            ...Array(registers)
                .fill(0)
                .map((_, i) => `r${i}`),
            'pc',
            'fp',
            'sp',
            '_a'
        ];
        for (const reg in createRegisters) {
            this.regs[createRegisters[reg]] = {
                get() {
                    return innerMemory[reg];
                },
                set(value: number) {
                    innerMemory[reg] = value;
                }
            };
        }
        this.regs.sp.set(0x1000);
        this.regs.fp.set(0x1000 + stackSize);
        code.forEach(line => this.insertCode(line));
    }

    public doStep(): void {
        const pc = this.regs.pc;
        if (this.program.length <= pc.get()) {
            throw new Error(`Instruction at ${pc} not found`);
        }
        this.program[pc.get()].exe();
        this.regs.pc.set(pc.get() + 1);
    }

    insertCode(code: string, segment?: string): void {
        const labelRegex = /([a-z_][a-z0-9_]*):/;
        if (labelRegex.test(code)) {
            const label = labelRegex.exec(code);
            if (label != null) {
                this.labels[label[1]] = this.program.length;
            }
        } else {
            const op = Opcodes.decode(this, code);
            this.program.push(op);
        }
    }

    createInstruction(code: string, segment?: string): Op {
        const op = Opcodes.decode(this, code);
        return op;
    }

    getArgs(names: string[]): Arg[] {
        const ret: Arg[] = [];
        const regs = this.regs;
        for (const arg of names) {
            if (regs.hasOwnProperty(arg)) {
                ret.push(regs[arg]);
            } else if (arg[0] == '#') {
                const val = parseInt(arg.substr(1));
                ret.push(literalArg(val));
            } else if (arg[0] == '[' && arg[arg.length - 1] == ']') {
                if (arg.indexOf(',') !== -1) {
                    const args = arg
                        .substr(1, arg.length - 2)
                        .split(',')
                        .map(s => s.trim());
                    const reg = args[0];
                    const offset = parseInt(args[1].substr(1));
                    ret.push(offsetArg(this.innerMemory, regs[reg], offset));
                } else {
                    const reg = arg.substr(1, arg.length - 2);
                    ret.push(regArg(this.innerMemory, regs[reg]));
                }
            } else {
                throw new Error(`Argument not implemented: '${arg}'`);
            }
        }
        return ret;
    }
}

export default Cpu;
