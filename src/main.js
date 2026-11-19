import './App.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'
import { renderHero } from './sections/hero.js'
import { renderBeginning } from './sections/beginning.js'
import { renderWork } from './sections/work.js'
import { renderDrawing } from './sections/drawing.js'
import { renderJourney } from './sections/journey.js'
import { renderFooter } from './sections/footer.js'
import { mountMasonryGalleries } from './Components/MasonryGallery.js'

gsap.registerPlugin(ScrollTrigger, Observer, ScrollToPlugin, SplitText)

const app = document.querySelector('#app')
app.innerHTML = `
  <main>
    ${renderHero()}
    <section class="marquee" data-section="passthrough" aria-label="Creative disciplines">
      <div class="marquee-track">
        <span>Cinematography</span><b>×</b><span>Direction</span><b>×</b><span>Visual storytelling</span><b>×</b><span>Editing</span><b>×</b>
        <span>Cinematography</span><b>×</b><span>Direction</span><b>×</b><span>Visual storytelling</span><b>×</b><span>Editing</span><b>×</b>
      </div>
    </section>
    ${renderBeginning()}
    ${renderWork()}
    ${renderDrawing()}
    ${renderJourney()}
  </main>
  ${renderFooter()}
`

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sections = Array.from(document.querySelectorAll('[data-section="stop"]'))
const passthroughSections = Array.from(document.querySelectorAll('[data-section="passthrough"]'))
let currentIndex = 0
let isAnimating = false
let edgeDirection = 0
let edgeDelta = 0

mountMasonryGalleries()

const sectionTop = (section) => section.getBoundingClientRect().top + window.scrollY
const scrollInstantly = (top) => {
  const behavior = document.documentElement.style.scrollBehavior
  document.documentElement.style.scrollBehavior = 'auto'
  window.scrollTo(0, top)
  document.documentElement.style.scrollBehavior = behavior
}
const nearestStopIndex = (position) => sections.reduce((nearest, section, index) => (
  Math.abs(sectionTop(section) - position) < Math.abs(sectionTop(sections[nearest]) - position) ? index : nearest
), 0)
const passthroughAt = (position) => {
  if (sections.some((section) => Math.abs(sectionTop(section) - position) <= 2)) return
  return passthroughSections.find((section) => (
    position >= sectionTop(section) && position < sectionTop(section) + section.offsetHeight
  ))
}
const syncCurrentIndex = () => {
  if (isAnimating) return
  const passthrough = passthroughAt(window.scrollY)
  if (passthrough) {
    const nearest = nearestStopIndex(window.scrollY)
    if (nearest !== currentIndex) {
      currentIndex = nearest
      edgeDirection = 0
      edgeDelta = 0
    }
    scrollInstantly(sectionTop(sections[currentIndex]))
    return
  }
  const position = window.scrollY + 2
  let visibleIndex = currentIndex
  sections.forEach((section, index) => {
    if (sectionTop(section) <= position) visibleIndex = index
  })
  if (visibleIndex !== currentIndex) {
    currentIndex = visibleIndex
    edgeDirection = 0
    edgeDelta = 0
  }
}

window.addEventListener('scroll', syncCurrentIndex, { passive: true })
window.addEventListener('resize', syncCurrentIndex)
window.addEventListener('hashchange', syncCurrentIndex)
window.addEventListener('load', () => {
  const hashTarget = document.getElementById(location.hash.slice(1))
  const passthrough = hashTarget?.closest('[data-section="passthrough"]')
  if (passthrough) {
    currentIndex = nearestStopIndex(hashTarget.getBoundingClientRect().top + window.scrollY)
    scrollInstantly(sectionTop(sections[currentIndex]))
  } else {
    syncCurrentIndex()
  }
}, { once: true })
syncCurrentIndex()

