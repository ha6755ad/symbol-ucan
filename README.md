# Capabilities utils

Here are a number of useful utilities provided for managing lists of `attenuations` aka capabilities. 

UCAN is a beautifully unopinionated standard, but in order to make this more turn-key usable, we have had to opine. The possible `segments` supported by these utilities are `READ`, `WRITE`, `CREATE`, `DELETE` and superuser `*`. 

Some of these utilities are really just for the convenience of working with any sort of UI for these capabilities. 

### Ability Structure

```
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
```

### Utilities
- **********abilityObj(abilities: Array<Capability>):AbilityObj********** organizes a list of capabilities into an object keyed by the capability `with` stringified. Secondly each with space is organized into `namespace` keys. This allows object traversal of abilities for a given namespace. 

- **********(obj: { [key:string]:Superuser|{[key:string]:string[]} }):Array<Capability>********** simply flattens out an `AbilityObj` into an attenuations list

- **********stackedAbilities(abilities: Array<Capability>):Array<Capability>********** calls abilityObj and flattenAbilityObj to dedup a list of Capabilities. 

- **********reduceAbilities(reduce: Array<Capability>, abilities: Array<Capability>):Array<Capability>********** where the first argument is Capabilities you want to remove from a list of Capabilities. Returns the reduced Capability list. 

- **********stackAbilities(abilities: Array<Capability>):Array<Capability>********** could almost seem redundant to `stackedAbilities` **!!except!!** there is an important functionality within UCANs that needs to be considered. If you consider that giving someone `WRITE` ability would normally assume `READ` and `CREATE` as well. However, there is no such etymology within the UCAN functions. That's where we opine. If you stack abilities, all lesser abilities will be added to each namespace that has a greater ability. So it lengthens the total list of Capabilities to match how UCAN `verify` functions. This way, for UI purposes, you only need the greatest possible ability to know all abilities. Of course UCAN is far more extensible than this, but this is a sound, time-tested, and simple approach to handling permissions. It only limits you inasmuch as you use these utilities - you can still do anything you wish with your UCAN implementation. 
