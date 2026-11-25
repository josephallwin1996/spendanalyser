import { revalidatePath } from "next/cache";

const APP_PATHS = ["/dashboard", "/transactions", "/budgets", "/insights", "/settings"];

/** Expense data is shown on several pages, so invalidate all of them after a mutation. */
export function revalidateApp() {
  for (const path of APP_PATHS) {
    revalidatePath(path);
  }
}
