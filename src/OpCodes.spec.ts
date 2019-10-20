import { expect } from 'chai';
import 'mocha';

import Cpu from './Cpu';
import OpCodes from './OpCodes';

describe('OpCode decoder', () => {
    it('decodes simple arguments correctly', () => {
        const simple = OpCodes.parseArguments('r1,r2');
        expect(simple.length).to.equal(2);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('r2');
    });

    it('throws with invalid arguments', () => {
        expect(() => OpCodes.parseArguments('r1],r2')).to.throw();
        expect(() => OpCodes.parseArguments('[r1,r2')).to.throw();
        expect(() => OpCodes.parseArguments('[r1],[[r2')).to.throw();
        expect(() => OpCodes.parseArguments('[r1],[r2]]')).to.throw();
    });

    it('decodes addressed arguments correctly', () => {
        const simple = OpCodes.parseArguments('r1, [r2], [r3]');
        expect(simple.length).to.equal(3);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('[r2]');
        expect(simple[2]).to.equal('[r3]');
    });

    it('decodes relative arguments correctly', () => {
        const simple = OpCodes.parseArguments('[r1], [r2, #-1], [r3]');
        expect(simple.length).to.equal(3);
        expect(simple[0]).to.equal('[r1]');
        expect(simple[1]).to.equal('[r2, #-1]');
    });

    it('decodes relative arguments correctly', () => {
        const simple = OpCodes.parseArguments('r1, [r2, #4]!');
        expect(simple.length).to.equal(2);
        expect(simple[0]).to.equal('r1');
        expect(simple[1]).to.equal('[r2, #4]!');
    });

    it('throw error when argument not valid', () => {
        expect(() => OpCodes.parseArguments('r1], r3')).to.throw();
        expect(() => OpCodes.parseArguments('r1,, r2')).to.throw();
        expect(() => OpCodes.parseArguments('r1, r2,')).to.throw();
    });

    it('throws when unknown opcode', () => {
        const cpu = new Cpu({});
        expect(() => cpu.createInstruction('wtf r0')).to.throw();
        expect(() => cpu.createInstruction('addwt r0, r1')).to.throw();
        expect(() => cpu.createInstruction('addle r0, r1')).to.not.throw();
    });

    it('decodes "nop" opcode correctly', () => {
        const cpu = new Cpu({});
        // expect(cpu.program[0].constructor).to.be.equal(Nop);
    });
});
