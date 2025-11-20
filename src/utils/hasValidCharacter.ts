export function hasValidCharacter(input: string): boolean {
  const allowed = /^[A-Za-z0-9 _-]+$/; // only allowed characters
  return allowed.test(input); // must contain ONLY allowed characters
}