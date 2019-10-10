import Cpu from './Cpu';
import Op from './ops/op';
import getBasicOps from './ops/BasicOps';
import getBranchTypes from './ops/Branch';

export type OpConstruct = (cpu: Cpu, opCode: string, args: string[]) => Op;

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
        let opCode, args;
        if (s == -1) {
            [opCode, args] = [code, ''];
        } else {
            [opCode, args] = [code.substr(0, s), code.substr(s)];
        }
        if (opCodesMap.has(opCode) && opCodesMap.get(opCode) != null) {
            const ctor = opCodesMap.get(opCode)!;
            const op = ctor(cpu, opCode, this.parseArguments(args));
            return op;
        }
        throw new Error(`Unknown opcode ${opCode} [${code}]`);
    }
}

const instance = new OpCodesType();
Object.freeze(instance);

const CONDITION_LABELS = [
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

export type OpCodesList = { [key: string]: [any, boolean, boolean] };

function init(opCodes: OpCodesList): void {
    Object.entries(opCodes).forEach(([k, [V, setStatus, conditional]]) => {
        const handler: OpConstruct = (cpu, opCode, a) => new V(cpu, opCode, a);
        instance.register(k, handler);
        if (conditional) {
            CONDITION_LABELS.forEach(cond => {
                instance.register(k + cond, handler);
                if (setStatus) {
                    instance.register(k + cond + 's', handler);
                }
            });
        }
        if (setStatus) {
            instance.register(k + 's', handler);
        }
    });
}

init(getBasicOps());
init(getBranchTypes());

// console.log(Array.from(opCodesMap.keys()).filter(k => k.startsWith('add')));

export default instance;
