const re = /{{\s([\w\.]+)\s}}/;

function filterState(address, state) {
    let mystate = state;
    address.forEach(function(a) {
        if (mystate.hasOwnProperty(a)) {
            mystate = mystate[a];
        } else {
            throw a + " is not a valid property of " + JSON.stringify(mystate);
        }
    });
    return mystate;
}

function ssplice(str: string, index: number, count: number, add: any): string {
    return str.slice(0, index) + add + str.slice(index + count);
}

function addressOf(s: string) {
    let match;
    if ((match = re.exec(s)) !== null) {
        return match[1].split(".");
    } else {
        return null;
    }
}

function expandString(s: string, state) {
    let match;
    let found = false;
    while ((match = re.exec(s)) !== null) {
        found = true;
        let address = match[1].split(".");
        s = ssplice(s, match.index, match[0].length, filterState(address, state));
    }
    if (found) {
        return s;
    }
    return null;
}

function expand(e, state) {
    if (e.nodeName === "#text") {
        let m = expandString(e.textContent, state);
        if (m !== null) {
            e.textContent = m;
        }
    }
    if (e.attributes !== undefined) {
        for (let i=0; i<e.attributes.length; i++) {
            let attr = e.attributes[i];
            if (attr.name.indexOf('data-repeat') === 0) {
                let parts = attr.name.split('-');
                if (parts.length !== 3) {
                    throw "Repeat format is data-repeat-[name]. Got " + attr.name;
                }
                let name = parts[2];
                let tpl = e.removeChild(e.firstElementChild);
                let address = addressOf(attr.value);
                if (address === null) {
                    throw attr.value + " doesn't contain an address.";
                }
                let childState = filterState(address, state);
                if ('forEach' in childState) {
                    childState.forEach(function(item, i) {
                        let cl = tpl.cloneNode(true);
                        let instanceState = {};
                        instanceState[name] = item;
                        instanceState["i"] = i;
                        expand(cl, instanceState);
                        e.appendChild(cl);
                    });
                } else {
                    Object.keys(childState).forEach(function(key) {
                        let cl = tpl.cloneNode(true);
                        let instanceState = {};
                        instanceState[name] = childState[key];
                        instanceState["key"] = key;
                        expand(cl, instanceState);
                        e.appendChild(cl);
                    });
                }
            } else {
                let m = expandString(attr.value, state);
                if (m !== null) {
                    e[attr.name] = m;
                }
            }
        }
    }
    for (let i=0; i<e.childNodes.length; i++) {
        expand(e.childNodes[i], state);
    }
}

export default Expand = expand;
