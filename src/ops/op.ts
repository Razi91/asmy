import { Arg } from '../cpu';

export default abstract class Op {
    args: Arg[] = [];

    abstract exe(): boolean;
}
