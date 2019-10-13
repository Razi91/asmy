import { expect } from 'chai';
import 'mocha';
import Cpu from '../Cpu';
import { Ldr, Str } from './MemoryTransfer';

describe('Memory transfer', () => {
    it('Throws on invalid arguments', () => {
        const cpu = new Cpu({ program: 'nop' });
        expect(() => new Str(cpu, '', ['r0', '[r1, #4, r0]!'])).to.throw();
    });
    describe('Store data in inner memory', () => {
        it('Store memory, direct pointer', () => {
            const cpu = new Cpu({ program: 'nop' });
            cpu.regs.r0.set(512); // value
            cpu.regs.r1.set(256); // address
            const op = new Str(cpu, '', ['r0', '[r1]']);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.regs.r0.get()).to.be.equal(512);
            expect(cpu.regs.r1.get()).to.be.equal(256);
            expect(cpu.dataView.getUint32(256)).to.be.equal(512);
        });

        it('Store memory, byte', () => {
            const cpu = new Cpu({ program: 'nop' });
            cpu.regs.r0.set(64); // value
            cpu.regs.r1.set(256); // address
            const op = new Str(cpu, 'b', ['r0', '[r1]']);
            expect(cpu.regs.r0.get()).to.be.equal(64);
            expect(cpu.regs.r1.get()).to.be.equal(256);
            cpu.dataView.setUint32(256, 0xaaaaaaaa);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.dataView.getUint8(256)).to.be.equal(64);
        });

        it('Store memory, offset register', () => {
            const cpu = new Cpu({});
            cpu.regs.r0.set(512); // value
            cpu.regs.r1.set(256); // address
            cpu.regs.r2.set(4); // offset
            const op = new Str(cpu, '', ['r0', '[r1, r2]']);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.regs.r0.get()).to.be.equal(512);
            expect(cpu.regs.r1.get()).to.be.equal(256);
            expect(cpu.regs.r2.get()).to.be.equal(4);
            expect(cpu.dataView.getUint32(256 + 4)).to.be.equal(512);
        });

        it('Store memory, offset register + #imm', () => {
            const cpu = new Cpu({});
            cpu.regs.r0.set(512); // value
            cpu.regs.r1.set(256); // address
            cpu.regs.r2.set(4); // offset
            const op = new Str(cpu, '', ['r0', '[r1, r2, #128]']);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.regs.r0.get()).to.be.equal(512);
            expect(cpu.regs.r1.get()).to.be.equal(256);
            expect(cpu.regs.r2.get()).to.be.equal(4);
            expect(cpu.dataView.getUint32(256 + 4 + 128)).to.be.equal(512);
        });

        it('Store memory, offset register + #imm + pre-index increment', () => {
            const cpu = new Cpu({});
            cpu.regs.r0.set(512); // value
            cpu.regs.r1.set(256); // address
            const op = new Str(cpu, '', ['r0', '[r1, #4]!']);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.regs.r0.get()).to.be.equal(512);
            expect(cpu.regs.r1.get()).to.be.equal(256 + 4);
            expect(cpu.dataView.getUint32(256 + 4)).to.be.equal(512);
        });
    });
    describe('Load data from inner memory', () => {
        it('Loads dara directly from address', () => {
            const cpu = new Cpu({ program: 'nop' });
            cpu.regs.r0.set(512); // value
            cpu.regs.r1.set(256); // address
            cpu.dataView.setUint32(256, 512);
            const op = new Ldr(cpu, '', ['r0', '[r1]']);
            expect(() => op.exe()).to.not.throw();
            expect(cpu.regs.r0.get()).to.be.equal(512);
            expect(cpu.regs.r1.get()).to.be.equal(256);
        });
    });
});
