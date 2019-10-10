import Op from './op';
import Cpu, { ConditionCode } from '../Cpu';
import { Arg } from '../Arg';
import { OpCodesList, OpCodesType, OpConstruct } from '../OpCodes';
import { Add, And, Div, Mov, Mul, Nop, Sub } from './BasicOps';

export class Branch extends Op {
    cpu: Cpu;
    condition: ConditionCode;
    assign: boolean;
    link: boolean;
    label: string;

    protected constructor(cpu: Cpu, opcode: string, args: string[]) {
        super();
        this.assign = true;
        this.cpu = cpu;
        this.label = args[0];
        this.link = false;
        this.condition = ConditionCode.AL;
        this.link = opcode.startsWith('bl');
        if (opcode.length >= 3) {
            this.link = false;
            const condition: string = opcode.substr(-2, 2).toUpperCase();
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
        let ptr;
        if (this.label in this.cpu.regs) {
            ptr = this.cpu.regs[this.label].get();
        } else {
            ptr = this.cpu.getLabelPtr(this.label);
        }
        const now = this.cpu.regs.pc.get();
        this.cpu.regs.pc.set(ptr);
        if (this.link) {
            this.cpu.regs.lr.set(now);
        }
        return true;
    }
}

const BranchTypes: OpCodesList = {
    b: [Branch, false, true],
    bl: [Branch, false, true],
    bx: [Branch, false, true],
    blx: [Branch, false, true]
};

export default function() {
    return BranchTypes;
}
