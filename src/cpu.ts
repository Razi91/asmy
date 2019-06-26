import Op from './op'

class CpuStatus {
    negative = false;
    zero = false;
    carry = false;
    overflow = false;
}

interface Arg {
    get(): number,

    set(value: number): void
}

class CpuRegs {
    [key: string]: number;
}

interface CpuOptions {
    stackSize?: number,
    registers?: number,
    program?: Op[]
}

class Cpu {
    regs = new CpuRegs();
    innerMemory: Uint32Array;
    status = new CpuStatus();
    stack: Uint8Array;
    program: Op[];

    constructor(options: CpuOptions) {
        let {
            stackSize = 2 << 16,
            registers = 10,
            program = []
        } = options;
        this.program = program;
        this.innerMemory = new Uint32Array(32);
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
                    self.innerMemory[reg] = value & 0xffffffff | 0;
                }
            })
        }
    }

    public doStep(): void {
        let pc = this.regs.pc
        if (this.program.length <= pc) {
            throw new Error(`Instruction at ${pc} not found`)
        }
        this.program[pc].exe.call(this);
        this.regs.pc = pc + 1
    }

    getArgs(names: string[]): CpuRegs {
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
                        throw new Error('Trying to store in raw value')
                    }
                })
            } else if (arg[0] == '[' && arg[arg.length - 1] == ']') {
                Object.defineProperty(ret, letters[i++], {
                    get(): number {
                        return 0
                    },
                    set(value: number) {
                        throw new Error('Trying to store in raw value')
                    }
                })
            } else {
                throw new Error('Not implemented yet')
            }
        }
        return ret;
    }

}

export default Cpu
