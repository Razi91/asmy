import Cpu from '../Cpu';
import Op from './op';
import { Arg, ConditionCode } from '../Arg';
import {
    createOpCodesConditionals,
    createOperation,
    OpPrototypes
} from './Utils';

export const supported = ['add', 'sub', 'mul', 'div'];

const OpTypes: OpPrototypes = {
    add: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() + b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = args[0].get() === 0;
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
            cpu.status.z = args[0].get() === 0;
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
            cpu.status.z = args[0].get() === 0;
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
            cpu.status.z = args[0].get() === 0;
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
    or: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() | b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number) {
            // todo
        }
    },
    xor: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return a.get() ^ b.get();
        },
        updateStatus(cpu: Cpu, args: Arg[], result: number): void {
            // todo
        }
    },
    mov: {
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            return b.get();
        }
    },
    cmp: {
        skipAssign: true,
        forceStatus: true,
        exe(cpu: Cpu, a: Arg, b: Arg): number {
            const result = a.get() - b.get();
            cpu.status.n = (result & 0x80000000) != 0;
            cpu.status.z = a.get() === b.get();
            cpu.status.c = result >= 0;
            cpu.status.v = result >= 0x80000000 || result <= -0x80000000;
            return result;
        }
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
