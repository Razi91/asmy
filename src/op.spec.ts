import {expect} from 'chai';
import 'mocha'

import Cpu, {ConditionCode} from './cpu'
import Op, {parseArguments} from './op'
import Nop from "./ops/nop";
import Arithmetic, {Add} from "./ops/arithmetic";


describe('OpCode decoder', () => {
    it('decodes simple arguments correctly', () => {
        let simple = parseArguments('r1,r2');
        expect(simple.length).to.equal(2);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('r2');
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

    it('decodes "nop" opcode correctly', () => {
        const cpu = new Cpu({
            program: 'nop'
        });
        expect(cpu.program[0].constructor).to.be.equal(Nop)
    });

    it('decodes and performs arithmetic opcodes correctly', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['r0', 'r1', 'r2']);
        const tests = [
            {
                code: 'add',
                regs: [4, 5],
                result: 9
            }, {
                code: 'add',
                regs: [0xffffffff, 5],
                result: 4
            }, {
                code: 'add',
                regs: [1, -5],
                result: 0xffffffff - 4 + 1
            }, {
                code: 'sub',
                regs: [5, 4],
                result: 1
            }, {
                code: 'mul',
                regs: [5, 4],
                result: 20
            }, {
                code: 'div',
                regs: [10, 5],
                result: 2
            }, {
                code: 'div',
                regs: [15, 4],
                result: 3
            }
        ];
        for (let op of tests) {
            regs.a = op.regs[0];
            regs.b = op.regs[1];
            let inst = cpu.createInstruction(`${op.code} r0, r1`);
            inst.exe();
            expect(regs.a).to.equal(op.result)
        }
    });

    it('decodes conditional instructions correctly', () => {
        const cpu = new Cpu({
            program: 'addle r0, r1'
        });
        expect((cpu.program[0] as Arithmetic).condition).to.be.equal(ConditionCode.LE)
    });

    it('decodes instruction that changes state correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1'
        });
        expect((cpu.program[0] as Arithmetic).condition).to.be.equal(ConditionCode.AL);
        expect((cpu.program[0] as Arithmetic).setStatus).to.be.equal(true);
    });

    it('sets status flags correctly', () => {
        const cpu = new Cpu({
            program: 'adds r0, r1, r2'
        });
        let regs = cpu.getArgs(['r0', 'r1', 'r2']);
        regs.b = 0xffffffff;
        regs.c = 1;
        cpu.doStep();
        expect(cpu.status.n).to.be.equal(false);
        expect(cpu.status.z).to.be.equal(true);
        expect(cpu.status.c).to.be.equal(true);
        expect(cpu.status.v).to.be.equal(false);
    });

});
