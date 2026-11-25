export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  meta?: {
    imported?: number;
    skipped?: number;
  };
};

export const idleState: ActionState = { status: "idle" };

export function errorState(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors };
}

export function successState(
  message?: string,
  meta?: { imported?: number; skipped?: number },
): ActionState {
  return { status: "success", message, meta };
}
