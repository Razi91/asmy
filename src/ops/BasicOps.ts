import Cpu from '../Cpu';
import Op from './op';
import { Arg, ConditionCode } from '../Arg';
import {
    B32,
    createOpCodesConditionals,
    createOperation,
    OpPrototypes
} from './Utils';
import { OpCodesType } from '../OpCodes';

export const supported = ['add', 'sub', 'mul', 'div'];

const OpTypes: OpPrototypes = {
    add: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() + b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = (result & B32) === 0;
            cpu.status.c = result > 0x7fffffff;
            cpu.status.v = result < 0;
        }
    },
    adc: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() + b.get() + (cpu.status.c ? 1 : 0);
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = result === 0;
            cpu.status.c = result > 0x7fffffff;
            cpu.status.v = result < 0;
        }
    },
    sub: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() - b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = result === 0;
            cpu.status.c = result >= 0;
            cpu.status.v = result >= 0x80000000 || result <= -0x80000000;
        }
    },
    mul: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() * b.get();
        },

        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = (result & B32) === 0;
        }
    },
    div: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() / b.get();
        }
    },
    and: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() & b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    orr: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() | b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number) {
            // todo
        }
    },
    eor: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() ^ b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    bic: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() & ~b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    asr: {
        argsNumber: [3, 3],
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() >> b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    lsr: {
        argsNumber: [3, 3],
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() >> b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    lsl: {
        argsNumber: [3, 3],
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() << b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    ror: {
        argsNumber: [3, 3],
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            const [v1, v2] = [a.get(), b.get()];
            if (v1 > 0) {
                const res = v1 >> v2;
                const rest = Math.abs(v1 << (32 - v2));
                return res | rest;
            }
            throw new Error('Can not rotate with negative value');
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    mov: {
        argsNumber: [2, 2],
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return b.get();
        }
    }
};

OpTypes.cmp = {
    argsNumber: [2, 2],
    skipAssign: true,
    forceStatus: true,
    exe(cpu: Cpu, a: Arg, b: Arg): number {
        const result = OpTypes.sub.exe(cpu, a, b);
        OpTypes.sub.updateStatus!(cpu, [a, b], result);
        return 0;
    }
};

OpTypes.cmn = {
    argsNumber: [2, 2],
    skipAssign: true,
    forceStatus: true,
    exe(cpu: Cpu, a: Arg, b: Arg): number {
        const result = OpTypes.add.exe(cpu, a, b);
        OpTypes.add.updateStatus!(cpu, [a, b], result);
        return 0;
    }
};

OpTypes.teq = {
    argsNumber: [2, 2],
    skipAssign: true,
    forceStatus: true,
    exe(cpu: Cpu, a: Arg, b: Arg): number {
        const result = OpTypes.eor.exe(cpu, a, b);
        OpTypes.eor.updateStatus!(cpu, [a, b], result);
        return 0;
    }
};

OpTypes.tst = {
    argsNumber: [2, 2],
    skipAssign: true,
    forceStatus: true,
    exe(cpu: Cpu, a: Arg, b: Arg): number {
        const result = OpTypes.eor.exe(cpu, a, b);
        OpTypes.eor.updateStatus!(cpu, [a, b], result);
        return 0;
    }
};

class Nop implements Op {
    exe(cpu?: Cpu): boolean {
        return true;
    }
}

const BasicOps = createOpCodesConditionals(OpTypes);
BasicOps.nop = Nop;

export default BasicOps;
