import { z } from "zod";

export const FoodSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2),
    description: z.string().min(5),
    price: z.coerce.number().positive(),
    imageUrl: z.string().url(),
    isAvailable: z.boolean().default(true),
    category: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type Food = z.infer<typeof FoodSchema>;

export const CreateFoodSchema = FoodSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateFoodRequest = z.infer<typeof CreateFoodSchema>;

export const UpdateFoodSchema = CreateFoodSchema.partial();
export type UpdateFoodRequest = z.infer<typeof UpdateFoodSchema>;

export const FoodQuerySchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    isAvailable: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(10),
    sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type FoodQuery = z.infer<typeof FoodQuerySchema>;

export interface FoodPaginatedResponse {
    items: Food[];
    meta: {
        currentPage: number;
        itemCount: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
    };
}