import "dotenv/config"
import { auth } from "../auth"

async function seedUser() {
  const email = process.env.DEV_USER_EMAIL || "dev@example.com"
  const password = process.env.DEV_USER_PASSWORD || "devpassword123"

  console.log(`Creating dev user: ${email}`)

  try {
    const req = new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name: "Developer",
      }),
    })

    const res = await auth.handler(req)
    const data = await res.json()

    if (!res.ok) {
      if (data.error?.includes("already exists")) {
        console.log("User already exists")
        return
      }
      throw new Error(data.error || "Failed to create user")
    }

    console.log("User created successfully:", data.user?.email)
  } catch (err) {
    console.error("Failed to create user:", err)
    process.exit(1)
  }
}

seedUser()