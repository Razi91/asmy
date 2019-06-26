import {expect} from 'chai';
import 'mocha'

import Cpu from './cpu'
import Op from './op'

describe('Cpu\'s core is working', () => {

    describe('Registers validity', () => {
        it('should have valid Gaeneral Purpouse registers', () => {
            let testRegisters = 10
            const cpu = new Cpu({
                registers: testRegisters
            });
            for (let i = 0; i < testRegisters; i++) {
                expect(cpu.regs[`r${i}`]).to.equal(0);
            }
            expect(cpu.regs[`r${testRegisters}`]).to.be.undefined
        });

        it('cut overflow value', () => {
            const cpu = new Cpu({});
            cpu.regs.r0 = 0xffffffff;
            expect(cpu.regs.r0).to.equal(0xffffffff);
            cpu.regs.r0 = 0xffffffff + 1;
            expect(cpu.regs.r0).to.equal(0);
        });

        it('can add 2 registers', () => {
            const cpu = new Cpu({});
            let regs = cpu.getArgs(['r0', 'r1', 'r2']);
            regs.a = 0x7fffffff;
            regs.b = 0x80000000;
            regs.c = regs.a + regs.b;
            expect(regs.c).to.equal(0xffffffff);
            cpu.regs.r2 += 0x101;
            expect(regs.c).to.equal(0x100);
            expect(regs.c).to.equal(cpu.regs.r2);
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
        const nop: Op = new Op('nop');
        const cpu = new Cpu({
            stackSize: 2 << 16,
            program: [nop, nop]
        });
        expect(cpu.regs.pc).to.equal(0);
        cpu.doStep();
        expect(cpu.regs.pc).to.equal(1);
    });

    it('returns valid raw value', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['#45']);
        expect(regs.a).to.equal(45);
    });

    it('throws error when trying to save raw value', () => {
        const cpu = new Cpu({});
        let regs = cpu.getArgs(['#45']);
        expect(() => regs.a = 4).to.throw();
    });

    describe('Inner memory operations', () => {
        const cpu = new Cpu({
            stackSize: 8
        });
        let arg = cpu.getArgs(['[sp, #-4]']);

        it('allows to save data on stack', () => {
            cpu.regs.sp += 8;
            cpu.regs.r0 = 4;
            arg.a = 0
        });

        it('allows to read and store value from/in inner memory', () => {
            arg.a = arg.a + 5;
            expect(arg.a).to.equal(5);
        })
    })

});

