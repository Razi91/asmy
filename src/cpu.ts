import Op from './op'
import {decode} from './op'

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
    AL = 0x1110,
};

export class CpuStatus {
    n = false;
    z = false;
    c = false;
    v = false;

    /**
     *  Check
     * @param code
     */
    check(code: ConditionCode): boolean {
        let res: boolean = false;
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
                res = !this.z && (this.n == this.v);
                break;
            case 0x111:
                res = true;
                break;
        }
        return code & 0x1 ? !res : res;
    }
}

interface Arg {
    get(): number,

    set(value: number): void
}

export class CpuRegs {
    [key: string]: number;
}

interface CpuOptions {
    memorySize?: number,
    stackSize?: number,
    registers?: number,
    program?: string | string[]
}

export function to32bit(value: number) {
    return value
}

class Cpu {
    regs = new CpuRegs();
    innerMemory: Uint32Array;
    status = new CpuStatus();
    stack: Uint8Array;
    program: Op[];

    constructor(options: CpuOptions) {
        let {
            memorySize = 32 * 1024,
            stackSize = 2 << 16,
            registers = 10,
            program = 'nop'
        } = options;
        let code = Array.isArray(program) ? program : program.split('\n');
        this.innerMemory = new Uint32Array(32 * 1024);
        this.stack = new Uint8Array(stackSize);

        let self = this;
        let createRegisters: string[] = [
            ...Array(registers).fill(0).map((_, i) => `r${i}`),
            'pc',
            'sp'
        ];
        for (let reg in createRegisters) {
            Object.defineProperty(this.regs, createRegisters[reg], {
                enumerable: true,
                configurable: false,
                get(): number {
                    return self.innerMemory[reg];
                },
                set(value: number) {
                    self.innerMemory[reg] = value;
                },
            })
        }
        this.program = code.map(instruction => decode(this, instruction));
    }

    public doStep(): void {
        let pc = this.regs.pc;
        if (this.program.length <= pc) {
            throw new Error(`Instruction at ${pc} not found`)
        }
        this.program[pc].exe();
        this.regs.pc = pc + 1
    }

    insertCode(code: string, segment?: string): void {
        let op = decode(this, code);
        this.program.push(op);
    }

    createInstruction(code: string, segment?: string): Op {
        let op = decode(this, code);
        return op;
    }

    getArgs(names: string[]): CpuRegs {
        let cpu = this;
        let ret: CpuRegs = {};
        let regs = this.regs;
        let letters = ['a', 'b', 'c', 'd', 'e'];
        let i = 0;
        for (let arg of names) {
            if (regs.hasOwnProperty(arg)) {
                Object.defineProperty(ret, letters[i++], {
                    get(): number {
                        return regs[arg]
                    },
                    set(value: number) {
                        regs[arg] = value
                    }
                })
            } else if (arg[0] == '#') {
                const val = parseInt(arg.substr(1));
                Object.defineProperty(ret, letters[i++], {
                    get(): number {
                        return val
                    },
                    set() {
                        throw new Error('Trying to store in raw value');
                    }
                })
            } else if (arg[0] == '[' && arg[arg.length - 1] == ']') {
                if (arg.indexOf(',') !== -1) {
                    let args = arg.substr(1, arg.length - 2).split(',').map(s => s.trim());
                    let reg = args[0];
                    let offset = parseInt(args[1].substr(1))
                    Object.defineProperty(ret, letters[i++], {
                        get(): number {
                            return cpu.innerMemory[regs[reg] + offset]
                        },
                        set(value: number) {
                            cpu.innerMemory[regs[reg] + offset] = value;
                        }
                    })
                } else {
                    let reg = arg.substr(1, arg.length - 2);
                    Object.defineProperty(ret, letters[i++], {
                        get(): number {
                            return cpu.innerMemory[regs[reg]]
                        },
                        set(value: number) {
                            cpu.innerMemory[regs[reg]] = value;
                        }
                    })
                }
            } else {
                throw new Error(`Argument not implemented: '${arg}'`);
            }
        }
        return ret;
    }

}

export default Cpu
