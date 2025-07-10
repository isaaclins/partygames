module.exports = {
  extends: ['./.eslintrc.js'],
  rules: {
    // Turn some errors into warnings for CI
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-namespace': 'warn',
    'react/no-unescaped-entities': 'warn',
    'no-console': 'warn',
    'curly': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Keep these as errors (critical issues)
    '@typescript-eslint/no-unused-expressions': 'error',
    'no-unreachable': 'error',
    'no-unused-labels': 'error',
    'no-constant-condition': 'error',
  }
}; 
