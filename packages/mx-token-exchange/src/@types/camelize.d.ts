// Converts snake-case properties to camel-case in types.
// From StackOverflow: https://stackoverflow.com/a/63715429

type CamelizeString<T extends PropertyKey, C extends string = ""> = T extends string
    ? string extends T
        ? string
        : T extends `${infer F}_${infer R}`
        ? CamelizeString<Capitalize<R>, `${C}${F}`>
        : `${C}${T}`
    : T;

export type Camelize<T> = { [K in keyof T as CamelizeString<K>]: T[K] };
