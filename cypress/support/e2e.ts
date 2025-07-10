// Import commands.js using ES2015 syntax:
import './commands'
import '@cypress/code-coverage/support'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Set up global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // we can log the error and continue if it's not critical
  console.log('Uncaught exception:', err.message)
  
  // Don't fail tests on these specific errors that might occur during development
  if (err.message.includes('ResizeObserver loop limit exceeded') ||
      err.message.includes('Non-Error promise rejection captured') ||
      err.message.includes('ChunkLoadError')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})

// Add custom viewport presets
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(390, 844) // iPhone 12/13/14 Pro
})

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024) // iPad
})

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720) // Desktop
}) 
