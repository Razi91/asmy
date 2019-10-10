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

    it('Executes real ARM pow code', () => {
        const program = [
            'pow:',
            '	mov	r2, #0',
            '	mov	r3, #1',
            '.L2:',
            '	cmp	r2, r1',
            '	blt	.L3',
            '	mov	r0, r3',
            '	bx	lr',
            '.L3:',
            '	mul	r3, r0, r3',
            '	add	r2, r2, #1',
            '	b	.L2',
            'end:'
        ].map(line => line.trim().replace(/\t/g, ' '));
        const cpu = new Cpu({
            program
        });
        cpu.regs.r0.set(2);
        cpu.regs.r1.set(10);
        cpu.regs.pc.set(0);
        cpu.regs.lr.set(cpu.getLabelPtr('end'));
        while (cpu.doStep());

        expect(cpu.regs.r0.get()).to.be.equal(1024);
    });

    it.skip('Executes real ARM rot13 code', () => {
        const program = [
            'rot13:',
            '	add	r1, r0, r1',
            '.L2:',
            '	cmp	r0, r1',
            '	bxeq	lr',
            '	ldrb	r3, [r0], #1',
            '	cmp	r3, #96',
            '	bls	.L2',
            '	cmp	r3, #110',
            '	addls	r3, r3, #13',
            '	subhi	r3, r3, #13',
            '	and	r3, r3, #255',
            '	strb	r3, [r0, #-1]',
            '	b	.L2',
            'end:'
        ].map(line => line.trim().replace(/\t/g, ' '));
        const cpu = new Cpu({
            program
        });
        const testString = 'lorem ipsum';
        const result = 'yberz vcfhz';
        const memoryStart = 1024;
        for (let i = 0; i < testString.length; i++) {
            cpu.dataView.setUint8(memoryStart + i, testString.charCodeAt(i));
        }
        cpu.regs.r0.set(memoryStart);
        cpu.regs.r1.set(testString.length);
        cpu.regs.pc.set(0);
        cpu.regs.lr.set(cpu.getLabelPtr('end'));
        while (cpu.doStep());

        for (let i = 0; i < testString.length; i++) {
            expect(cpu.dataView.getUint8(memoryStart + i)).to.be.equal(
                result.charCodeAt(i)
            );
        }
    });
});
