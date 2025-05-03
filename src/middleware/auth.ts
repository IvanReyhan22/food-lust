import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifyAuthToken } from "@/services/auth-service";
import { JwtPayload } from "@/types/auth";

declare module "hono" {
    interface ContextVariableMap {
        user: {
            id: string;
            email: string;
            role: string;
        };
    }
}

// Authentication middleware
export const authMiddleware = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new HTTPException(401, { message: "Authentication required" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAuthToken(token) as JwtPayload;

        c.set("user", {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });

        await next();
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }

        console.log("error" + error)
        throw new HTTPException(401, { message: "Invalid or expired token" });
    }
});

// Role-based access control middleware
export const roleMiddleware = (roles: string[]) => {
    return createMiddleware(async (c, next) => {
        try {
            const user = c.get("user");

            if (!user) {
                throw new HTTPException(401, { message: "Authentication required" });
            }

            if (!roles.includes(user.role)) {
                throw new HTTPException(403, { message: "Access forbidden" });
            }

            await next();
        } catch (error) {
            if (error instanceof HTTPException) {
                throw error;
            }
            throw new HTTPException(500, { message: "Internal server error" });
        }
    })
}