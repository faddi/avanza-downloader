import * as t from "https://esm.sh/io-ts@2.2.18";
import { PathReporter } from "https://esm.sh/io-ts@2.2.18/PathReporter";

export type Result<T> = { isError: false; result: T };

export function ok<T>(result: T): Result<T> {
  return { isError: false, result };
}

export interface ValidationError {
  isError: true;
  type: "failed-to-validate";
  raw: Record<string, unknown>;
  error: Record<string, unknown>;
}

export function validateType<T>(
  validator: t.Type<T> | t.ArrayType<t.Any, T>,
  obj: unknown
): Result<t.TypeOf<typeof validator>> | ValidationError {
  const r = validator.decode(obj);

  if (r._tag === "Right") {
    return ok(r.right);
  }

  return {
    isError: true,
    type: "failed-to-validate",
    raw: { data: obj },
    error: { errors: PathReporter.report(r) },
  };
}
