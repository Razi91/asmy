import Cpu from './cpu';
import Op from './ops/op';
import { init as basicInit } from './ops/basic';
import { init as branchInit } from './ops/branch';

type OpConstruct = (cpu: Cpu, opCode: string, args: string[]) => Op;

const opCodesMap = new Map<string, OpConstruct>();

export class OpCodesType {
    register(name: string, opCode: OpConstruct) {
        opCodesMap.set(name, opCode);
    }

    parseArguments(code: string): string[] {
        if (code.length == 0) {
            return [];
        }
        const args: string[] = [];
        const stack = [];
        let begin = 0;
        code += '\n';
        for (let i = 0; i < code.length; i++) {
            const c = code[i];
            if ((c == ',' || c == '\n') && stack.length == 0) {
                const arg = code.substr(begin, i - begin).trim();
                if (arg.length < 2) {
                    throw new Error(
                        `Argument ${arg} too short (code: ${code})`
                    );
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
    }

    decode(cpu: Cpu, code: string): Op {
        const s = code.indexOf(' ');
        let opcode, args;
        if (s == -1) {
            [opcode, args] = [code, ''];
        } else {
            [opcode, args] = [code.substr(0, s), code.substr(s)];
        }
        const initial = opcode.substr(0, 3);
        if (opCodesMap.has(initial) && opCodesMap.get(initial) != null) {
            const ctor = opCodesMap.get(initial)!;
            const op = ctor(cpu, opcode, this.parseArguments(args));
            return op;
        }
        throw new Error(`Unknown opcode ${opcode}`);
    }
}

const instance = new OpCodesType();
Object.freeze(instance);

basicInit(instance);
branchInit(instance);

export default instance;
