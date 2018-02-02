import Framework from 'src/framework';
// import NewElement from 'google template/NewElement';

let f = new Framework();

f.addService('hello', () => new Promise(a => {
    setTimeout(()=>a(Math.random()), 500);
}));

f.addService('world', () => new Promise(a => {
    setTimeout(()=>a(Math.random()), 500);
}));

f.addScoped('scope', () => new Promise(resolve => {
    setTimeout(()=>resolve(Math.random()), 800);
}));
(() => {
    f.cla(
        [
            'hello',
            'world',
        ],
        function add(a, b) {
            Promise.all(
                [
                    a,
                    b
                ])
                .then(res => {
                    console.log(res[0]);
                    console.log(res[1])
                });
        }
    );
})();

(() => {
    const begin = new Date();
    f.inject('hello')
        .then(a=> {
            console.log(new Date() - begin, "  ", a);
            return f.inject('hello')
        })
        .then(a => console.log(new Date() - begin, "  ", a));
})();

(() => {
    const begin = new Date();
    f.inject('scope')
        .then(a=> {
            console.log(new Date() - begin, "  ", a);
            return f.inject('scope')
        })
        .then(a => console.log(new Date() - begin, "  ", a));
})();

(() => {
    let f = new Framework();

    f.addConst('aze', 'aze');
    f.addConst('bbb', 'bbb');
    f.addConst('11', 11);
    f.addConst('3', 3);
    f.addService('ok', () => Promise.resolve({status: "Ok"}));
    f.addService('waitLong', () => new Promise(resolve => setTimeout(() => resolve(), 4000)));
    f.addService('reject', () => new Promise((_resolve, reject) => setTimeout(() => reject(), 4000)));
    f.addConst('13', 13);

    f.classWait(['AZE', 'ok', '3', 'waitLong'],
        class MyApp {
            constructor(str, one, ok, tree) {
                console.log("constructor");
                console.log({str: str, one: one, ok: ok, tree: tree});
                console.log();
            }
        }
    ).then(() => f.classWait(['BBB', '11', 'ok', '13'], console.log));

    f.cla(['BBB', '11', 'ok', '13'], console.log);
})();

(() => {
    let f = new Framework();

    f.addConst('aze', 'aze');
    f.addConst('BBB', 'bbb');
    f.addConst('1', 1);
    f.addService('ok', () => Promise.resolve({status: "Ok"}));
    f.addService('waitLong', () => new Promise(resolve => setTimeout(() => resolve(), 4000)));
    f.addService('reject', () => new Promise((_resolve, reject) => setTimeout(() => reject(), 4000))
            .catch(()=>Promise.resolve({status: 'rejected'}))
        );
    f.addConst('13', 13);

    f.classWait(['AZE', '1', 'ok', 'BBB', 'waitLong'],
        class MyApp {
            constructor(str, one, ok, tree) {
                console.log("constructor");
                console.log({str: str, one: one, ok: ok, tree: tree});
                console.log();
            }
        }
    );
})();
