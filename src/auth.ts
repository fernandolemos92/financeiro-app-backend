import { betterAuth } from "better-auth"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    cookieOptions: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3001",
    process.env.APP_URL || "http://localhost:3000",
  ],
  secret: process.env.BETTER_AUTH_SECRET,
})

export type Auth = typeof auth