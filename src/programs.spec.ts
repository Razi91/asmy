import { expect } from 'chai';
import 'mocha';

import Cpu from './cpu';

describe('Example programs runs correctly', () => {
    it('Arithmetic', () => {
        const program = ['mov r0, #1', 'mov r1, #4', 'add r2, r1, r2'];
        const cpu = new Cpu({
            program
        });
        for (let i = 0; i < program.length; i++) {
            cpu.doStep();
        }
        expect(cpu.regs.r2.get()).to.be.equal(5);
    });
});
