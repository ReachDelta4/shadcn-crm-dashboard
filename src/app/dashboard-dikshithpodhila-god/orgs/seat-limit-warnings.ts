export type SeatBucket = "admins" | "managers" | "supervisors" | "users";

export type SeatLimits = Record<SeatBucket, number>;

export function findLoweredSeatLimits(currentUsage: SeatLimits, nextLimits: SeatLimits) {
  const roles: SeatBucket[] = ["admins", "managers", "supervisors", "users"];
  return roles
    .filter((role) => (nextLimits[role] ?? 0) < (currentUsage[role] ?? 0))
    .map((role) => ({
      role,
      current: currentUsage[role] ?? 0,
      next: nextLimits[role] ?? 0,
    }));
}

export function formatRole(role: SeatBucket) {
  switch (role) {
    case "admins":
      return "Admins";
    case "managers":
      return "Managers";
    case "supervisors":
      return "Supervisors";
    default:
      return "Users";
  }
}
