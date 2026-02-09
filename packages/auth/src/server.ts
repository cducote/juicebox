import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@juicebox/db";

/**
 * Get the current Clerk user's corresponding database record.
 * Returns null if not authenticated or user not found in DB.
 */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.user.findUnique({
    where: { clerkId: userId },
  });
}

/**
 * Get the current DB user or throw 401.
 * Use in server actions / route handlers that require authentication.
 */
export async function requireUser() {
  const user = await getDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Get the current DB user and verify they're ADMIN or EMPLOYEE.
 * Throws 403 if they're a customer.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "EMPLOYEE") {
    throw new Error("Forbidden");
  }
  return user;
}

export { auth, currentUser };
