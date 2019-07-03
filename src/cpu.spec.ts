import {expect} from 'chai';
import 'mocha'

import Cpu from './cpu'
import Op from './op'

describe('Cpu\'s core is working', () => {

    describe('Registers validity', () => {
        it('should have valid Gaeneral Purpouse registers', () => {
            let testRegisters = 10;
            const cpu = new Cpu({
                registers: testRegisters
            });
            for (let i = 0; i < testRegisters; i++) {
                expect(cpu.regs[`r${i}`].get()).to.equal(0);
            }
            expect(cpu.regs[`r${testRegisters}`]).to.be.undefined
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
            let regs = cpu.getArgs(['r0', 'r1', 'r2']);
            regs.a.set(0x7fffffff);
            regs.b.set(0x80000000);
            regs.c.set(regs.a.get() + regs.b.get());
            expect(regs.c.get()).to.equal(0xffffffff);
            cpu.regs.r2.set(cpu.regs.r2.get() + 0x101);
            expect(regs.c.get()).to.equal(0x100);
            expect(regs.c.get()).to.equal(cpu.regs.r2.get());
        });
    });


    it('throws error when can\'t recognize argument\s syntax', () => {
        const cpu = new Cpu({});
        expect(() => cpu.getArgs(['r0', 'pc', '{r1}'])).to.throw()
    });

    it('should throw error when no program provided', () => {
        const cpu = new Cpu({});
        expect(cpu.doStep).to.throw()
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
        let regs = cpu.getArgs(['#45']);
        expect(regs.a.get()).to.equal(45);
    });

    it('throws error when trying to save raw value', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['#45']);
        expect(() => regs.a.set(4)).to.throw();
    });

    it('negative values', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['r0']);
        regs.a.set(-1);
        expect(regs.a.get()).to.equal(0xffffffff)
    });

    describe('Inner memory operations', () => {
        const cpu = new Cpu({
            stackSize: 8
        });
        let arg = cpu.getArgs(['[sp, #-4]']);

        it('allows to save data on stack', () => {
            cpu.regs.sp.set(cpu.regs.sp.get() + 8);
            cpu.regs.r0.set(4);
            arg.a.set(5);
            expect(arg.a.get()).to.equal(5);
            arg.a.set(0);
        });

        it('allows to read and store value from/in inner memory', () => {
            arg.a.set(arg.a.get() + 5);
            expect(arg.a.get()).to.equal(5);
        })
    })

});

