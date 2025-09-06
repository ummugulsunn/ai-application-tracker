import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
    }
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firstName: string
    lastName: string
  }
}