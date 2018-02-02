export default function NewElement(name: string, proto: {}) {
    let ep = Object.create(HTMLElement.prototype);
    Object.keys(proto).forEach(function (key) {
        ep[key] = proto[key];
    });
    document.registerElement(name, {prototype: ep});
}