if (!prefersReducedMotion) {
  let cooldownUntil = 0
  let lastInputAt = 0

  const tallSectionState = (direction) => {
    const section = sections[currentIndex]
    const innerScroll = section?.querySelector('[data-masonry-scroll]')
    if (innerScroll) {
      if (innerScroll.scrollHeight <= innerScroll.clientHeight + 1) return 'short'
      if (direction > 0 && innerScroll.scrollTop + innerScroll.clientHeight < innerScroll.scrollHeight - 2) return 'inside'
      if (direction < 0 && innerScroll.scrollTop > 2) return 'inside'
      return 'edge'
    }
    if (!section || section.offsetHeight <= window.innerHeight + 1) return 'short'

    const top = sectionTop(section)
    const bottom = Math.min(top + section.offsetHeight - window.innerHeight, document.documentElement.scrollHeight - window.innerHeight)
    if (direction < 0 && window.scrollY > top + 2) return 'inside'
    if (direction > 0 && window.scrollY < bottom - 2) return 'inside'
    return 'edge'
  }
  const goToSection = (index) => {
    if (isAnimating || Date.now() < cooldownUntil || index < 0 || index >= sections.length || index === currentIndex) return
    const from = sectionTop(sections[currentIndex])
    const to = sectionTop(sections[index])
    const skippedSections = passthroughSections.filter((section) => {
      const top = sectionTop(section)
      return top > Math.min(from, to) && top < Math.max(from, to)
    }).length
    isAnimating = true
    edgeDirection = 0
    edgeDelta = 0
    gsap.to(window, {
      scrollTo: sections[index],
      duration: 0.9 + skippedSections * 0.25,
      ease: 'power3.inOut',
      onComplete: () => {
        currentIndex = index
        isAnimating = false
        cooldownUntil = Math.max(Date.now() + 250, lastInputAt + 300)
      },
    })
  }
  const handleDirection = (direction, amount = 350) => {
    lastInputAt = Date.now()
    if (isAnimating || Date.now() < cooldownUntil || !direction) return
    syncCurrentIndex()
    const state = tallSectionState(direction)
    if (state === 'inside') {
      edgeDirection = 0
      edgeDelta = 0
      return
    }
    if (state === 'edge') {
      if (edgeDirection !== direction) edgeDelta = 0
      edgeDirection = direction
      edgeDelta += amount
      if (edgeDelta < 350) return
    }
    goToSection(currentIndex + direction)
  }

  Observer.create({
    target: window,
    type: 'wheel,touch,pointer',
    preventDefault: false,
    onChangeY: (self) => {
      lastInputAt = Date.now()
      const direction = self.event?.type === 'wheel'
        ? Math.sign(self.deltaY)
        : -Math.sign(self.deltaY)
      handleDirection(direction, Math.abs(self.deltaY))
    },
  })

  let lastTouchY = 0
  document.addEventListener('touchstart', (event) => {
    lastTouchY = event.touches[0]?.clientY || 0
    edgeDirection = 0
    edgeDelta = 0
  }, { passive: true, capture: true })
  document.addEventListener('wheel', (event) => {
    if (!event.deltaY) return
    if (isAnimating || tallSectionState(Math.sign(event.deltaY)) !== 'inside') event.preventDefault()
  }, { passive: false, capture: true })
  document.addEventListener('touchmove', (event) => {
    const touchY = event.touches[0]?.clientY
    if (touchY === undefined) return
    const direction = Math.sign(lastTouchY - touchY)
    lastTouchY = touchY
    if (!direction) return
    if (isAnimating || tallSectionState(direction) !== 'inside') event.preventDefault()
  }, { passive: false, capture: true })
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return
    const directions = { ArrowDown: 1, PageDown: 1, Space: 1, ArrowUp: -1, PageUp: -1 }
    const direction = directions[event.code] || directions[event.key]
    if (!direction) return
    if (isAnimating || Date.now() < cooldownUntil) {
      event.preventDefault()
      return
    }
    if (direction > 0 && (event.code === 'Space' || event.key === ' ') && event.target.closest('a, button, [role="button"]')) return
    syncCurrentIndex()
    if (tallSectionState(direction) === 'inside') return
    event.preventDefault()
    handleDirection(direction, 350)
  })
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a[href^="#"]')
    if (!link) return
    const target = document.querySelector(link.getAttribute('href'))
    if (isAnimating) {
      event.preventDefault()
      return
    }
    const stopSection = target?.closest('[data-section="stop"]')
    if (stopSection) {
      const index = sections.indexOf(stopSection)
      if (index < 0) return
      event.preventDefault()
      goToSection(index)
      return
    }
    if (target?.closest('[data-section="passthrough"]')) {
      event.preventDefault()
      const targetPosition = target.getBoundingClientRect().top + window.scrollY
      currentIndex = nearestStopIndex(targetPosition)
      scrollInstantly(sectionTop(sections[currentIndex]))
    }
  })

  let heroSplit
  try {
    heroSplit = new SplitText('.hero-title', { type: 'chars,words', charsClass: 'hero-char', wordsClass: 'hero-word' })
  } catch (error) {
    heroSplit = null
  }

  gsap.from(heroSplit?.chars || '.hero-title span', {
    y: 44,
    opacity: 0,
    duration: 1,
    stagger: 0.018,
    ease: 'power3.out',
  })

  gsap.to('.hero-kicker', { y: 0, opacity: 1, duration: 0.8, delay: 0.15 })
  gsap.to('.hero-bottom', { y: 0, opacity: 1, duration: 0.8, delay: 0.45 })

  gsap.utils.toArray('.reveal-x').forEach((element) => {
    gsap.fromTo(element,
      { x: element.classList.contains('beginning-images') ? -48 : 48, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 82%',
          once: true,
        },
      }
    )
  })

  gsap.utils.toArray('.section-reveal').forEach((element) => {
    gsap.fromTo(element,
      { x: 40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 82%', once: true },
      }
    )
  })
}

document.fonts?.ready.then(() => ScrollTrigger.refresh())
document.querySelectorAll('img').forEach((image) => {
  image.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
  image.addEventListener('error', () => ScrollTrigger.refresh(), { once: true })
})
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
