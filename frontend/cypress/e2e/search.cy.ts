/**
 * Search E2E tests — type toggle, debounced search, add to library modal
 */

describe('Search page', () => {
  beforeEach(() => {
    cy.fixture('user').then((u) => {
      cy.login(u.email, u.password)
    })
    cy.visit('/search')
  })

  it('renders type toggle buttons', () => {
    cy.contains('button', 'Books').should('be.visible')
    cy.contains('button', 'Movies').should('be.visible')
    cy.contains('button', 'TV Shows').should('be.visible')
  })

  it('shows placeholder text before typing', () => {
    cy.get('input[type="text"]').should('have.attr', 'placeholder').and('include', 'books')
  })

  it('switches placeholder when type changes', () => {
    cy.contains('button', 'Movies').click()
    cy.get('input[type="text"]').should('have.attr', 'placeholder').and('include', 'movies')
  })

  it('shows "type at least 2 characters" hint on empty query', () => {
    cy.contains('Type at least 2 characters').should('be.visible')
  })

  it('shows results for a book search (Books API)', () => {
    cy.contains('button', 'Books').click()
    cy.get('input[type="text"]').type('Harry Potter')
    // Wait for debounce (400ms) + API response
    cy.get('[class*="result"], [class*="card"]', { timeout: 6000 }).should('have.length.greaterThan', 0)
  })

  it('shows no results message for an unmatched query', () => {
    cy.get('input[type="text"]').type('xzxzxzunlikelymatch9999')
    cy.contains('No results found', { timeout: 5000 }).should('be.visible')
  })

  it('opens the add-entry modal when clicking Add on a result', () => {
    cy.contains('button', 'Books').click()
    cy.get('input[type="text"]').type('Harry Potter')
    cy.contains('button', 'Add', { timeout: 6000 }).first().click()
    // Modal appears
    cy.contains('Add to Library').should('be.visible')
    cy.contains('button', 'Want to read/watch').should('be.visible')
  })

  it('closes the modal on background click', () => {
    cy.contains('button', 'Books').click()
    cy.get('input[type="text"]').type('Harry Potter')
    cy.contains('button', 'Add', { timeout: 6000 }).first().click()
    // Click the backdrop (outside the modal card)
    cy.get('[class*="backdrop"], [class*="overlay"]').click({ force: true })
    cy.contains('Add to Library').should('not.exist')
  })
})
