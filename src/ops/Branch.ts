import Op from './op';
import Cpu from '../Cpu';
import { Arg, ConditionCode } from '../Arg';

function creator(link: boolean, condition: ConditionCode = ConditionCode.AL) {
    return class implements Op {
        link = link;
        cpu: Cpu;
        condition = condition;
        assign: boolean;
        label: string;

        protected constructor(cpu: Cpu, args: string[]) {
            this.assign = true;
            this.cpu = cpu;
            this.label = args[0];
        }

        exe(cpu: Cpu): boolean {
            if (this.condition != ConditionCode.AL) {
                if (!cpu.status.check(this.condition)) {
                    return false;
                }
            }
            let ptr;
            if (this.label in cpu.regs) {
                ptr = cpu.regs[this.label].get();
            } else {
                ptr = cpu.getLabelPtr(this.label);
            }
            const now = cpu.regs.pc.get();
            cpu.regs.pc.set(ptr);
            if (this.link) {
                cpu.regs.lr.set(now);
            }
            return true;
        }
    };
}

const Branch: { [key: string]: any } = {};

function create() {
    const b = creator(false);
    Branch[`b`] = b;
    Branch[`bx`] = b;
    const bl = creator(true);
    Branch[`bl`] = bl;
    Branch[`blx`] = bl;
    for (let cond = 0; cond < 14; cond++) {
        const b = creator(false, cond);
        Branch[`b${ConditionCode[cond].toLowerCase()}`] = b;
        Branch[`bx${ConditionCode[cond].toLowerCase()}`] = b;
        const bl = creator(true, cond);
        Branch[`bl${ConditionCode[cond].toLowerCase()}`] = bl;
        Branch[`blx${ConditionCode[cond].toLowerCase()}`] = bl;
    }
}

create();

export default Branch;
