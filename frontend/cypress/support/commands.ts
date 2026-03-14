// Custom Cypress commands

/**
 * Login via the UI form (real HTTP request to the dev server).
 * The dev backend must be running on port 3000.
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('form').submit()
  // Wait for redirect away from /login
  cy.url().should('not.include', '/login')
})

/**
 * Login by seeding the Redux store via localStorage bypass so
 * tests don't depend on real API credentials.
 * Uses cy.request to get a real token, then visits the app.
 */
Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  cy.request('POST', 'http://localhost:3000/api/auth/login', { email, password }).then((resp) => {
    window.localStorage.setItem('__test_access_token__', resp.body.accessToken)
    cy.visit('/', {
      onBeforeLoad(win) {
        // The app calls refreshToken on mount; stub it here if needed
      },
    })
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginViaApi(email: string, password: string): Chainable<void>
    }
  }
}
