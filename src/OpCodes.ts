import Cpu from './Cpu';
import Op from './ops/op';
import BasicOps from './ops/BasicOps';
import MemoryTransfer from './ops/MemoryTransfer';
import Branch from './ops/Branch';

export type OpConstruct = (cpu: Cpu, rawArgs: string[]) => Op;

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
                } else {
                    if (code[i + 1] == '!') {
                        i++;
                    }
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
        let opCode, args;
        if (s == -1) {
            [opCode, args] = [code, ''];
        } else {
            [opCode, args] = [code.substr(0, s), code.substr(s)];
        }
        if (opCodesMap.has(opCode) && opCodesMap.get(opCode) != null) {
            const ctor = opCodesMap.get(opCode)!;
            const op = ctor(cpu, this.parseArguments(args));
            return op;
        }
        throw new Error(`Unknown opcode ${opCode} [${code}]`);
    }
}

const instance = new OpCodesType();
Object.freeze(instance);

export const CONDITION_LABELS = [
    'eq',
    'ne',
    'hs',
    'cs',
    'lo',
    'cc',
    'mi',
    'pl',
    'vs',
    'vc',
    'hi',
    'ls',
    'ge',
    'lt',
    'gt',
    'le',
    'al'
];

Object.entries(BasicOps).forEach(([name, Op]) => {
    instance.register(name, (cpu: Cpu, args: string[]) => new Op(cpu, args));
});
Object.entries(MemoryTransfer).forEach(([name, Op]) => {
    instance.register(name, (cpu: Cpu, args: string[]) => new Op(cpu, args));
});
Object.entries(Branch).forEach(([name, Op]) => {
    instance.register(name, (cpu: Cpu, args: string[]) => new Op(cpu, args));
});

export default instance;
