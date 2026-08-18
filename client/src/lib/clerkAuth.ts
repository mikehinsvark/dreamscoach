export async function getClerkAuthorizationHeader(
  getToken: () => Promise<string | null>,
): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
