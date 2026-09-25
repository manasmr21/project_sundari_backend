import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

export function handleValidationError(
    result: z.ZodSafeParseResult<unknown>
) {
    if (result.success) return;

    const hasMissingField = result.error.issues.some(
        (issue) =>
            issue.message.includes("received undefined")
    );

    if (hasMissingField) {
        throw new HTTPException(400, {
            message: "Some fields are missing",
        });
    }

    throw new HTTPException(400, {
        message: "Invalid request data",
    });
}