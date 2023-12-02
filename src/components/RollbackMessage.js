import { t } from '../functions/i18n.js'

export function createRollbackMessage(store) {
  const el = document.createElement('div')
  el.className = 've-flash'
  el.style.display = 'none'

  const messageEl = document.createElement('span')
  el.appendChild(messageEl)

  const actionBtn = document.createElement('button')
  actionBtn.type = 'button'
  actionBtn.className = 've-flash-action'
  actionBtn.textContent = t('rollback')
  actionBtn.addEventListener('click', () => {
    store.rollback()
  })
  el.appendChild(actionBtn)

  let hideTimer = null

  store.on('rollbackMessage', (message) => {
    clearTimeout(hideTimer)
    if (message) {
      messageEl.textContent = message
      el.style.display = ''
      el.classList.remove('ve-hiding')
      hideTimer = setTimeout(() => {
        el.classList.add('ve-hiding')
        setTimeout(() => {
          store.voidRollback()
        }, 300)
      }, 3000)
    } else {
      el.style.display = 'none'
    }
  })

  return el
}
