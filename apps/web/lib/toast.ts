import { toast as sonnerToast } from "sonner";
import { ApiError } from "@/lib/api";

export const toast = {
  success(message: string) {
    sonnerToast.success(message);
  },
  error(message: string) {
    sonnerToast.error(message);
  },
  fromError(e: unknown, fallback = "Something went wrong.") {
    if (e instanceof ApiError) toast.error(e.message);
    else toast.error(fallback);
  },
};
