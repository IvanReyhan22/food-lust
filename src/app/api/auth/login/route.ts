import { getValidData } from "@/helpers/common-helpers";
import { createHonoApp, errorHandler, handleHonoRequest, zodValidator } from "@/lib/hono-adapter";
import { login } from "@/services/auth-service";
import { LoginSchema } from "@/types/auth";
import { z } from 'zod';

const app = createHonoApp();

app.post("/api/auth/login", zodValidator(LoginSchema), async (c) => {
    try {
        const data = getValidData<z.infer<typeof LoginSchema>>(c);
        const result = await login(data);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

export const POST = handleHonoRequest(app);
