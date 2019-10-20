import { Arg, ConditionCode } from '../Arg';
import Cpu from '../Cpu';
import Op from './op';
import BasicOps from './BasicOps';

export const B32 = 0xffffffff;

export type OpPrototype = {
    skipAssign?: boolean;
    skipConditionals?: boolean;
    exe: (cpu: Cpu, a: Arg, b: Arg) => number;
    forceStatus?: boolean;
    updateStatus?: (cpu: Cpu, args: Arg[], result: number) => void;
    argsNumber?: [number, number];
};

export type OpPrototypes = { [key: string]: OpPrototype };

type OpCreatorArg = {
    condition: ConditionCode;
    operation: (cpu: Cpu, arg1: Arg, arg2: Arg) => number;
    updateStatus?: (cpu: Cpu, args: Arg[], result: number) => void;
    skipAssign?: boolean;
    argsNumber?: [number, number];
};

export function createOperation({
    condition,
    operation,
    updateStatus,
    skipAssign = false,
    argsNumber
}: OpCreatorArg) {
    return class implements Op {
        args: Arg[] | null = null;
        condition = condition;
        setsStatus = updateStatus != null;

        constructor(public cpu: Cpu, public rawArgs: string[]) {
            if (argsNumber != null) {
                if (
                    rawArgs.length < argsNumber[0] ||
                    rawArgs.length > argsNumber[1]
                ) {
                    throw new Error('Invalid number of arguments');
                }
            }
        }

        exe(cpu?: Cpu) {
            if (cpu == null) {
                cpu = this.cpu;
            }
            if (this.args == null) {
                this.args = this.cpu.getArgs(this.rawArgs);
            }
            if (condition != ConditionCode.AL) {
                if (!this.cpu.status.check(condition)) {
                    return false;
                }
            }
            let result = 0;
            if (this.args.length == 2) {
                result = operation(cpu, this.args[0], this.args[1]);
            } else if (this.args.length >= 3) {
                result = operation(cpu, this.args[1], this.args[2]);
            } else {
                throw new Error('Invalid number of arguments');
            }
            if (!skipAssign) {
                this.args[0].set(result);
            }
            if (updateStatus) {
                updateStatus(cpu, this.args, result);
            }
            return true;
        }
    };
}

export function createOpCodesConditionals(
    OpTypes: OpPrototypes,
    creator: (arg: OpCreatorArg) => any = createOperation
) {
    const BasicOps: { [key: string]: any } = {};
    Object.entries(OpTypes).forEach(([name, definition]) => {
        BasicOps[name] = createOperation({
            condition: ConditionCode.AL,
            operation: definition.exe,
            skipAssign: definition.skipAssign,
            argsNumber: definition.argsNumber
        });
        if (definition.updateStatus) {
            BasicOps[name + 's'] = createOperation({
                condition: ConditionCode.AL,
                operation: definition.exe,
                updateStatus: definition.updateStatus,
                skipAssign: definition.skipAssign,
                argsNumber: definition.argsNumber
            });
        }
        if (!definition.skipConditionals) {
            for (let cond = 0; cond < 14; cond++) {
                // EQ to LE, not AL
                BasicOps[
                    name + ConditionCode[cond].toLowerCase()
                ] = createOperation({
                    condition: cond,
                    operation: definition.exe,
                    skipAssign: definition.skipAssign,
                    argsNumber: definition.argsNumber
                });
                if (definition.updateStatus) {
                    BasicOps[
                        name + 's' + ConditionCode[cond].toLowerCase()
                    ] = createOperation({
                        condition: cond,
                        operation: definition.exe,
                        updateStatus: definition.updateStatus,
                        skipAssign: definition.skipAssign,
                        argsNumber: definition.argsNumber
                    });
                }
            }
        }
    });
    return BasicOps;
}
