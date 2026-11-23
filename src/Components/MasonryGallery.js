import gsap from 'gsap'
import { revealConfig } from '../config/reveal.js'
import { userCurrentSession } from './FullpageScroll.js'

const galleries = new Map()
// Escape content before placing data values into generated HTML.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character])

// Save gallery data for mounting and render the section shell.
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

// Render each gallery's cards and connect its reveal and touch behavior.
export function mountMasonryGalleries() {
  let activeTouchCard
  document.querySelectorAll('[data-masonry-gallery]').forEach((gallery) => {
    const items = galleries.get(gallery.dataset.masonryGallery)
    const scroll = gallery.querySelector('[data-masonry-scroll]')
    const columnsRoot = gallery.querySelector('[data-masonry-columns]')
    let cardObserver
    let revealActive = false
    let batchRunning = false
    let revealTimeline
    let revealQueue = []
    let pendingCards = new Set()
    let queuedCards = new Set()
    let revealedCards = new WeakSet()
    let flushFrame = 0
    let resizeFrame
    let moreOverlay

    // Keep card lookups current after responsive rerenders.
    const cards = () => Array.from(columnsRoot.querySelectorAll('[data-card-reveal]'))
    // Captions reveal separately from their cards.
    const captionFor = (card) => card.querySelector('[data-reveal="text"]')
    // Add the See More overlay once so rerenders can reuse it.
    const renderMore = () => {
      const messages = [
        'See More',
        'Under construction 🚧',
        'JS scroll bro 💀  ',
        'Back Again?',
      ]

      if (moreOverlay) return
      moreOverlay = document.createElement('div')
      moreOverlay.className = 'masonry-more'
      moreOverlay.innerHTML = `
        <button type="button" aria-label="See more ${escapeHtml(gallery.querySelector('.masonry-heading h2').textContent)}">
          <span class="more-label">See More</span> <span aria-hidden="true">↗</span>
        </button>
      `
      const moreButton = moreOverlay.querySelector('button')
      const moreLabel = moreButton.querySelector('.more-label')
      let messagesIndex = 0

      moreButton.addEventListener('click', () => { 
        messagesIndex = (messagesIndex + 1) % messages.length
        moreLabel.textContent = messages[messagesIndex]
          if ( messagesIndex === 3) {
            if (userCurrentSession() === 'work-gallery') {
              window.location.href = '#drawing'
              messagesIndex = 0
            } else if (userCurrentSession() === 'drawing') {
              window.location.href = '#journey'
              messagesIndex = 0
            }
          }
        console.log(userCurrentSession())
      })
      // moreOverlay.innerHTML = `<button aria-label="See more ${escapeHtml(gallery.querySelector('.masonry-heading h2').textContent)}">See More <span aria-hidden="true">↗</span></button>`

      gsap.set(moreOverlay, { autoAlpha: 0, y: revealConfig.MORE_OFFSET })
      gallery.append(moreOverlay)
    }

    // Reveal the overlay when the section finishes, without motion for reduced-motion users.
    const showMore = () => {
      if (!moreOverlay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (moreOverlay) gsap.set(moreOverlay, { clearProps: 'transform,opacity,visibility' })
        return
      }

      gsap.fromTo(moreOverlay, {
        autoAlpha: 0,
        y: revealConfig.MORE_OFFSET,
      }, {
        autoAlpha: 1,
        y: 0,
        duration: revealConfig.MORE_DURATION,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      })
    }

    // Stop any in-flight reveal before hiding the overlay.
    const hideMore = () => {
      if (!moreOverlay) return
      gsap.killTweensOf(moreOverlay)
      gsap.set(moreOverlay, { autoAlpha: 0, y: revealConfig.MORE_OFFSET })
    }

    // Order visible cards top-to-bottom, then left-to-right.
    const sortReadingOrder = (first, second) => {
      const firstRect = first.getBoundingClientRect()
      const secondRect = second.getBoundingClientRect()
      return firstRect.top - secondRect.top || firstRect.left - secondRect.left
    }

    // Return cards and captions to their hidden state before a reveal run.
    const hideCards = () => {
      const currentCards = cards()
      const captions = currentCards.map(captionFor).filter(Boolean)
      gsap.killTweensOf([...currentCards, ...captions])
      gsap.set([...currentCards, ...captions], { clearProps: 'transform,opacity,visibility,willChange' })
      gsap.set(currentCards, { x: 40, opacity: 0, visibility: 'hidden' })
      gsap.set(captions, { opacity: 0, visibility: 'hidden' })
    }

    // Clear observers, queued work, and animations before rebuilding card elements.
    const resetCardReveal = () => {
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

    // Animate the next group of visible cards, keeping their visual reading order.
    const runNextBatch = () => {
      if (!revealActive || batchRunning || !revealQueue.length) return
      batchRunning = true
      const batch = revealQueue.splice(0).sort(sortReadingOrder)

      // Cap the total stagger so large batches do not delay the rest of the gallery.
      const stagger = Math.min(revealConfig.CARD_STAGGER, revealConfig.SEQUENCE_MAX / batch.length)
      revealTimeline = gsap.timeline({
        // Mark this batch complete, then continue with any newly visible cards.
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

      // Stagger card and caption reveals while keeping each caption with its card.
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

    // Move newly visible cards into the reveal queue on the next animation frame.
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

    // Collect visible cards together to avoid starting a separate timeline per card.
    const queueVisibleCard = (card) => {
      if (!revealActive || queuedCards.has(card) || revealedCards.has(card)) return
      pendingCards.add(card)
      if (!flushFrame) flushFrame = window.requestAnimationFrame(flushPendingCards)
    }

    // Start observing cards, or show them immediately when motion is reduced.
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

      // Load images eagerly before observing cards so reveals are not delayed.
      cards().forEach((card) => {
        card.querySelectorAll('img').forEach((image) => {
          image.loading = 'eager'
        })
        gsap.set(card, { visibility: 'visible' })
        cardObserver.observe(card)
      })
    }

    // Reveal each card only once when it enters the gallery's scroll viewport.
    cardObserver = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        cardObserver.unobserve(entry.target)
        queueVisibleCard(entry.target)
      })
    }, { root: scroll, threshold: 0.01 })

    // Rebuild card columns for the current viewport while preserving active reveals.
    const renderColumns = () => {
      const restartReveal = revealActive
      if (restartReveal) resetCardReveal()
      const styles = getComputedStyle(scroll)
      const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      const availableWidth = Math.max(1, scroll.clientWidth - padding)
      const isSparse = window.innerWidth <= 768 && items.length > 0 && items.length <= 6

      if (activeTouchCard && gallery.contains(activeTouchCard)) activeTouchCard = undefined

      // Build one card from project data, including an optional safe external link.
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

      // Use a fixed sparse layout on small screens when there are only a few cards.
      if (isSparse) {
        columnsRoot.className = `masonry-columns masonry-columns--sparse masonry-columns--sparse-${items.length}`
        columnsRoot.style.removeProperty('--sparse-min-height')
        columnsRoot.style.removeProperty('--sparse-max-height')
        columnsRoot.innerHTML = items.map(renderCard).join('')
        hideCards()
        renderMore()
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

      // Place each item in the currently shortest column to balance gallery height.
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
      renderMore()
      if (restartReveal) startCardReveal()
    }

    renderColumns()
    // Keep the overlay in sync with the section's reveal lifecycle.
    gallery.addEventListener('sectionrevealcomplete', showMore)
    gallery.addEventListener('sectionrevealreset', hideMore)
    gallery.addEventListener('sectionrevealstart', startCardReveal)
    gallery.addEventListener('sectionrevealreset', resetCardReveal)
    // Recalculate columns once per frame during viewport resizing.
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(renderColumns)
    })

    // On touch devices, tap a card to toggle its details; links remain clickable.
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
