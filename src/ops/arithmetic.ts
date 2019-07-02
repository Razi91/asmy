import Cpu, {ConditionCode, CpuRegs} from '../cpu'
import Op from "../op";


export const supported = ['add', 'sub', 'mul', 'div'];

export default abstract class Arithmetic extends Op {
    condition: ConditionCode;
    args: CpuRegs;
    argLen: number;
    setStatus: boolean = false;
    signed: boolean = true;

    abstract innerExe(): number;

    protected constructor(protected cpu: Cpu, opcode: string, args: string[]) {
        super();
        this.args = cpu.getArgs(args);
        this.argLen = args.length;
        this.setStatus = opcode.endsWith('s');
        this.condition = ConditionCode.AL;
        if (opcode.length > 3) {
            let condition: string = opcode.substr(3, 2).toUpperCase();
            if (condition.length == 2) {
                this.condition = (ConditionCode as any)[condition];
            }
        }
    }

    static create(cpu: Cpu, opcode: string, args: string[]): Arithmetic {
        if (opcode.startsWith('add')) {
            return new Add(cpu, opcode, args);
        }
        if (opcode.startsWith('sub')) {
            return new Sub(cpu, opcode, args);
        }
        if (opcode.startsWith('mul')) {
            return new Mul(cpu, opcode, args);
        }
        if (opcode.startsWith('div')) {
            return new Div(cpu, opcode, args);
        }
        throw new Error(`Unknown opcode: ${opcode}`);
    }


    exe() {
        //TODO: check condition
        if (this.condition != ConditionCode.AL) {
            if (!this.cpu.status.check(this.condition)) {
                return
            }
        }
        let result = this.innerExe();
        if (this.setStatus) {
            //TODO: set flags if required
            this.cpu.status.n = (result & 0x80000000) != 0;
            this.cpu.status.z = this.args.a === 0;
            this.cpu.status.c = this.signed ? result > 0x7fffffff : result > 0xffffffff;
            this.cpu.status.v = result < 0;
        }
    }

}

export class Add extends Arithmetic {
    constructor(protected cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe() {
        if (this.argLen == 2) {
            return this.args.a = this.args.a + this.args.b;
        } else if (this.argLen == 3) {
            return this.args.a = this.args.b + this.args.c;
        }
        throw new Error('Invalid number of arguments');
    }
}


export class Sub extends Arithmetic {
    constructor(protected cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args)
    }

    innerExe() {
        if (this.argLen == 2) {
            return this.args.a = this.args.a - this.args.b;
        } else if (this.argLen == 3) {
            return this.args.a = this.args.b - this.args.c;
        }
        throw new Error('Invalid number of arguments');
    }
}


export class Mul extends Arithmetic {
    constructor(protected cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args);
    }

    innerExe() {
        if (this.argLen == 2) {
            return this.args.a = this.args.a * this.args.b;
        } else if (this.argLen == 3) {
            return this.args.a = this.args.b * this.args.c;
        }
        throw new Error('Invalid number of arguments');
    }
}


export class Div extends Arithmetic {
    constructor(protected cpu: Cpu, opcode: string, args: string[]) {
        super(cpu, opcode, args)
    }

    innerExe() {
        if (this.argLen == 2) {
            return this.args.a = this.args.a / this.args.b;
        } else if (this.argLen == 3) {
            return this.args.a = this.args.b / this.args.c;
        }
        throw new Error('Invalid number of arguments');
    }
}
