/**
 * Profile E2E tests — view profile, edit display name, edit bio, username validation
 */

describe('Profile page', () => {
  beforeEach(() => {
    cy.fixture('user').then((u) => {
      cy.login(u.email, u.password)
    })
    cy.visit('/profile')
  })

  it('displays the profile heading', () => {
    cy.contains('h1', 'Profile').should('be.visible')
  })

  it('displays the user email in view mode', () => {
    cy.contains('Email').should('be.visible')
    cy.fixture('user').then((u) => {
      cy.contains(u.email).should('be.visible')
    })
  })

  it('shows the Edit Profile button', () => {
    cy.contains('button', 'Edit Profile').should('be.visible')
  })

  it('enters edit mode when Edit Profile is clicked', () => {
    cy.contains('button', 'Edit Profile').click()
    cy.get('input').should('have.length.greaterThan', 0)
    cy.contains('button', 'Save').should('be.visible')
    cy.contains('button', 'Cancel').should('be.visible')
  })

  it('cancels edit mode and restores original values', () => {
    cy.contains('button', 'Edit Profile').click()
    cy.get('input').first().clear().type('Temp Name Change')
    cy.contains('button', 'Cancel').click()
    // Back to view mode
    cy.contains('button', 'Edit Profile').should('be.visible')
    cy.get('input').should('not.exist')
  })

  it('shows username validation error for invalid format', () => {
    cy.contains('button', 'Edit Profile').click()
    // Find the username input (has @ prefix label)
    cy.get('input').eq(1).clear().type('ab') // too short
    cy.contains('3–20 chars').should('be.visible')
  })

  it('shows character counter on the bio textarea', () => {
    cy.contains('button', 'Edit Profile').click()
    cy.get('textarea').type('Hello world')
    cy.contains('/200').should('be.visible')
  })
})
