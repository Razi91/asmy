import { expect } from 'chai';
import 'mocha';

import Cpu from './Cpu';

describe('Example programs runs correctly', () => {
    it('Basic arithmetic', () => {
        const program = ['mov r0, #1', 'mov r1, #4', 'add r2, r0, r1'];
        const cpu = new Cpu({
            program
        });
        expect(() => {
            while (cpu.doStep());
        }).to.not.throw();
        expect(cpu.regs.r0.get()).to.be.equal(1);
        expect(cpu.regs.r1.get()).to.be.equal(4);
        expect(cpu.regs.r2.get()).to.be.equal(5);
    });

    it('Conditionals', () => {
        const program = [
            'mov r0, #1',
            'mov r1, #4',
            'subs r2, r0, r1', // sets N
            'addeq r0, r0, r1', //should be omnited
            'addne r2, r0, r1' // should be executed
        ];
        const cpu = new Cpu({
            program
        });
        expect(() => {
            while (cpu.doStep());
        }).to.not.throw();
        expect(cpu.regs.r0.get()).to.be.equal(1);
        expect(cpu.regs.r1.get()).to.be.equal(4);
        expect(cpu.regs.r2.get()).to.be.equal(5);
    });

    it('Executes real ARM factorial code', () => {
        const program = [
            'fac:',
            'mov r3, r0',
            'mov r0, #1',
            '.L2:',
            'cmp r3, #0',
            'bxle lr',
            'mul r0, r3, r0',
            'sub r3, r3, #1',
            'b .L2',
            'end:'
        ].map(line => line.trim());
        const cpu = new Cpu({
            program
        });
        cpu.regs.r0.set(5);
        cpu.regs.pc.set(0);
        cpu.regs.lr.set(cpu.getLabelPtr('end'));
        while (cpu.doStep());

        expect(cpu.regs.r0.get()).to.be.equal(120);
    });
});
