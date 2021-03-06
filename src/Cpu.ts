import Op from './ops/op';
import Opcodes from './OpCodes';
import { Arg, ConditionCode, literalArg, sumArg } from './Arg';

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
                source: createRegisters[reg],
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
        this.program[ptr].exe(this);
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

    run(timelimit: number, log: null | ((op: Op) => void) = null) {
        const start = new Date();
        while (1) {
            const now = new Date();
            if (timelimit > 0 && +now - +start > timelimit) {
                throw new Error('Timelimit');
            }
            const op = this.program[this.regs.pc.get()];
            if (this.doStep() == false) {
                break;
            }
            if (log) {
                log(op);
            }
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
        const ret: Arg[] = [];
        const regs = this.regs;

        for (const arg of names) {
            if (regs.hasOwnProperty(arg)) {
                ret.push(regs[arg]);
            } else if (arg[0] == '#') {
                const val = parseInt(arg.substr(1));
                ret.push(literalArg(val));
            } else if (arg[0] == '[') {
                let applyOffset = false;
                if (arg.endsWith(']!')) {
                    applyOffset = true;
                } else if (!arg.endsWith(']')) {
                    throw new Error(`Mismatch ']'`);
                }
                const list = arg
                    .slice(1, -1)
                    .split(',')
                    .map(arg => arg.trim());
                const args = this.getArgs(list);
                ret.push(sumArg(args, applyOffset));
            } else {
                throw new Error(
                    `Argument not implemented: '${arg} (parsed from [${names}])'`
                );
            }
        }
        return ret;
    }
}

export default Cpu;
