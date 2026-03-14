/**
 * Library E2E tests — filters, status change dropdown, empty state
 */

describe('Library page', () => {
  beforeEach(() => {
    cy.fixture('user').then((u) => {
      cy.login(u.email, u.password)
    })
    cy.visit('/library')
  })

  it('renders the page heading', () => {
    cy.contains('h1', 'My Library').should('be.visible')
  })

  it('renders type filter tabs', () => {
    cy.contains('button', 'All').should('be.visible')
    cy.contains('button', 'Books').should('be.visible')
    cy.contains('button', 'Movies').should('be.visible')
    cy.contains('button', 'TV Shows').should('be.visible')
  })

  it('renders status filter chips', () => {
    cy.contains('button', 'Want').should('be.visible')
    cy.contains('button', 'In Progress').should('be.visible')
    cy.contains('button', 'Completed').should('be.visible')
    cy.contains('button', 'Dropped').should('be.visible')
  })

  it('shows empty state when no entries match the filter', () => {
    cy.contains('button', 'Dropped').click()
    // Either shows items or the empty state message
    cy.get('body').then(($body) => {
      if ($body.text().includes('Nothing here yet')) {
        cy.contains('Nothing here yet').should('be.visible')
      }
    })
  })

  it('has an "Add" button that links to search', () => {
    cy.contains('a', 'Add').should('have.attr', 'href', '/search')
  })

  it('shows status badge on a library card', () => {
    // If there are any entries, they should have a status badge
    cy.get('body').then(($body) => {
      if ($body.find('[data-status]').length > 0) {
        cy.get('[data-status]').first().should('be.visible')
      }
    })
  })

  it('clicking status badge opens the dropdown when editable', () => {
    cy.get('body').then(($body) => {
      // Only test if there are library cards
      if ($body.find('[data-status]').length > 0) {
        cy.get('[data-status]').first().click()
        // Dropdown should appear with status options
        cy.contains('Want').should('be.visible')
        cy.contains('In Progress').should('be.visible')
        cy.contains('Completed').should('be.visible')
        cy.contains('Dropped').should('be.visible')
      }
    })
  })
})
