/**
 * Auth E2E tests — Login, Register, Google OAuth redirect, Logout
 * These tests run against the live dev server (npm run dev + backend).
 */

describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('renders the CircleRecs heading and form', () => {
    cy.contains('h1', 'CircleRecs').should('be.visible')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('contain.text', 'Sign in')
  })

  it('shows an error for invalid credentials', () => {
    cy.get('input[type="email"]').type('nobody@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('form').submit()
    // Should show an error message
    cy.get('[class*="error"]', { timeout: 5000 }).should('be.visible')
  })

  it('redirects logged-in users to dashboard when visiting /login', () => {
    cy.fixture('user').then((u) => {
      cy.login(u.email, u.password)
      cy.visit('/login')
      cy.url().should('not.include', '/login')
    })
  })

  it('has a link to the register page', () => {
    cy.contains('a', 'Sign up').should('have.attr', 'href', '/register')
  })

  it('has a Google sign-in button', () => {
    cy.contains('button', 'Continue with Google').should('be.visible')
  })
})

describe('Register page', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('renders all registration fields', () => {
    cy.get('input#displayName').should('exist')
    cy.get('input#username').should('exist')
    cy.get('input#email').should('exist')
    cy.get('input#password').should('exist')
    cy.get('input#confirm').should('exist')
  })

  it('shows a password mismatch error', () => {
    cy.get('input#displayName').type('New User')
    cy.get('input#username').type('newuser123')
    cy.get('input#email').type('new@example.com')
    cy.get('input#password').type('Pass1234!')
    cy.get('input#confirm').type('Mismatch999')
    cy.get('form').submit()
    cy.contains('Passwords do not match').should('be.visible')
  })

  it('has a link back to the login page', () => {
    cy.contains('a', 'Sign in').should('have.attr', 'href', '/login')
  })
})

describe('Protected route guard', () => {
  it('redirects unauthenticated users from / to /login', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('redirects unauthenticated users from /library to /login', () => {
    cy.visit('/library')
    cy.url().should('include', '/login')
  })
})
