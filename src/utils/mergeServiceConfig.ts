export function mergeWithSchemaInitial<T extends object>(initial: T, saved?: Partial<T>): T {
  if (!saved) return structuredClone(initial) as T;

  // deep merge (preserve shape from initial, override with saved where present)
  const deepMerge = (base: any, over: any): any => {
    if (Array.isArray(base)) {
      // if saved array provided use it, else keep base
      return Array.isArray(over) ? over : base;
    }
    if (base && typeof base === "object") {
      const out: any = Array.isArray(base) ? [] : { ...base };
      for (const k of Object.keys(base)) {
        out[k] = deepMerge(base[k], over?.[k]);
      }
      // also include any new keys present only in saved
      if (over && typeof over === "object") {
        for (const k of Object.keys(over)) {
          if (!(k in out)) out[k] = over[k];
        }
      }
      return out;
    }
    return over ?? base;
  };

  return deepMerge(initial, saved) as T;
}
