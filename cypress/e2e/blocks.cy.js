const addBlock = (title) => {
  cy.get('@addComponent').click()
  cy.contains('.ve-bloc-item', title).click()
}

const assertValue = (fn) => {
  cy.get('visual-editor').should((v) => {
    fn(JSON.parse(v.val()))
  })
}

const assertTwigRender = (name, data = {}) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:8000/server/preview-twig.php',
    body: { _name: name, preview: true, ...data },
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body).not.to.contain('Template manquant')
  })
}

describe('Built-in blocks', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000/server/blocks-test.php')
    cy.contains('Add a component').as('addComponent')
  })

  // ── Text ─────────────────────────────────────────────────────────────────

  it('simple-text: can add and shows Content field', () => {
    addBlock('Simple text')
    assertValue((v) => {
      expect(v[0]._name).to.equal('simple-text')
      expect(v[0].content).to.be.a('string')
    })
    cy.contains('label', 'Content').should('exist')
    assertTwigRender('simple-text', { content: '<p>Test</p>' })
  })

  // ── Button ────────────────────────────────────────────────────────────────

  it('button: can add and edit URL', () => {
    addBlock('Button')
    assertValue((v) => expect(v[0]._name).to.equal('button'))
    cy.contains('label', 'Button URL').click()
    cy.get('body').type('{selectall}https://example.com')
    assertValue((v) => expect(v[0].url).to.equal('https://example.com'))
    assertTwigRender('button', { url: 'https://example.com', label: 'Click me' })
  })

  // ── Images ────────────────────────────────────────────────────────────────

  it('simple-image: can add and shows Image URL field', () => {
    addBlock('Simple image')
    assertValue((v) => expect(v[0]._name).to.equal('simple-image'))
    cy.contains('label', 'Image URL').should('exist')
    cy.contains('label', 'Alt text (SEO)').should('exist')
    assertTwigRender('simple-image', {
      image: 'https://picsum.photos/800/600',
      alt: 'Test image',
    })
  })

  it('gallery-images: can add item and edit', () => {
    addBlock('Image gallery')
    assertValue((v) => expect(v[0]._name).to.equal('gallery-images'))
    cy.contains('button', 'Add an image').click()
    cy.contains('label', 'Image URL').should('exist')
    assertTwigRender('gallery-images', {
      images: [{ image: 'https://picsum.photos/800/600', alt: 'Test' }],
    })
  })

  // ── Video ─────────────────────────────────────────────────────────────────

  it('youtube: can add and edit URL', () => {
    addBlock('YouTube video')
    assertValue((v) => expect(v[0]._name).to.equal('youtube'))
    cy.contains('label', 'Video URL').click()
    cy.get('body').type('{selectall}https://www.youtube.com/watch?v=abc123')
    assertValue((v) =>
      expect(v[0].url).to.equal('https://www.youtube.com/watch?v=abc123')
    )
    assertTwigRender('youtube', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  })

  it('youtube-playlist: can add and shows URL field', () => {
    addBlock('YouTube playlist')
    assertValue((v) => expect(v[0]._name).to.equal('youtube-playlist'))
    cy.contains('label', 'Video URL').should('exist')
  })

  it('dailymotion: can add and shows URL field', () => {
    addBlock('Dailymotion video')
    assertValue((v) => expect(v[0]._name).to.equal('dailymotion'))
    cy.contains('label', 'Video URL').should('exist')
    assertTwigRender('dailymotion', { url: 'https://www.dailymotion.com/video/x3jysmt' })
  })

  // ── Spotify ───────────────────────────────────────────────────────────────

  it('spotify-track: can add and shows Size and Theme fields', () => {
    addBlock('Spotify track')
    assertValue((v) => {
      expect(v[0]._name).to.equal('spotify-track')
      expect(v[0].size).to.equal(352)
      expect(v[0].theme).to.equal(0)
    })
    cy.contains('label', 'Size').should('exist')
    cy.contains('label', 'Theme').should('exist')
    assertTwigRender('spotify-track', {
      url: 'https://open.spotify.com/track/6EPRKhUOdiFSQwGBRBbvsZ',
      size: 352,
      theme: 0,
    })
  })

  it('spotify-playlist: can add and shows URL field', () => {
    addBlock('Spotify playlist')
    assertValue((v) => expect(v[0]._name).to.equal('spotify-playlist'))
    cy.contains('label', 'Playlist URL').should('exist')
  })

  it('spotify-album: can add and shows URL field', () => {
    addBlock('Spotify album')
    assertValue((v) => expect(v[0]._name).to.equal('spotify-album'))
    cy.contains('label', 'Album URL').should('exist')
  })

  it('spotify-artist: can add and shows URL field', () => {
    addBlock('Spotify artist')
    assertValue((v) => expect(v[0]._name).to.equal('spotify-artist'))
    cy.contains('label', 'Artist URL').should('exist')
  })

  it('spotify-podcast: can add and shows URL field', () => {
    addBlock('Spotify podcast')
    assertValue((v) => expect(v[0]._name).to.equal('spotify-podcast'))
    cy.contains('label', 'Podcast URL').should('exist')
  })

  // ── Soundcloud ────────────────────────────────────────────────────────────

  it('soundcloud-track: can add and edit ID', () => {
    addBlock('Soundcloud track')
    assertValue((v) => expect(v[0]._name).to.equal('soundcloud-track'))
    cy.contains('label', 'Track ID').click()
    cy.get('body').type('{selectall}12345')
    assertValue((v) => expect(v[0].id).to.equal('12345'))
    assertTwigRender('soundcloud-track', { id: '671194544', style: 'visual' })
  })

  it('soundcloud-playlist: can add and shows Style field', () => {
    addBlock('Soundcloud playlist')
    assertValue((v) => expect(v[0]._name).to.equal('soundcloud-playlist'))
    cy.contains('label', 'Style').should('exist')
  })

  // ── Bandcamp ──────────────────────────────────────────────────────────────

  it('bandcamp-track: can add and shows Type/Size/Theme selects', () => {
    addBlock('Bandcamp')
    assertValue((v) => expect(v[0]._name).to.equal('bandcamp-track'))
    cy.contains('label', 'Type').should('exist')
    cy.contains('label', 'Size').should('exist')
    cy.contains('label', 'Theme').should('exist')
    assertTwigRender('bandcamp-track', {
      id: '845600395',
      type: 'track',
      size: 'small',
      theme: '333333',
    })
  })

  // ── Tidal ─────────────────────────────────────────────────────────────────

  it('tidal-track: can add and shows Track URL field', () => {
    addBlock('Tidal track')
    assertValue((v) => expect(v[0]._name).to.equal('tidal-track'))
    cy.contains('label', 'Track URL').should('exist')
    assertTwigRender('tidal-track', { url: 'https://tidal.com/track/63888239/u' })
  })

  it('tidal-playlist: can add and shows Playlist URL field', () => {
    addBlock('Tidal playlist')
    assertValue((v) => expect(v[0]._name).to.equal('tidal-playlist'))
    cy.contains('label', 'Playlist URL').should('exist')
  })

  it('tidal-album: can add and shows Album URL field', () => {
    addBlock('Tidal album')
    assertValue((v) => expect(v[0]._name).to.equal('tidal-album'))
    cy.contains('label', 'Album URL').should('exist')
  })
})
