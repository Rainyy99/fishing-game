// Lets Node load the game's TypeScript files, which import each other without extensions.
export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[mc]?[jt]s$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // fall through to the normal lookup
    }
  }
  return nextResolve(specifier, context);
}
