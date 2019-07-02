import Op from "../op";
import {CpuRegs} from "../cpu";

export default class Nop extends Op {
    args: CpuRegs = {};

    constructor() {
        super();
    }


    exe() {
        return
    };

}
