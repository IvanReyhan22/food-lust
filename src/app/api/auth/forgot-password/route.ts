import { createHonoApp, errorHandler, handleHonoRequest, zodValidator } from "@/lib/hono-adapter";
import { forgotPassword } from "@/services/auth-service";
import { ForgotPasswordSchema } from "@/types/auth";

const app = createHonoApp();

app.post("/api/auth/forgot-password", zodValidator(ForgotPasswordSchema), async (c) => {
    try {
        const { email } = c.req.valid("json");
        const result = await forgotPassword(email);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

export const POST = handleHonoRequest(app);