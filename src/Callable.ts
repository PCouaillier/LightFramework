import {Framework} from "./framework";

type InjectLambda<T> = (framework: Framework) => T;

export default interface Callable<T> {
    call: InjectLambda<T>;
}