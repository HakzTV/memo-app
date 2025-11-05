export type AppUserRole = "admin" | "manager" | "employee";

export interface AppUser {
  name: string;
  email: string;
  phone: string;
  role: AppUserRole;
  verified: boolean;
  userId: string;
}
