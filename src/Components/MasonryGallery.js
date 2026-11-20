import gsap from 'gsap'
import { revealConfig } from '../config/reveal.js'

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
    <section class="masonry-section masonry-section--${theme}" id="${id}" data-section="stop" data-reveal="bg" data-scrollbar-theme="${theme}" data-masonry-gallery="${id}" aria-labelledby="${id}-title">
      <div class="masonry-scroll" data-masonry-scroll tabindex="0" aria-label="${escapeHtml(title)} gallery">
        <header class="masonry-heading" data-reveal="text">
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
    let cardObserver
    let revealActive = false
    let batchRunning = false
    let revealGeneration = 0
    let revealTimeline
    let revealQueue = []
    let pendingCards = new Set()
    let queuedCards = new Set()
    let revealedCards = new WeakSet()
    let flushFrame = 0
    let resizeFrame

    const cards = () => Array.from(columnsRoot.querySelectorAll('[data-card-reveal]'))
    const captionFor = (card) => card.querySelector('[data-reveal="text"]')
    const sortReadingOrder = (first, second) => {
      const firstRect = first.getBoundingClientRect()
      const secondRect = second.getBoundingClientRect()
      return firstRect.top - secondRect.top || firstRect.left - secondRect.left
    }

    const hideCards = () => {
      const currentCards = cards()
      const captions = currentCards.map(captionFor).filter(Boolean)
      gsap.killTweensOf([...currentCards, ...captions])
      gsap.set([...currentCards, ...captions], { clearProps: 'transform,opacity,visibility,willChange' })
      gsap.set(currentCards, { x: 40, opacity: 0, visibility: 'hidden' })
      gsap.set(captions, { opacity: 0, visibility: 'hidden' })
    }

    const resetCardReveal = () => {
      revealGeneration += 1
      revealActive = false
      batchRunning = false
      cardObserver?.disconnect()
      window.cancelAnimationFrame(flushFrame)
      flushFrame = 0
      revealQueue = []
      pendingCards.clear()
      queuedCards.clear()
      revealedCards = new WeakSet()
      revealTimeline?.kill()
      revealTimeline = undefined
      hideCards()
    }

    const waitForCardImages = async (batch) => {
      const images = batch.flatMap((card) => Array.from(card.querySelectorAll('img')))
      if (!images.length) return

      let timeout
      await Promise.race([
        Promise.all(images.map((image) => {
          const loaded = image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            })
          return loaded.then(() => (
            typeof image.decode === 'function' ? image.decode() : undefined
          )).catch(() => undefined)
        })),
        new Promise((resolve) => {
          timeout = window.setTimeout(resolve, revealConfig.IMAGE_DECODE_TIMEOUT)
        }),
      ])
      window.clearTimeout(timeout)
    }

    const runNextBatch = async () => {
      if (!revealActive || batchRunning || !revealQueue.length) return
      batchRunning = true
      const generation = revealGeneration
      const batch = revealQueue.splice(0).sort(sortReadingOrder)
      await waitForCardImages(batch)
      if (!revealActive || generation !== revealGeneration) return

      const stagger = Math.min(revealConfig.CARD_STAGGER, revealConfig.SEQUENCE_MAX / batch.length)
      revealTimeline = gsap.timeline({
        onComplete: () => {
          const targets = batch.flatMap((card) => [card, captionFor(card)].filter(Boolean))
          gsap.set(targets, { clearProps: 'transform,opacity,visibility,willChange' })
          const hidden = targets.filter((element) => {
            const style = getComputedStyle(element)
            return style.visibility !== 'visible' || Number(style.opacity) < 1
          })
          if (hidden.length) gsap.set(hidden, { x: 0, opacity: 1, visibility: 'visible' })
          batch.forEach((card) => revealedCards.add(card))
          batchRunning = false
          runNextBatch()
        },
      })

      batch.forEach((card, index) => {
        const caption = captionFor(card)
        const start = index * stagger
        card.style.willChange = 'transform, opacity'
        if (caption) caption.style.willChange = 'opacity'
        revealTimeline.set(card, { visibility: 'visible' }, start)
        revealTimeline.fromTo(card, { x: 40, opacity: 0 }, {
          x: 0,
          opacity: 1,
          duration: revealConfig.CARD_DURATION,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility,willChange',
        }, start)
        if (caption) {
          const captionStart = start + revealConfig.CARD_TEXT_DELAY
          revealTimeline.set(caption, { visibility: 'visible' }, captionStart)
          revealTimeline.fromTo(caption, { opacity: 0 }, {
            opacity: 1,
            duration: revealConfig.CARD_DURATION,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,willChange',
          }, captionStart)
        }
      })
    }

    const flushPendingCards = () => {
      flushFrame = 0
      if (!revealActive || !pendingCards.size) return
      pendingCards.forEach((card) => {
        pendingCards.delete(card)
        queuedCards.add(card)
        revealQueue.push(card)
      })
      runNextBatch()
    }

    const queueVisibleCard = (card) => {
      if (!revealActive || queuedCards.has(card) || revealedCards.has(card)) return
      pendingCards.add(card)
      if (!flushFrame) flushFrame = window.requestAnimationFrame(flushPendingCards)
    }

    const startCardReveal = () => {
      if (revealActive) return
      revealActive = true
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const currentCards = cards()
        gsap.set([...currentCards, ...currentCards.map(captionFor).filter(Boolean)], {
          clearProps: 'transform,opacity,visibility,willChange',
        })
        gsap.set([...currentCards, ...currentCards.map(captionFor).filter(Boolean)], {
          x: 0,
          opacity: 1,
          visibility: 'visible',
        })
        currentCards.forEach((card) => revealedCards.add(card))
        return
      }

      cards().forEach((card) => {
        gsap.set(card, { visibility: 'visible' })
        cardObserver.observe(card)
      })
    }

    cardObserver = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        cardObserver.unobserve(entry.target)
        queueVisibleCard(entry.target)
      })
    }, { root: scroll, threshold: 0.01 })

    const renderColumns = () => {
      const restartReveal = revealActive
      if (restartReveal) resetCardReveal()
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
          <article class="masonry-card" data-card-reveal style="--item-ratio:${ratio}">
            <span class="masonry-media" data-reveal="media">
              ${item.image
                ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">`
                : `<span class="masonry-placeholder">${escapeHtml(item.category || 'Image placeholder')}</span>`}
            </span>
            <span class="masonry-card-caption" data-reveal="text">
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
        hideCards()
        scroll.scrollTop = previousScroll
        if (restartReveal) startCardReveal()
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
      hideCards()
      scroll.scrollTop = previousScroll
      if (restartReveal) startCardReveal()
    }

    renderColumns()
    gallery.addEventListener('sectionrevealcomplete', startCardReveal)
    gallery.addEventListener('sectionrevealreset', resetCardReveal)
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
