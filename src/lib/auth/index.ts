import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "./email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    usePlural: false,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
    sendVerificationEmail,
  },
  user: {
    changeEmail: {
      enabled: true,
      sendVerificationEmail: true,
    },
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
})

export type Session = {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    role?: string
    phone?: string
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
}
