import Op from '../op'
import Cpu from '../cpu'

function add(cpu: Cpu, ...args : Op[]) {
    if (args.length < 2) {
        throw new Error('Require minimum 2 arguments')
    }
}
