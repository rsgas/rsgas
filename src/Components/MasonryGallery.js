const galleries = new Map()
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character])

export function renderMasonryGallery({ id, title, description, items, theme }) {
  galleries.set(id, items)
  return `
    <section class="masonry-section masonry-section--${theme}" id="${id}" data-section="stop" data-scrollbar-theme="${theme}" data-masonry-gallery="${id}" aria-labelledby="${id}-title">
      <div class="masonry-scroll" data-masonry-scroll tabindex="0" aria-label="${escapeHtml(title)} gallery">
        <header class="masonry-heading">
          <div>
            <p>${escapeHtml(title)}</p>
            <h2 id="${id}-title">${escapeHtml(title)}</h2>
          </div>
          <span>${escapeHtml(description)}</span>
        </header>
        <div class="masonry-columns" data-masonry-columns></div>
      </div>
    </section>
  `
}

export function mountMasonryGalleries() {
  let activeTouchCard
  document.querySelectorAll('[data-masonry-gallery]').forEach((gallery) => {
    const items = galleries.get(gallery.dataset.masonryGallery)
    const scroll = gallery.querySelector('[data-masonry-scroll]')
    const columnsRoot = gallery.querySelector('[data-masonry-columns]')
    let resizeFrame

    const renderColumns = () => {
      const styles = getComputedStyle(scroll)
      const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      const availableWidth = Math.max(1, scroll.clientWidth - padding)
      const previousScroll = scroll.scrollTop
      const isSparse = window.innerWidth <= 768 && items.length > 0 && items.length <= 6

      if (activeTouchCard && gallery.contains(activeTouchCard)) activeTouchCard = undefined

      const renderCard = (item) => {
        const width = Number(item.width) > 0 ? Number(item.width) : 1
        const height = Number(item.height) > 0 ? Number(item.height) : 1
        const ratio = Math.min(2, Math.max(0.5, width / height))
        const link = typeof item.link === 'string' && /^https?:\/\//i.test(item.link.trim())
          ? item.link.trim()
          : ''
        const projectLink = link
          ? `<a class="masonry-project-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.linkLabel || 'View project')} <span aria-hidden="true">↗</span></a>`
          : ''
        return `
          <article class="masonry-card" style="--item-ratio:${ratio}">
            <span class="masonry-media">
              ${item.image
                ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">`
                : `<span class="masonry-placeholder">${escapeHtml(item.category || 'Image placeholder')}</span>`}
            </span>
            <span class="masonry-card-caption">
              <span class="masonry-card-heading">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.role || item.category || '')}</span>
              </span>
              <span class="masonry-description-wrap">
                <span class="masonry-card-description">${escapeHtml(item.description || '')}</span>
                ${projectLink}
              </span>
            </span>
          </article>
        `
      }

      if (isSparse) {
        const cellWidth = Math.max(1, (availableWidth - 8) / 2)
        const sparseDimensions = {
          1: [availableWidth / 2, availableWidth * 2],
          2: [availableWidth + 8, availableWidth * 4 + 8],
          3: [availableWidth / 1.1, cellWidth * 2 / 0.45],
          4: [cellWidth + 8, cellWidth * 4 + 8],
          5: [availableWidth * 1.5 + 16, cellWidth * 6 + 16],
          6: [cellWidth * 1.5 + 16, cellWidth * 6 + 16],
        }
        const [minHeight, maxHeight] = sparseDimensions[items.length]
        columnsRoot.className = `masonry-columns masonry-columns--sparse masonry-columns--sparse-${items.length}`
        columnsRoot.style.setProperty('--sparse-min-height', `${minHeight}px`)
        columnsRoot.style.setProperty('--sparse-max-height', `${maxHeight}px`)
        columnsRoot.innerHTML = items.map(renderCard).join('')
        scroll.scrollTop = previousScroll
        return
      }

      columnsRoot.className = 'masonry-columns'
      columnsRoot.style.removeProperty('--sparse-min-height')
      columnsRoot.style.removeProperty('--sparse-max-height')
      const count = items.length
        ? Math.min(items.length, window.innerWidth <= 640 ? 2 : window.innerWidth <= 1024 ? 3 : window.innerWidth <= 1440 ? 4 : 5)
        : 1
      const gap = 10
      const columnWidth = Math.max(1, (availableWidth - gap * (count - 1)) / count)
      const columns = Array.from({ length: count }, () => ({ items: [], height: 0 }))

      items.forEach((item) => {
        const width = Number(item.width) > 0 ? Number(item.width) : 1
        const height = Number(item.height) > 0 ? Number(item.height) : 1
        const ratio = Math.min(2, Math.max(0.5, width / height))
        const column = columns.reduce((shortest, candidate, candidateIndex) => (
          candidate.height < columns[shortest].height ? candidateIndex : shortest
        ), 0)
        const basis = Math.max(150, columnWidth / ratio)
        columns[column].items.push(renderCard(item))
        columns[column].height += basis + gap
      })

      columnsRoot.innerHTML = columns.map((column) => `<div class="masonry-column">${column.items.join('')}</div>`).join('')
      scroll.scrollTop = previousScroll
    }

    renderColumns()
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(renderColumns)
    })

    gallery.addEventListener('click', (event) => {
      if (!window.matchMedia('(hover: none)').matches || !(event.target instanceof Element) || event.target.closest('a')) return
      const card = event.target.closest('.masonry-card')
      if (!card) return
      if (card === activeTouchCard) {
        card.removeAttribute('data-open')
        activeTouchCard = undefined
        return
      }
      activeTouchCard?.removeAttribute('data-open')
      activeTouchCard = card
      card.dataset.open = 'true'
    })
  })
}
