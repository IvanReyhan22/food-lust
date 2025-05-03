import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/hono-adapter";
import { addMinutes } from "date-fns";
import { AuthToken, LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyOtpRequest } from "@/types/auth";

const jwtExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || "604800", 10);

// Mock email service (replace with actual implementation)
const sendEmail = async (to: string, subject: string, text: string) => {
    console.log(`Email sent to ${to} with subject: ${subject}`);
    console.log(`Content: ${text}`);
    return true;
};

export const generateAuthTokens = (userId: string, email: string, role: string): AuthToken => {
    const accessToken = sign(
        { id: userId, email, role },
        process.env.JWT_SECRET as string,
        { expiresIn: jwtExpiresIn }
    );

    const refreshToken = sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: jwtExpiresIn }
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };
};

export const verifyAuthToken = (token: string) => {
    try {
        return verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
        throw new ApiError("Invalid or expired token", 401);
    }
};

export const verifyRefreshToken = (token: string) => {
    try {
        return verify(token, process.env.REFRESH_TOKEN_SECRET as string);
    } catch (error) {
        throw new ApiError("Invalid or expired refresh token", 401);
    }
};

export const register = async (data: RegisterRequest) => {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { phone: data.phone }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === data.email) {
            throw new ApiError("Email already in use", 409);
        }
        if (existingUser.phone === data.phone) {
            throw new ApiError("Phone number already in use", 409);
        }
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            name: data.name,
            photoUrl: data.photoUrl,
        },
    });

    // Generate tokens
    const tokens = generateAuthTokens(user.id, user.email, user.role);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            photoUrl: user.photoUrl,
        },
        ...tokens,
    };
};

export const login = async (data: LoginRequest) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new ApiError("Invalid credentials", 401);
    }

    // Verify password
    const isPasswordValid = await compare(data.password, user.password);
    if (!isPasswordValid) {
        throw new ApiError("Invalid credentials", 401);
    }

    // Generate tokens
    const tokens = generateAuthTokens(user.id, user.email, user.role);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            photoUrl: user.photoUrl,
        },
        ...tokens,
    };
};

export const forgotPassword = async (email: string) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = addMinutes(new Date(), 5); // OTP expires in 5 minutes

    // Save OTP to user
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            otp,
            otpExpiry,
        },
    });

    // Send OTP via email
    await sendEmail(
        user.email,
        "Password Reset OTP",
        `Your OTP for password reset is: ${otp}. It will expire in 5 minutes.`
    );

    return {
        message: "OTP sent to your email",
    };
};

export const verifyOtp = async (data: VerifyOtpRequest) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Verify OTP
    if (!user.otp || user.otp !== data.otp) {
        throw new ApiError("Invalid OTP", 400);
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        throw new ApiError("OTP expired", 400);
    }

    // Generate reset token
    const resetToken = uuidv4();

    // Save reset token to user (in a real app, store with expiry etc.)
    // For simplicity, we'll use the same OTP field
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            otp: resetToken,
            otpExpiry: addMinutes(new Date(), 60), // Token expires in 60 minutes
        },
    });

    return {
        resetToken,
    };
};

export const resetPassword = async (data: ResetPasswordRequest) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Verify reset token
    if (!user.otp || user.otp !== data.resetToken) {
        throw new ApiError("Invalid reset token", 400);
    }

    // Check token expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        throw new ApiError("Reset token expired", 400);
    }

    // Hash new password
    const hashedPassword = await hash(data.newPassword, 10);

    // Update user password
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: hashedPassword,
            otp: null,
            otpExpiry: null,
        },
    });

    return {
        message: "Password reset successful",
    };
};

export const refreshToken = async (token: string) => {
    // Verify refresh token
    const payload = verifyRefreshToken(token) as { id: string };

    // Find user
    const user = await prisma.user.findUnique({
        where: {
            id: payload.id,
        },
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // Generate new tokens
    const tokens = generateAuthTokens(user.id, user.email, user.role);

    return tokens;
};