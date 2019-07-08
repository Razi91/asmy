import { expect } from 'chai';
import 'mocha';

import Cpu, { ConditionCode } from './cpu';
import Op, { parseArguments } from './op';
import Nop from './ops/nop';
import Arithmetic, { Add, ArithmeticCreate } from './ops/arithmetic';

describe('OpCode decoder', () => {
    it('decodes simple arguments correctly', () => {
        let simple = parseArguments('r1,r2');
        expect(simple.length).to.equal(2);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('r2');
    });

    it('throws with invalid arguments', () => {
        expect(() => parseArguments('r1],r2')).to.throw();
        expect(() => parseArguments('[r1,r2')).to.throw();
        expect(() => parseArguments('[r1],[[r2')).to.throw();
        expect(() => parseArguments('[r1],[r2]]')).to.throw();
    });

    it('decodes addressed arguments correctly', () => {
        let simple = parseArguments('r1, [r2], [r3]');
        expect(simple.length).to.equal(3);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('[r2]');
        expect(simple[2]).to.equal('[r3]');
    });

    it('decodes relative arguments correctly', () => {
        let simple = parseArguments('[r1], [r2, #-1], [r3]');
        expect(simple.length).to.equal(3);
        expect(simple[0]).to.equal('[r1]');
        expect(simple[1]).to.equal('[r2, #-1]');
    });

    it('throw error when argument not valid', () => {
        expect(() => parseArguments('[r1], r')).to.throw();
        expect(() => parseArguments('[r1], r')).to.throw();
        expect(() => parseArguments('r1], r3')).to.throw();
    });

    it('throws when unknown opcode', () => {
        const cpu = new Cpu({});
        expect(() => cpu.createInstruction('wtf r0')).to.throw();
        expect(() => cpu.createInstruction('addwt r0, r1')).to.throw();
        expect(() => cpu.createInstruction('addle r0, r1')).to.not.throw();
    });

    it('decodes "nop" opcode correctly', () => {
        const cpu = new Cpu({});
        expect(cpu.program[0].constructor).to.be.equal(Nop);
    });

    it('decodes and performs arithmetic opcodes correctly', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['r0', 'r1', 'r2']);
        const tests = [
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
        for (let op of tests) {
            regs[0].set(op.regs[0]);
            regs[1].set(op.regs[1]);
            let inst = ArithmeticCreate(cpu, op.code, ['r0', 'r1']);
            inst.exe();
            expect(regs[0].get()).to.equal(op.result);
        }
    });

    it('decodes conditional instructions correctly', () => {
        const cpu = new Cpu({
            program: 'addle r0, r1'
        });
        expect((cpu.program[0] as Arithmetic).condition).to.be.equal(
            ConditionCode.LE
        );
    });

    it('decodes instruction that changes state correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1'
        });
        expect((cpu.program[0] as Arithmetic).condition).to.be.equal(
            ConditionCode.AL
        );
        expect((cpu.program[0] as Arithmetic).setStatus).to.be.equal(true);
    });

    describe('Sets status flags correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1, r2'
        });
        let regs = cpu.getArgs(['r0', 'r1', 'r2']);
        let tests = [
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
                let instr = ArithmeticCreate(cpu, test.code, [
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
