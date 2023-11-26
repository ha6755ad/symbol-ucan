import {parseUcan, Ucan, SUPERUSER, Superuser, Capability, ResourcePointer} from '../ucans';
import {_get, _flatten} from '../utils';

export const checkAbilities = (ucan:string|Ucan, requiredCapabilities:any) => {
    const parsedUcan = typeof ucan === 'string' ? parseUcan(ucan) : ucan;
    const { payload: { att }} = parsedUcan;
};

export type AbilityTree = {
    'READ': Array<string>,
    'CREATE': Array<string>,
    'WRITE': Array<string>,
    '*': Array<string>
};
export const abilityTree: AbilityTree = {
    'READ': [],
    'CREATE': ['READ'],
    'WRITE': ['READ', 'CREATE'],
    '*': ['READ', 'WRITE', 'CREATE', 'DELETE']
};

//for determining the greates ability for a given namespace - for convenience of displaying only
export const greatestAbility = (abilities: Array<string | Array<string>> ): Array<string> => {
    let idx = 0;
    let greatest: Array<string> = [];
    const keys = Object.keys(abilityTree);
    abilities.forEach(ab => {
        const run = (val: string) => {
            const i = keys.indexOf(val);
            if (i >= idx) {
                idx = i;
                greatest = val.split(',');
            }
        };
        if (Array.isArray(ab)) {
            run(ab.join(','))
        } else run(ab);
    });
    return greatest
}

//create flat object with all 'with' segments being combined so that you have consolidated abilities
export const abilityObj = (capabilities:Array<Capability>) => {
    const obj:{[key:string]: any} = {};

    capabilities.forEach(cap => {
        const key = JSON.stringify(cap.with);
        //rule out superuser or set to superuser
        if (cap.can === SUPERUSER || obj[key] === SUPERUSER) {
            obj[key] = SUPERUSER;
        } else {
            //get absolute segment
            const namespaceKey = (cap.can.namespace || '12345:').split(':');
            let namespace = cap.can.namespace;
            if(_get(obj, [key, namespaceKey[0]])) namespace = namespaceKey[0];
            const segs = greatestAbility([_get(obj, [key, namespace]) || [], cap.can.segments]);
            //set the greatest ability for each namespace
            obj[key] ? obj[key][cap.can.namespace] = segs : obj[key] = { [cap.can.namespace]: segs };
        }
    });

    return obj;
}

//generate single capability with greatest ability for each unique with and namespace
export const flattenAbilityObj = (obj: { [key:string]:Superuser|{[key:string]:string[]} }):Array<Capability> => {
    const arrOfArr = Object.keys(obj).map((key) => {
        if (obj[key] === SUPERUSER) return {with: JSON.parse(key) as ResourcePointer, can: SUPERUSER};
        else {
            return (Object.entries(obj[key])).map(([k, v]) => {
                return {
                    with: JSON.parse(key) as ResourcePointer,
                    can: {namespace: k, segments: v as Array<string>}
                }
            })
        }
    });
    return _flatten(arrOfArr.map(a => Array.isArray(a) ? a : [a]) as Array<Capability[]|Array<Capability>>)
}
export const stackedAbilities = (capabilities: Array<Capability>) => {
    return flattenAbilityObj(abilityObj(capabilities));
};

// export const reduceForSuperuser = (capabilities: Array<Capability>) => {
//   const obj = abilityObj(capabilities);
//   return flattenAbilityObj(obj);
// };
//

//remove abilities from ucan
export const reduceAbilities = (reduce:Array<Capability>, capabilities:Array<Capability>):Array<Capability> => {
    const reduceList = Array.isArray(reduce) ? reduce : [reduce];
    const obj = abilityObj(capabilities);
    reduceList.forEach(cap => {
        const key1 = JSON.stringify(cap.with);
        if(cap.can === SUPERUSER) delete obj[key1];
        else {
            const key2 = cap.can.namespace;
            delete obj[key1][key2];
        }
    });
    return flattenAbilityObj(obj);
};

export const stackAbilities = (capabilities: Array<Capability>): Array<Capability> => {
    const arr = [...capabilities];
    capabilities.forEach((a: Capability) => {
        if (a.can !== SUPERUSER) {
            [...(abilityTree[a.can.segments.join('') as keyof AbilityTree] || []), a.can.segments.join('')].filter(a => !!a).forEach((s: string) => {
                arr.push({with: a.with, can: {namespace: _get(a, 'can.namespace', '') as string, segments: [s as string]}})
            })
        }
    })
    return Array.from(new Set(arr.map(a => JSON.stringify(a)))).map(a => JSON.parse(a));
}
