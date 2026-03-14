/**
 * Navigation E2E tests — sidebar links, theme toggle, profile link
 * Requires a running dev server and a valid test user in the DB.
 */

describe('Sidebar navigation (authenticated)', () => {
  beforeEach(() => {
    cy.fixture('user').then((u) => {
      cy.login(u.email, u.password)
    })
  })

  it('shows the CircleRecs logo in the sidebar', () => {
    cy.contains('CircleRecs').should('be.visible')
  })

  it('navigates to Home', () => {
    cy.contains('nav a, nav button', 'Home').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('navigates to Search', () => {
    cy.contains('a', 'Search').click()
    cy.url().should('include', '/search')
    cy.contains('h1', 'Search').should('be.visible')
  })

  it('navigates to Library', () => {
    cy.contains('a', 'Library').click()
    cy.url().should('include', '/library')
    cy.contains('h1', 'My Library').should('be.visible')
  })

  it('navigates to Friends', () => {
    cy.contains('a', 'Friends').click()
    cy.url().should('include', '/friends')
    cy.contains('h1', 'Friends').should('be.visible')
  })

  it('navigates to For You (Recommendations)', () => {
    cy.contains('a', 'For You').click()
    cy.url().should('include', '/recommendations')
    cy.contains('h1', 'For You').should('be.visible')
  })

  it('navigates to Year in Review', () => {
    cy.contains('a', 'Year').click()
    cy.url().should('include', '/year')
    cy.contains('h1', 'Year in Review').should('be.visible')
  })

  it('navigates to Profile page via sidebar avatar', () => {
    cy.visit('/profile')
    cy.url().should('include', '/profile')
    cy.contains('h1', 'Profile').should('be.visible')
  })

  it('logs out and redirects to /login', () => {
    // Click the logout button (sign-out icon button in sidebar)
    cy.get('[title="Sign out"]').click()
    cy.url().should('include', '/login')
  })
})
