import Op from './op';
import { Arg, ConditionCode } from '../Arg';
import Cpu from '../Cpu';
import { createOpCodesConditionals, OpPrototypes } from './Utils';

type DataSize = 'b' | 'h' | 'sb' | 'sh' | '';
type ExeFormat = (cpu: Cpu, address: Arg, value: Arg) => boolean;

const StoreFn: { [key in DataSize]?: any } = {
    ''(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint32(address.get(), value.get());
    },
    b(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint8(address.get(), value.get());
    },
    h(cpu: Cpu, address: Arg, value: Arg) {
        cpu.dataView.setUint16(address.get(), value.get());
    }
};

const LoadFn: { [key in DataSize]?: any } = {
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

function StrSize(
    dataSize: DataSize,
    condition: ConditionCode = ConditionCode.AL
) {
    return class Str implements Op {
        args: Arg[];
        condition = condition;

        constructor(public cpu: Cpu, args: string[]) {
            this.args = cpu.getArgs(args);
        }

        exe(cpu: Cpu): boolean {
            if (this.condition != ConditionCode.AL) {
                if (!this.cpu.status.check(this.condition)) {
                    return false;
                }
            }
            StoreFn[dataSize](this.cpu, this.args[1], this.args[0]);
            if (this.args.length == 3) {
                this.args[1].set(this.args[2].get());
            }
            return true;
        }
    };
}

function LdrSize(
    dataSize: DataSize,
    condition: ConditionCode = ConditionCode.AL
) {
    return class Ldr implements Op {
        args: Arg[];
        condition = condition;

        constructor(public cpu: Cpu, args: string[]) {
            this.args = cpu.getArgs(args);
        }

        exe(): boolean {
            if (this.condition != ConditionCode.AL) {
                if (!this.cpu.status.check(this.condition)) {
                    return false;
                }
            }
            LoadFn[dataSize](this.cpu, this.args[1], this.args[0]);
            if (this.args.length == 3) {
                this.args[1].set(this.args[2].get());
            }
            return true;
        }
    };
}

export class Ldr implements Op {
    args: Arg[];
    dataSize: DataSize;

    constructor(public cpu: Cpu, opcode: DataSize, args: string[]) {
        this.dataSize = opcode;
        this.args = cpu.getArgs(args);
    }

    exe(): boolean {
        LoadFn[this.dataSize](this.cpu, this.args[1], this.args[0]);
        if (this.args.length == 3) {
            this.args[1].set(this.args[2].get());
        }
        return true;
    }
}

export class Str implements Op {
    args: Arg[];
    dataSize: DataSize;

    constructor(public cpu: Cpu, dataSize: DataSize, args: string[]) {
        this.dataSize = dataSize;
        this.args = cpu.getArgs(args);
    }

    exe(): boolean {
        StoreFn[this.dataSize](this.cpu, this.args[1], this.args[0]);
        if (this.args.length == 3) {
            this.args[1].set(this.args[2].get());
        }
        return true;
    }
}

const MemoryTransfer: { [key: string]: any } = {};

function create(op: string, fn: typeof StoreFn, creator: any) {
    Object.keys(fn).forEach(dataType => {
        MemoryTransfer[`${op}${dataType}`] = creator(dataType as DataSize);

        for (let cond = 0; cond < 14; cond++) {
            MemoryTransfer[
                `${op}${dataType}${ConditionCode[cond].toLowerCase()}`
            ] = creator(dataType as DataSize, cond);
        }
    });
}

create('str', StoreFn, StrSize);
create('ldr', LoadFn, LdrSize);

export default MemoryTransfer;
