import { Env, Hono } from "hono";
import { handle } from "hono/vercel";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { validator } from "hono/validator";
import type { Context, Next } from "hono";
import { z } from "zod";

export const createHonoApp = <E extends Env = any>() => {
    const app = new Hono<E>()
        // Add global middlewares
        .use(logger())
        .use(
            cors({
                origin: process.env.CORS_ORIGIN?.split(",") || "*",
                allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                allowHeaders: ["Content-Type", "Authorization"],
                exposeHeaders: ["Content-Length"],
                maxAge: 86400,
                credentials: true,
            })
        )
        .use(secureHeaders());

    return app;
};

export const handleHonoRequest = handle;

export { HTTPException };

export const zodValidator = <T extends z.ZodType>(schema: T) => {
    return async (c: any, next: any) => {
        /// get content type and headers method
        const contentType = c.req.header("Content-Type");
        const method = c.req.method;

        let target: "json" | "form" | "query";
        let value: unknown;

        /// get data source 
        if (contentType?.includes("application/json")) {
            target = "json";
            /// validate if data request is valid json format
            try {
                value = await c.req.json();
            } catch (e) {
                return c.json({
                    success: false,
                    message: "Invalid JSON payload",
                }, 400);
            }
        } else if (contentType?.includes("application/x-www-form-urlencoded") || contentType?.includes("multipart/form-data")) {
            target = "form";
            value = await c.req.parseBody();
        } else if (method === "GET") {
            target = "query";
            value = c.req.query();
        } else {
            /// invalid payload
            return c.json({
                success: false,
                message: "Invalid Data payload",
            }, 400);
        }

        // validate data based on schema
        const result = schema.safeParse(value);
        if (!result.success) {
            return c.json({
                success: false,
                message: "Validation failed",
                errors: result.error.errors,
            }, 400);
        }

        /// add the validated data to context
        c.set("data", result.data);
        await next();
    };
}

// export const zodValidator = <T extends z.ZodType>(
//     schema: T,
//     target: "json" | "form" | "query" = "json"
// ) => {
//     return validator(target, (value, c) => {
//         const result = schema.safeParse(value);
//         if (!result.success) {
//             return c.json(
//                 {
//                     success: false,
//                     message: "Validation failed",
//                     errors: result.error.errors,
//                 },
//                 400
//             );
//         }
//         return result.data;
//     });
// }

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number = 500) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export const errorHandler = (err: Error) => {
    console.error(err);

    if (err instanceof ApiError) {
        return Response.json(
            {
                success: false,
                message: err.message,
            },
            { status: err.status }
        );
    }

    if (err instanceof HTTPException) {
        return err.getResponse();
    }

    return Response.json(
        {
            success: false,
            message: "Internal Server Error",
        },
        { status: 500 }
    );
};