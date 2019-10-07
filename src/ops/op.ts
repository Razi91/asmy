import { Arg } from '../Arg';

export default abstract class Op {
    args: Arg[] = [];

    abstract exe(): boolean;
}
