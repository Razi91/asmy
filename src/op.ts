import Cpu from './cpu'

const ops: {
    [key: string]: (args: Op[]) => void,
} = {
    nop(args: Op[] = []) {
    },
    add(args: Op[] = []) {

    }
};

class Op {
    exe: (args: Op[]) => void;

    constructor(public code: string) {
        if (code === 'nop') {
            this.exe = ops.nop;
        } else if (code.startsWith('add')) {
            this.exe = ops.add;
        } else {
            throw new Error(`Unknown instruction [${code}]`);
        }
    }
}

export default Op
