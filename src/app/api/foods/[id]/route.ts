import { NextRequest } from "next/server";
import { createHonoApp, errorHandler, handleHonoRequest, zodValidator } from "@/lib/hono-adapter";
import { deleteFood, getFoodById, updateFood } from "@/services/food-service";
import { UpdateFoodSchema } from "@/types/food";
import { authMiddleware, roleMiddleware } from "@/middleware/auth";
import { getValidData } from "@/helpers/common-helpers";
import { z } from "zod";

const app = createHonoApp();

// Get a food item by ID
app.get("/api/foods/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const result = await getFoodById(id);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

// Update a food item (admin only)
app.put("/api/foods/:id", authMiddleware, roleMiddleware(["ADMIN"]), zodValidator(UpdateFoodSchema), async (c) => {
    try {
        const id = c.req.param("id");
        const data = getValidData<z.infer<typeof UpdateFoodSchema>>(c)
        const result = await updateFood(id, data);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

// Patch a food item (admin only)
app.patch("/api/foods/:id", authMiddleware, roleMiddleware(["ADMIN"]), zodValidator(UpdateFoodSchema), async (c) => {
    try {
        const id = c.req.param("id");
        const data = getValidData<z.infer<typeof UpdateFoodSchema>>(c)
        const result = await updateFood(id, data);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

// Delete a food item (admin only)
app.delete("/api/foods/:id", authMiddleware, roleMiddleware(["ADMIN"]), async (c) => {
    try {
        const id = c.req.param("id");
        const result = await deleteFood(id);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

export const GET = handleHonoRequest(app);
export const PUT = handleHonoRequest(app);
export const PATCH = handleHonoRequest(app);
export const DELETE = handleHonoRequest(app);