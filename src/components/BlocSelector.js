import { t } from '../functions/i18n.js'

const ICON_CLOSE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

export function createBlocSelector(store, { iconsUrl }) {
  const overlay = document.createElement('div')
  overlay.className = 've-modal-overlay'
  overlay.style.display = 'none'

  const modal = document.createElement('div')
  modal.className = 've-modal'
  overlay.appendChild(modal)

  // Header
  const modalHeader = document.createElement('div')
  modalHeader.className = 've-modal-header'

  const title = document.createElement('div')
  title.className = 've-modal-title'
  title.textContent = t('addComponent')
  modalHeader.appendChild(title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 've-btn-icon'
  closeBtn.innerHTML = ICON_CLOSE
  closeBtn.addEventListener('click', () => store.setAddBlockIndex(null))
  modalHeader.appendChild(closeBtn)
  modal.appendChild(modalHeader)

  // Body
  const modalBody = document.createElement('div')
  modalBody.className = 've-modal-body'
  modal.appendChild(modalBody)

  // Search
  const searchWrapper = document.createElement('div')
  searchWrapper.className = 've-modal-search'
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 've-input'
  searchInput.placeholder = t('searchComponent')
  searchWrapper.appendChild(searchInput)
  modalBody.appendChild(searchWrapper)

  // Tabs + grid container
  const tabsNav = document.createElement('div')
  tabsNav.className = 've-tabs-nav'
  tabsNav.style.margin = '1em 0 1em'
  modalBody.appendChild(tabsNav)

  const gridContainer = document.createElement('div')
  modalBody.appendChild(gridContainer)

  let currentCategory = 'all'
  let searchValue = ''
  let categoryBtns = []

  function getCategories() {
    const { definitions, hiddenCategories } = store.get()
    const cats = Object.values(definitions)
      .filter((d) => d.category && !hiddenCategories.includes(d.category))
      .reduce((acc, d) => {
        if (!acc.includes(d.category)) acc.push(d.category)
        return acc
      }, [])
    return cats
  }

  function renderTabs() {
    tabsNav.innerHTML = ''
    categoryBtns = []

    const categories = getCategories()

    if (categories.length === 0) {
      tabsNav.style.display = 'none'
      return
    }

    tabsNav.style.display = ''

    const allBtn = makeTabBtn('all', t('allBlocs'))
    tabsNav.appendChild(allBtn)
    categoryBtns.push(allBtn)

    for (const cat of categories) {
      const btn = makeTabBtn(cat, cat)
      tabsNav.appendChild(btn)
      categoryBtns.push(btn)
    }
  }

  function makeTabBtn(value, label) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 've-tabs-btn' + (value === currentCategory ? ' ve-active' : '')
    btn.textContent = label
    btn.dataset.cat = value
    btn.addEventListener('click', () => {
      currentCategory = value
      for (const b of categoryBtns) {
        b.classList.toggle('ve-active', b.dataset.cat === value)
      }
      renderGrid()
    })
    return btn
  }

  function renderGrid() {
    gridContainer.innerHTML = ''
    const { definitions, hiddenCategories, addBlockIndex } = store.get()

    const grid = document.createElement('div')
    grid.className = 've-bloc-grid'

    for (const [key, def] of Object.entries(definitions)) {
      if (hiddenCategories.includes(def.category ?? '')) continue
      if (currentCategory !== 'all' && def.category !== currentCategory) continue
      if (
        searchValue &&
        !def.title.toLowerCase().includes(searchValue.toLowerCase())
      )
        continue

      const item = document.createElement('button')
      item.type = 'button'
      item.className = 've-bloc-item'
      item.addEventListener('click', () => {
        store.insertData(key, addBlockIndex ?? store.get().data.length)
        store.setAddBlockIndex(null)
      })

      if (def.icon) {
        const iconEl = document.createElement('div')
        iconEl.className = 've-bloc-item-icon'
        iconEl.innerHTML = def.icon
        item.appendChild(iconEl)
      } else {
        const img = document.createElement('img')
        img.className = 've-bloc-item-icon'
        img.src = iconsUrl.replace('[name]', key)
        img.alt = def.title
        img.width = 40
        img.height = 40
        img.onerror = () => (img.style.display = 'none')
        item.appendChild(img)
      }

      const label = document.createElement('div')
      label.className = 've-bloc-item-title'
      label.textContent = def.title
      item.appendChild(label)

      grid.appendChild(item)
    }

    gridContainer.appendChild(grid)
  }

  searchInput.addEventListener('input', (e) => {
    searchValue = e.target.value
    renderGrid()
  })

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) store.setAddBlockIndex(null)
  })

  store.on('addBlockIndex', (val) => {
    overlay.style.display = val !== null ? '' : 'none'
    if (val !== null) {
      searchInput.value = ''
      searchValue = ''
      currentCategory = 'all'
      renderTabs()
      renderGrid()
      setTimeout(() => searchInput.focus(), 0)
    }
  })

  return overlay
}
