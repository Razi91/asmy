import Op from './ops/op';
import Opcodes from './OpCodes';
import { Arg, literalArg, offsetArg, regArg } from './Arg';

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
            case 0b000:
                res = this.z;
                break;
            case 0b001:
                res = this.c;
                break;
            case 0b010:
                res = this.n;
                break;
            case 0b011:
                res = this.v;
                break;
            case 0b100:
                res = this.c && !this.z;
                break;
            case 0b101:
                res = this.n == this.v;
                break;
            case 0b110:
                res = !this.z && this.n == this.v;
                break;
            case 0b111:
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
    innerMemory: ArrayBuffer;
    dataView: DataView;
    status = new CpuStatus();
    program: Op[] = [];
    labels: Map<string, number> = new Map();

    constructor(options: CpuOptions) {
        const {
            memorySize = 32 * 1024,
            stackSize = 2 << 16,
            registers = 10,
            program = 'nop'
        } = options;
        const code = Array.isArray(program) ? program : program.split('\n');
        this.innerMemory = new ArrayBuffer(memorySize);
        const innerMemory32 = new Uint32Array(this.innerMemory);
        this.dataView = new DataView(this.innerMemory);

        const createRegisters: string[] = [
            ...Array(registers)
                .fill(0)
                .map((_, i) => `r${i}`),
            'fp',
            'sp',
            'lr',
            'pc',
            '_a'
        ];
        for (const reg in createRegisters) {
            this.regs[createRegisters[reg]] = {
                get() {
                    return innerMemory32[reg];
                },
                set(value: number) {
                    innerMemory32[reg] = value;
                }
            };
        }
        this.regs.sp.set(0x1000);
        this.regs.fp.set(0x1000 + stackSize);
        code.forEach(line => this.insertCode(line));
    }

    public doStep(): boolean {
        const pc = this.regs.pc;
        if (this.program.length <= pc.get()) {
            throw new Error(`Instruction at ${pc.get()} not found`);
        }
        const ptr = pc.get();
        pc.set(ptr + 1);
        this.program[ptr].exe();
        if (pc.get() < this.program.length) {
            return true;
        } else if (pc.get() == this.program.length) {
            return false;
        } else {
            throw new Error(
                `Invalid Program Counter value ${pc.get()} / ${
                    this.program.length
                }`
            );
        }
    }

    insertCode(code: string, segment?: string): void {
        const labelRegex = /(\.?[A-z_][A-z0-9_]*):/;
        if (labelRegex.test(code)) {
            const label = labelRegex.exec(code);
            if (label != null) {
                this.labels.set(label[1], this.program.length);
            }
        } else {
            const op = Opcodes.decode(this, code);
            this.program.push(op);
        }
    }

    getLabelPtr(name: string): number {
        if (this.labels.has(name)) {
            return this.labels.get(name)!;
        }
        throw new Error(`Label ${name} not found`);
    }

    createInstruction(code: string, segment?: string): Op {
        const op = Opcodes.decode(this, code);
        return op;
    }

    getArgs(names: string[]): Arg[] {
        const dataView = this.dataView;

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
                    ret.push(offsetArg(dataView, regs[reg], offset));
                } else {
                    const reg = arg.substr(1, arg.length - 2);
                    ret.push(regArg(dataView, regs[reg]));
                }
            } else {
                throw new Error(`Argument not implemented: '${arg}'`);
            }
        }
        return ret;
    }
}

export default Cpu;
