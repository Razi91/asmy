import { Arg } from '../Arg';
import Cpu from '../Cpu';

export default interface Op {
    exe(cpu?: Cpu): boolean;
}
