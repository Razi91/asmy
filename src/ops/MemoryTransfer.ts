import Cpu, { ConditionCode } from '../Cpu';
import { OpCodesList } from '../OpCodes';
import Op from './op';
import { Arg } from '../Arg';

type DataSize = 'b' | 'h' | 'sb' | 'sh' | '';
type ExeFormat = (cpu: Cpu, address: Arg, value: Arg) => boolean;

const StoreFn = {
    ''(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint32(address.get(), value.get());
    },
    b(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint8(address.get(), value.get());
    },
    h(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint16(address.get(), value.get());
    },
    sb(cpu: Cpu, address: Arg, value: Arg) {
        throw new Error('Not allowed for store');
    },
    sh(cpu: Cpu, address: Arg, value: Arg) {
        throw new Error('Not allowed for store');
    }
};

const LoadFn = {
    ''(cpu: Cpu, address: Arg, dest: Arg) {
        dest.set(cpu.dataView.getUint32(address.get()));
    },
    b(cpu: Cpu, address: Arg, dest: Arg) {
        dest.set(cpu.dataView.getUint8(address.get()));
    },
    h(cpu: Cpu, address: Arg, dest: Arg) {
        dest.set(cpu.dataView.getUint16(address.get()));
    },
    sb(cpu: Cpu, address: Arg, dest: Arg) {
        dest.set(cpu.dataView.getInt8(address.get()));
    },
    sh(cpu: Cpu, address: Arg, dest: Arg) {
        dest.set(cpu.dataView.getInt16(address.get()));
    }
};

function StrSize(dataSize: DataSize) {
    return class Str extends Op {
        regs: Arg[];

        constructor(public cpu: Cpu, opcode: string, args: string[]) {
            super();
            this.regs = cpu.getArgs(args);
        }

        exe(): boolean {
            StoreFn[dataSize](this.cpu, this.regs[1], this.regs[0]);
            if (this.regs.length == 3) {
                this.regs[1].set(this.regs[2].get());
            }
            return true;
        }
    };
}

export class Str extends Op {
    regs: Arg[];
    dataSize: DataSize;

    constructor(public cpu: Cpu, dataSize: DataSize, args: string[]) {
        super();
        this.dataSize = dataSize;
        this.regs = cpu.getArgs(args);
    }

    exe(): boolean {
        StoreFn[this.dataSize](this.cpu, this.regs[1], this.regs[0]);
        if (this.regs.length == 3) {
            this.regs[1].set(this.regs[2].get());
        }
        return true;
    }
}

function LdrSize(dataSize: DataSize) {
    return class Ldr extends Op {
        regs: Arg[];

        constructor(public cpu: Cpu, opcode: string, args: string[]) {
            super();
            this.regs = cpu.getArgs(args);
        }

        exe(): boolean {
            LoadFn[dataSize](this.cpu, this.regs[1], this.regs[0]);
            if (this.regs.length == 3) {
                this.regs[1].set(this.regs[2].get());
            }
            return true;
        }
    };
}

export class Ldr extends Op {
    regs: Arg[];
    dataSize: DataSize;

    constructor(public cpu: Cpu, opcode: DataSize, args: string[]) {
        super();
        this.dataSize = opcode;
        this.regs = cpu.getArgs(args);
    }

    exe(): boolean {
        LoadFn[this.dataSize](this.cpu, this.regs[1], this.regs[0]);
        if (this.regs.length == 3) {
            this.regs[1].set(this.regs[2].get());
        }
        return true;
    }
}

const Types: OpCodesList = {
    str: [StrSize(''), false, true],
    strb: [StrSize('b'), false, true],
    strh: [StrSize('h'), false, true],
    //
    ldr: [LdrSize(''), false, true],
    ldrb: [LdrSize('b'), false, true],
    ldrh: [LdrSize('h'), false, true],
    ldrsb: [LdrSize('sb'), false, true],
    ldrsh: [LdrSize('sh'), false, true]
};

export default function() {
    return Types;
}
