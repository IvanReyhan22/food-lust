import { getValidData } from "@/helpers/common-helpers";
import { createHonoApp, errorHandler, handleHonoRequest, zodValidator } from "@/lib/hono-adapter";
import { register } from "@/services/auth-service";
import { RegisterSchema } from "@/types/auth";
import { z } from "zod";

const app = createHonoApp();

app.post("/api/auth/register", zodValidator(RegisterSchema), async (c) => {
    try {
        const data = getValidData<z.infer<typeof RegisterSchema>>(c);
        const result = await register(data);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

export const POST = handleHonoRequest(app);