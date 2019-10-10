import { expect } from 'chai';
import 'mocha';

import Cpu, { ConditionCode } from '../Cpu';
import { Basic, ArithmeticCreate } from './BasicOps';

describe('Arithmetic opcodes', () => {
    it('decodes and performs arithmetic opcodes correctly', () => {
        const cpu = new Cpu({});
        const regs = cpu.getArgs(['r0', 'r1', 'r2']);
        const tests = [
            {
                code: 'mov',
                regs: [0, 4],
                result: 4
            },
            {
                code: 'mov',
                regs: [0, 0xffffffff - 1],
                result: 0xffffffff - 1
            },
            {
                code: 'mov',
                regs: [0xffffffff + 1],
                result: 0
            },
            {
                code: 'add',
                regs: [4, 5],
                result: 9
            },
            {
                code: 'add',
                regs: [0xffffffff, 5],
                result: 4
            },
            {
                code: 'add',
                regs: [1, -5],
                result: 0xffffffff - 4 + 1
            },
            {
                code: 'sub',
                regs: [5, 4],
                result: 1
            },
            {
                code: 'mul',
                regs: [5, 4],
                result: 20
            },
            {
                code: 'div',
                regs: [10, 5],
                result: 2
            },
            {
                code: 'div',
                regs: [15, 4],
                result: 3
            }
        ];
        for (const op of tests) {
            regs[0].set(op.regs[0]);
            regs[1].set(op.regs[1]);
            const inst = ArithmeticCreate(cpu, op.code, ['r0', 'r1']);
            inst.exe();
            expect(regs[0].get()).to.equal(op.result);
        }
    });

    it('decodes conditional instructions correctly', () => {
        const cpu = new Cpu({
            program: 'addle r0, r1'
        });
        expect((cpu.program[0] as Basic).condition).to.be.equal(
            ConditionCode.LE
        );
    });

    it('decodes instruction that changes state correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1'
        });
        expect((cpu.program[0] as Basic).condition).to.be.equal(
            ConditionCode.AL
        );
        expect((cpu.program[0] as Basic).setStatus).to.be.equal(true);
    });

    it('decodes NOP correctly', () => {
        const cpu = new Cpu({
            program: 'nop'
        });
        expect(() => cpu.doStep).to.not.throw();
    });

    describe('Sets status flags correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1, r2'
        });
        const regs = cpu.getArgs(['r0', 'r1', 'r2']);
        const tests = [
            {
                code: 'adds',
                args: [0xffffffff, 1],
                result: [false, true, true, false]
            },
            {
                code: 'adds',
                args: [0, 1],
                result: [false, false, false, false]
            },
            {
                code: 'adds',
                args: [-1, 1],
                result: [false, true, true, false]
            },
            {
                code: 'adds',
                args: [-1, 2],
                result: [false, false, true, false]
            },
            {
                code: 'subs',
                args: [1, 0],
                result: [false, false, true, false]
            },
            {
                code: 'subs',
                args: [1, 1],
                result: [false, true, true, false]
            },
            {
                code: 'subs',
                args: [0, 1],
                result: [true, false, false, false]
            },
            {
                code: 'muls',
                args: [1, 1],
                result: [false, false]
            },
            {
                code: 'muls',
                args: [0, 1],
                result: [false, true]
            },
            {
                code: 'muls',
                args: [-1, 1],
                result: [true, false]
            },
            {
                code: 'muls',
                args: [0x7fffffffff, 2],
                result: [true, false]
            }
        ];
        tests.forEach(test => {
            it(`${test.code} ${test.args}`, () => {
                regs[1].set(test.args[0]);
                regs[2].set(test.args[1]);
                const instr = ArithmeticCreate(cpu, test.code, [
                    'r0',
                    'r1',
                    'r2'
                ]);
                instr.exe();
                expect(cpu.status.n).to.be.equal(test.result[0]);
                expect(cpu.status.z).to.be.equal(test.result[1]);
                if (test.result.length > 2) {
                    expect(cpu.status.c).to.be.equal(test.result[2]);
                    expect(cpu.status.v).to.be.equal(test.result[3]);
                }
            });
        });
    });
});
