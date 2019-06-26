import {expect} from 'chai';
import 'mocha'

import Cpu from './cpu'
import Op from './op'


describe('OpCode decoder', () => {
    it('decodes "nop" opcode correctly', () => {
        const cpu = new Cpu({});
        const nop = new Op('nop')
    });

    it('decodes arithmethic opcodes correctly', () => {
        const cpu = new Cpu({});
        const operations = ['add', 'sub', 'mul', 'div'];
        for(let op of operations) {
            new Op(`${op} r0, r0`)
        }
    });
});
