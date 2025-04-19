// Matches any value JSON.stringify can handle losslessly
/**
 * Represents any value that can be handled by JSON.stringify without loss.
 * This includes primitive types such as strings, numbers, booleans, and null.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON-compatible value, which can be a primitive,
 * an array of Jsonifiable values, or an object with string keys
 * and Jsonifiable values.
 */
export type Jsonifiable =
  | JsonPrimitive
  | Jsonifiable[]
  | { [key: string]: Jsonifiable };

// Require at least one of the specified Keys from T
/**
 * A utility type that requires at least one of the specified keys from type T.
 * This is useful for creating types that enforce the presence of certain properties
 * while allowing others to be optional.
 *
 * @template T - The base type from which keys are required.
 * @template Keys - The keys of T that are required.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[Keys] &
  Omit<T, Keys>;
