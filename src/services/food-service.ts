import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/hono-adapter";
import { CreateFoodRequest, FoodQuery, UpdateFoodRequest } from "@/types/food";

export const createFood = async (data: CreateFoodRequest) => {
    try {
        const food = await prisma.food.create({
            data,
        });

        return food;
    } catch (error) {
        console.error("Error creating food:", error);
        throw new ApiError("Failed to create food item");
    }
};

export const getFoodById = async (id: string) => {
    const food = await prisma.food.findUnique({
        where: { id },
    });

    if (!food) {
        throw new ApiError("Food item not found", 404);
    }

    return food;
};

export const updateFood = async (id: string, data: UpdateFoodRequest) => {
    // Check if food exists
    await getFoodById(id);

    try {
        const updatedFood = await prisma.food.update({
            where: { id },
            data,
        });

        return updatedFood;
    } catch (error) {
        console.error("Error updating food:", error);
        throw new ApiError("Failed to update food item");
    }
};

export const deleteFood = async (id: string) => {
    // Check if food exists
    await getFoodById(id);

    try {
        await prisma.food.delete({
            where: { id },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting food:", error);
        throw new ApiError("Failed to delete food item");
    }
};

export const getAllFoods = async (query: FoodQuery) => {
    const {
        category,
        search,
        minPrice,
        maxPrice,
        isAvailable,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;

    // Build the where clause based on query parameters
    const where: any = {};

    if (category) {
        where.category = category;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};

        if (minPrice !== undefined) {
            where.price.gte = minPrice;
        }

        if (maxPrice !== undefined) {
            where.price.lte = maxPrice;
        }
    }

    if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
    }

    // Get total count
    const totalItems = await prisma.food.count({ where });

    // Get items
    const items = await prisma.food.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
        items,
        meta: {
            currentPage: page,
            itemCount: items.length,
            itemsPerPage: limit,
            totalItems,
            totalPages,
        },
    };
};