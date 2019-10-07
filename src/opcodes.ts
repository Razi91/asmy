import Cpu, { CpuRegs, Arg } from './cpu';
import Nop from './ops/Nop';
import { supported, ArithmeticCreate } from './ops/basic';
import Op from './ops/op';

const opcodes = new Map<string, Op>();

export default {
    register(name: string, opcode: Op) {
        opcodes.set(name, opcode);
    },

    parseArguments(code: string): string[] {
        const args: string[] = [];
        const stack = [];
        let begin = 0;
        code += '\n';
        for (let i = 0; i < code.length; i++) {
            const c = code[i];
            if ((c == ',' || c == '\n') && stack.length == 0) {
                const arg = code.substr(begin, i - begin).trim();
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
        if (stack.length != 0) {
            throw new Error('Invalid syntax, mismatch ]');
        }
        return args;
    },

    decode(cpu: Cpu, code: string): Op {
        if (code == 'nop') {
            return new Nop();
        }
        const s = code.indexOf(' ');
        let opcode, args;
        if (s == -1) {
            [opcode, args] = [code, ''];
        } else {
            [opcode, args] = [code.substr(0, s), code.substr(s)];
        }
        if (supported.indexOf(opcode.substr(0, 3)) != -1) {
            return ArithmeticCreate(cpu, opcode, this.parseArguments(args));
        }
        throw new Error(`Unknown opcode ${opcode} ; ${opcode.substr(0, 3)}`);
    }
};
