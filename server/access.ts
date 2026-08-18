export type ProspectRole = "user" | "rep" | "manager" | "admin";

export function canReviewTeam(role: ProspectRole) {
  return role === "manager" || role === "admin";
}

export function canManageAssignments(role: ProspectRole) {
  return role === "admin";
}
