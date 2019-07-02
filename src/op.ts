export default abstract class Op {
    args: CpuRegs = {};


    protected constructor() {

    }

    abstract exe(): void;
}

import Cpu, {CpuRegs} from './cpu'
import Nop from "./ops/nop";
import Arithmetic, {supported} from "./ops/arithmetic";

export function parseArguments(code: string): string[] {
    let args: string[] = [];
    let stack = [];
    let begin = 0;
    code += '\n';
    for (let i = 0; i < code.length; i++) {
        let c = code[i];
        if ((c == ',' || c == '\n') && stack.length == 0) {
            let arg = code.substr(begin, i - begin).trim();
            if (arg.length < 2) {
                throw new Error(`Argument ${arg} too short`);
            }
            args.push(arg);
            begin = i + 1;
            continue;
        }
        if (c == '[') {
            stack.push('[');
            continue;
        }
        if (c == ']') {
            if (stack.pop() != '[') {
                throw new Error('Invalid syntax, mismatch ]');
            }
        }
    }
    return args
}

export function decode(cpu: Cpu, code: string): Op {
    if (code == 'nop') {
        return new Nop()
    }
    let s = code.indexOf(' ');
    let [opcode, args] = [code.substr(0, s), code.substr(s)];
    if (supported.indexOf(opcode.substr(0, 3)) != -1) {
        return Arithmetic.create(cpu, opcode, parseArguments(args))
    }
    throw new Error(`Unknown opcode ${code}`)
}
