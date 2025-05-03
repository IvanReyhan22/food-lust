import { z } from "zod";
import { createHonoApp, errorHandler, handleHonoRequest, zodValidator } from "@/lib/hono-adapter";
import { createFood, getAllFoods } from "@/services/food-service";
import { CreateFoodSchema, FoodQuerySchema } from "@/types/food";
import { authMiddleware, roleMiddleware } from "@/middleware/auth";
import { getValidData } from "@/helpers/common-helpers";

const app = createHonoApp();

// get all foods, filtering, pagination and sorting
app.get("/api/foods", async (c) => {
    try {
        const queryParams = Object.fromEntries(new URL(c.req.url).searchParams);

        // Parse and validate query parameters
        const parsedQuery = FoodQuerySchema.parse({
            ...queryParams,
            page: queryParams.page ? parseInt(queryParams.page as string) : undefined,
            limit: queryParams.limit ? parseInt(queryParams.limit as string) : undefined,
            minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice as string) : undefined,
            maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice as string) : undefined,
            isAvailable: queryParams.isAvailable ? queryParams.isAvailable === 'true' : undefined,
        });

        const result = await getAllFoods(parsedQuery);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return errorHandler(error as Error);
    }
});

// Create a new food item (admin only)
app.post("/api/foods", authMiddleware, roleMiddleware(["ADMIN"]), zodValidator(CreateFoodSchema), async (c) => {
    try {
        const data = getValidData<z.infer<typeof CreateFoodSchema>>(c);
        const result = await createFood(data);

        return c.json({
            success: true,
            data: result,
        }, 201);
    } catch (error) {
        return errorHandler(error as Error);
    }
});

export const GET = handleHonoRequest(app);
export const POST = handleHonoRequest(app);