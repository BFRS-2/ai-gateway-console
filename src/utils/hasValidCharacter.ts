export function hasValidCharacter(input: string): boolean {
  const allowed = /^(?=.*[A-Za-z])[A-Za-z0-9 ]+$/;
  return allowed.test(input);
}
