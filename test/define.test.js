const assert = require('chai').assert;

describe('amd', function() {

    it('should define', function () {
       define('test1', ['test2'], function(require, exports, test2) {
           Object.defineProperty(exports, "__esModule", { value: true });
           exports.default = class test1 {
               constructor()
               {
                   this.test2 = new test2.default();
               }
           };
       });
        define('test2', [], function(require, exports) {
            Object.defineProperty(exports, "__esModule", { value: true });
            exports.default = class test2 {
                constructor()
                {
                    this.test2 = true;
                }
            };
        });
        assert.isEmpty(amd.dependencies);
        let Test1 = amd.doneDependencies['test1'].default;
        assert.isTrue(new Test1().test2.test2)
    });
});
