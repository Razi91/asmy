import Op from '../op';
import { Arg } from '../cpu';

export default class Nop extends Op {
    args: Arg[] = [];

    constructor() {
        super();
    }

    exe() {
        return true;
    }
}
