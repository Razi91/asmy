import Op from './op';
import { Arg } from '../Arg';
import OpCodes, { OpCodesType } from '../OpCodes';

export default class Nop extends Op {
    args: Arg[] = [];

    constructor() {
        super();
    }

    exe() {
        return true;
    }
}

export function init(OpCodes: OpCodesType): void {
    OpCodes.register('nop', () => new Nop());
}
