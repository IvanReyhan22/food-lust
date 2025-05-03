export const getValidData = <T>(c: any): T => {
    return c.get("data") as T;
};