import {Framework, Root} from './framework';

export class Controller {
    private framework: Framework;

    constructor () {
        this.framework = Root.newScope();
    }
}
