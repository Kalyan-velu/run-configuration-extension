/**
 * Prettier configuration
 * Optimized for TypeScript + React + modern frontend teams
 * Focus: readability, minimal diffs, editor consistency
 */
/** @type {import("prettier").Config} */
export default {
  /** Core formatting */
  printWidth: 100,            // Prevents ugly wrapping while staying readable
  tabWidth: 2,                // Industry standard
  useTabs: false,             // Spaces > tabs for consistency
  semi: true,                 // Explicit is better than implicit
  singleQuote: true,          // Cleaner JS/TS
  quoteProps: 'as-needed',    // Avoid noisy object diffs
  trailingComma: 'all',       // Better git diffs
  bracketSpacing: true,       // { foo: bar }
  bracketSameLine: false,     // JSX closing bracket on new line
  arrowParens: 'always',      // Prevents ambiguity
  endOfLine: 'lf',             // Cross-platform consistency

  /** JSX / React */
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  /** Formatting behavior */
  proseWrap: 'preserve',      // Don’t reflow markdown unexpectedly
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',

  /** Performance & safety */
  requirePragma: false,
  insertPragma: false,
}
