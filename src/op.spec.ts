import { expect } from 'chai';
import 'mocha';

import Cpu, { ConditionCode } from './cpu';
import Op, { parseArguments } from './op';
import Nop from './ops/nop';
import Basic, { Add, ArithmeticCreate } from './ops/basic';

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
});
