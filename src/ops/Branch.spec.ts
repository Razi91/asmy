import { expect } from 'chai';
import 'mocha';

import Cpu from '../Cpu';

describe('Branching', () => {
    it('Simple branch', () => {
        const program = ['mov r0, #2', 'b goto', 'mov r0, #1', 'goto:'];
        const cpu = new Cpu({
            program
        });
        while (cpu.doStep());
        expect(cpu.regs.r0.get()).to.be.equal(2);
    });
    it('Branch link', () => {
        const program = ['mov r0, #2', 'bl goto', 'mov r0, #1', 'goto:'];
        const cpu = new Cpu({
            program
        });
        while (cpu.doStep());
        expect(cpu.regs.r0.get()).to.be.equal(2);
        expect(cpu.regs.lr.get()).to.be.equal(2);
    });
    it('Conditional branch', () => {
        const program = [
            'mov r0, #2',
            'cmp r0, #2',
            'beq goto',
            'mov r0, #1',
            'goto:'
        ];
        const cpu = new Cpu({
            program
        });
        while (cpu.doStep());
        expect(cpu.regs.r0.get()).to.be.equal(2);
    });
});
