const addComponentText = 'Add a component'
const allFieldText = 'All field'

const assertValue = (fn) => {
  cy.get('visual-editor').should((v) => {
    const expectation = fn(JSON.parse(v.val()))
    return typeof expectation === 'boolean'
      ? expect(expectation).to.be.true
      : expectation
  })
}

const assertValueMatch = (key, value) => {
  return assertValue((v) => expect(v[0][key]).to.equals(value))
}

const assertValueNotMatch = (key, value) => {
  return assertValue((v) => expect(v[0][key]).to.not.equals(value))
}

const addBlock = () => {
  cy.get('@addComponent').click()
  cy.contains(allFieldText).click()
}

describe('Editor behaviour', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000/server/test.php')
    cy.contains(addComponentText).as('addComponent')
  })

  it('Should display the editor', () => {
    cy.get('@addComponent')
  })

  it('Should let me add a block', () => {
    addBlock()
    assertValue((v) => v.length === 1 && v[0]._name === 'demo')
  })

  it('Should let me fill a field', () => {
    addBlock()
    cy.contains('Text').click()
    cy.get('body').type('Hello world')
    assertValueMatch('text', 'Hello world')
  })

  it('Should not show the checkbox by default', () => {
    addBlock()
    cy.contains('Checkbox 1').should('not.exist')
    cy.contains('Checkbox').click({ force: true })
    cy.contains('Checkbox 1').should('exist')
    assertValueMatch('checkbox', true)
  })

  it('Should use tabs', () => {
    addBlock()
    cy.contains('label', 'Settings').should('not.exist')
    cy.contains('button', 'Settings').click()
    cy.contains('label', 'Settings').click()
    cy.get('body').type('Hello world')
    assertValueMatch('settings', 'Hello world')
  })

  describe('Select', () => {
    it('Should update the value when select change', () => {
      addBlock()
      cy.get('select').select('Option 2')
      assertValueMatch('select', '2')
    })
  })

  describe('Datepicker', () => {
    it('Should pick a date', () => {
      addBlock()
      assertValueMatch('date', '')
      cy.contains('label', 'Date').scrollIntoView().siblings().first().click()
      cy.contains('div', '17').click()
      assertValueNotMatch('date', '')
    })
  })

  describe('Repeater', () => {
    it('Should add one item and edit it', () => {
      addBlock()
      cy.contains('button', 'Add an item').click()
      cy.contains('label', 'Text 1').click()
      cy.get('body').type('Content #1')
      cy.contains('label', 'Text 2').click()
      cy.get('body').type('Content #2')
      cy.contains('label', 'Text 3').click()
      cy.get('body').type('Content #3')
      assertValue((v) => {
        expect(v[0].repeater[0].text1).equals('Content #1')
        expect(v[0].repeater[0].text2).equals('Content #2')
        expect(v[0].repeater[0].text3).equals('Content #3')
      })
      cy.contains('label', 'Text 3').click()
      cy.get('body').type(' edited')
      assertValue((v) => {
        expect(v[0].repeater[0].text1).equals('Content #1')
        expect(v[0].repeater[0].text2).equals('Content #2')
        expect(v[0].repeater[0].text3).equals('Content #3 edited')
      })
    })

    it('Should add one item and edit it', () => {
      addBlock()
      cy.contains('button', 'Add an item').click()
      cy.contains('button', 'Add an item').click()
      cy.contains('.ve-repeater-item', '#1').find('button.ve-btn-icon').first().click()
      cy.contains('label', 'Text 2').last().click()
      cy.get('body').type('Content #2')
      assertValue((v) => {
        expect(v[0].repeater[1].text2).equals('Content #2')
      })
    })
  })

  describe('HTML Editor', () => {
    it('inline content should not contain HTML', () => {
      addBlock()
      cy.contains('label', 'HTML One line').siblings().first().click()
      cy.get('body').type('Hello world')
      assertValueMatch('oneline', 'Hello world')
    })

    it('should insert strong with toolbar', () => {
      addBlock()
      cy.contains('label', 'HTML One line').siblings().first().click()
      cy.get('body').type('Hello world{selectall}')
      cy.contains('label', 'HTML One line').parent().find('[title="Bold"]').click()
      assertValueMatch('oneline', '<strong>Hello world</strong>')
    })

    it('should insert multiple paragraphs with toolbar', () => {
      addBlock()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Hello{enter}World')
      assertValueMatch(
        'multiline',
        '<p style="text-align: left;">Hello</p><p style="text-align: left;">World</p>'
      )
    })

    it('should apply heading H2 with toolbar dropdown', () => {
      addBlock()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Mon titre')
      cy.contains('.ve-htmltext-heading-btn', 'P').click()
      cy.contains('.ve-htmltext-heading-option', 'Heading 2').click()
      assertValue((v) => v[0].multiline?.includes('<h2>'))
    })

    it('should not show bold as active inside a heading', () => {
      addBlock()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Titre')
      cy.contains('.ve-htmltext-heading-btn', 'P').click()
      cy.contains('.ve-htmltext-heading-option', 'Heading 2').click()
      cy.get('[title="Bold"]').first().should('not.have.class', 've-active')
    })

    it('should create a blockquote with the toolbar', () => {
      addBlock()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Citation')
      cy.get('[title="Blockquote"]').click()
      assertValue((v) => v[0].multiline?.includes('<blockquote>'))
    })

    it.skip('should insert multiple paragraphs with toolbar and use align', () => {
      addBlock()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Hello World{selectall}')
      cy.get('.WysiwygToolbar button[title="Center"]').click()
      assertValueMatch(
        'multiline',
        '<p style="text-align: center">Hello World</p>'
      )
      cy.get('button[title="Left"]').click()
      assertValueMatch('multiline', '<p>Hello World</p>')
    })

    it.skip('should apply the right alignment depending of the default alignment', () => {
      addBlock()
      cy.contains('label', 'Text Align')
        .siblings()
        .find('input[title="Right"]')
        .click()
      cy.contains('label', 'HTML Multiline').siblings().first().click()
      cy.get('body').type('Hello World{selectall}')
      cy.get('.WysiwygToolbar button[title="Left"]').click()
      assertValueMatch(
        'multiline',
        '<p style="text-align: left">Hello World</p>'
      )
    })
  })

  describe('Copy/Paste', () => {
    it('should paste a copied block via synthetic paste event', () => {
      addBlock()
      assertValue((v) => v.length === 1)

      // Simulate a paste event with a valid block JSON on the sidebar
      cy.get('.ve-sidebar-blocs').trigger('paste', {
        clipboardData: {
          getData: (type) =>
            type === 'text/plain'
              ? JSON.stringify({ _name: 'demo', text: 'pasted' })
              : '',
        },
      })

      assertValue((v) => v.length === 2)
    })

    it('should not paste when active element is an input', () => {
      addBlock()
      // Focus an input field so the paste guard activates
      cy.contains('label', 'Text').click()
      cy.focused().trigger('paste', {
        clipboardData: {
          getData: (type) =>
            type === 'text/plain'
              ? JSON.stringify({ _name: 'demo', text: 'pasted' })
              : '',
        },
      })
      // Block count should remain 1 — paste was ignored
      assertValue((v) => v.length === 1)
    })
  })

  describe('Events', () => {
    it('should trigger close event on close', () => {
      cy.on('window:confirm', () => true)
      cy.document().then((el) => {
        el.querySelector('visual-editor').addEventListener(
          'close',
          cy.stub().as('close')
        )
      })
      addBlock()
      cy.get('[aria-label="Close"]').click()
      cy.get('@close').should('have.been.calledOnce')
    })

    it('should trigger change event on input', () => {
      cy.document().then((el) => {
        el.querySelector('visual-editor').addEventListener(
          'change',
          cy.stub().as('change')
        )
      })
      addBlock()
      cy.contains('label', 'Text').click()
      cy.get('body').type('c')
      cy.get('@change').should('have.been.calledTwice')
    })
  })
})
