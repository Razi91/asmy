import { expect } from 'chai';
import 'mocha';

import Cpu from './Cpu';

describe("Cpu's core is working", () => {
    describe('Registers validity', () => {
        it('should have valid Gaeneral Purpouse registers', () => {
            const testRegisters = 10;
            const cpu = new Cpu({
                registers: testRegisters
            });
            for (let i = 0; i < testRegisters; i++) {
                expect(cpu.regs[`r${i}`].get()).to.equal(0);
            }
            expect(cpu.regs[`r${testRegisters}`]).to.be.undefined;
        });

        it('cut overflow value', () => {
            const cpu = new Cpu({});
            cpu.regs.r0.set(0xffffffff);
            expect(cpu.regs.r0.get()).to.equal(0xffffffff);
            cpu.regs.r0.set(0xffffffff + 1);
            expect(cpu.regs.r0.get()).to.equal(0);
        });

        it('can add 2 registers', () => {
            const cpu = new Cpu({});
            const regs = cpu.getArgs(['r0', 'r1', 'r2']);
            regs[0].set(0x7fffffff);
            regs[1].set(0x80000000);
            regs[2].set(regs[0].get() + regs[1].get());
            expect(regs[2].get()).to.equal(0xffffffff);
            cpu.regs.r2.set(cpu.regs.r2.get() + 0x101);
            expect(regs[2].get()).to.equal(0x100);
            expect(regs[2].get()).to.equal(cpu.regs.r2.get());
        });
    });

    it("throws error when can't recognize arguments syntax", () => {
        const cpu = new Cpu({});
        expect(() => cpu.getArgs(['r0', 'pc', '{r1}'])).to.throw();
    });

    it('should throw error when no program provided', () => {
        const cpu = new Cpu({});
        expect(cpu.doStep).to.throw();
    });

    it('recognizes label', () => {
        const cpu = new Cpu({
            program: ['sub r0, r0', 'start:']
        });
        expect(cpu.labels).to.have.key('start');
        expect(() => cpu.getLabelPtr('start')).to.not.throw();
        expect(() => cpu.getLabelPtr('error')).to.throw();
        expect(cpu.getLabelPtr('start')).to.equal(1);
    });

    it('should progress program counter', () => {
        const cpu = new Cpu({
            stackSize: 2 << 16,
            program: ['nop', 'nop']
        });
        expect(cpu.regs.pc.get()).to.equal(0);
        cpu.doStep();
        expect(cpu.regs.pc.get()).to.equal(1);
    });

    it('returns valid raw value', () => {
        const cpu = new Cpu({});
        const regs = cpu.getArgs(['#45']);
        expect(regs[0].get()).to.equal(45);
    });

    it('throws error when trying to save raw value', () => {
        const cpu = new Cpu({});
        const regs = cpu.getArgs(['#45']);
        expect(() => regs[0].set(4)).to.throw();
    });

    it('negative values', () => {
        const cpu = new Cpu({});
        const regs = cpu.getArgs(['r0']);
        regs[0].set(-1);
        expect(regs[0].get()).to.equal(0xffffffff);
    });

    describe.skip('Inner memory operations', () => {
        //TODO: fix
        it('allows to save data on pointer', () => {
            const cpu = new Cpu({
                stackSize: 8,
                program: ['str r0, [sp]']
            });
            cpu.regs.r0.set(125);
            cpu.regs.sp.set(cpu.regs.sp.get());
            expect(() => cpu.doStep()).to.not.throw();
            expect(cpu.dataView.getUint32(cpu.regs.sp.get())).to.be.equal(125);
        });
    });

    describe.skip('Stack pointer operations', () => {
        it('allows to save data on stack', () => {});

        it('allows to read and store value from/in inner memory', () => {});
    });
});
