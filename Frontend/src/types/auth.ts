export type UserRole = "ADMIN" | "PRINCIPAL" | "HOD" | "PLACEMENT" | "STUDENT"

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: UserRole
  college?: string
  department?: string
  profile_photo?: string
}

export interface Session {
  user: User
  accessToken?: string
  provider?: string
  expiresAt?: number
}

export interface OAuthProvider {
  name: string
  clientId: string
  clientSecret: string
}
