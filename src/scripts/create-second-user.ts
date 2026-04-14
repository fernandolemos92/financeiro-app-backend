import "dotenv/config"
import { auth } from "../auth"

async function createSecondUser() {
  const email = process.env.SECOND_DEV_USER_EMAIL || "art2@dev.com"
  const password = process.env.SECOND_DEV_USER_PASSWORD || "art2password123"

  console.log(`Creating second dev user: ${email}`)

  try {
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name: "Developer 2",
      }),
    })

    const res = await auth.handler(req)
    const data = await res.json()

    if (!res.ok) {
      if (typeof data?.error === "string" && data.error.includes("already exists")) {
        console.log("Second user already exists")
        return
      }

      throw new Error(data?.error || "Failed to create second user")
    }

    console.log("Second user created successfully:", data?.user?.email)
  } catch (err) {
    console.error("Failed to create second user:", err)
    process.exit(1)
  }
}

createSecondUser()