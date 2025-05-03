import { z } from "zod";

export const RegisterSchema = z.object({
    email: z.string().email(),
    phone: z.string().min(11).max(13),
    password: z.string().min(8),
    name: z.string().min(5),
    photoUrl: z.string().url().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;

export const VerifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

export type VerifyOtpRequest = z.infer<typeof VerifyOtpSchema>;

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
    resetToken: z.string(),
    newPassword: z.string().min(8),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

export const RefreshTokenSchema = z.object({
    refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;

export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}