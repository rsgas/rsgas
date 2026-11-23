import gsap from 'gsap'
import { revealConfig } from '../config/reveal.js'

export function mountHeroTitleSlider() {
  const viewport = document.querySelector('[data-hero-title-slider]')
  if (!viewport) return () => {}

  const title = viewport.closest('.hero-title')
  const slides = Array.from(viewport.children)
  if (!title || slides.length < 2) return () => {}

  let disposed = false
  const measureHeight = () => {
    if (disposed) return
    const height = Math.ceil(Math.max(...slides.map((slide) => slide.getBoundingClientRect().height)))
    if (height && Math.abs(height - viewport.getBoundingClientRect().height) > 1) {
      viewport.style.height = `${height}px`
    }
  }

  const setCurrentSlide = (activeIndex) => {
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== activeIndex))
    })
  }

  gsap.set(slides, { yPercent: 100, autoAlpha: 0 })
  gsap.set(slides[0], { yPercent: 0, autoAlpha: 1 })
  setCurrentSlide(0)
  measureHeight()
  document.fonts?.ready.then(measureHeight)

  const resizeObserver = new ResizeObserver(measureHeight)
  resizeObserver.observe(title)
  window.addEventListener('resize', measureHeight)

  let timeline
  let intersectionObserver
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timeline = gsap.timeline({ paused: true, repeat: -1 })
    slides.forEach((outgoing, index) => {
      const nextIndex = (index + 1) % slides.length
      const incoming = slides[nextIndex]
      const start = index * revealConfig.HERO_TITLE_INTERVAL +
        revealConfig.HERO_TITLE_INTERVAL - revealConfig.HERO_TITLE_DURATION

      timeline.to(outgoing, {
        yPercent: -100,
        autoAlpha: 0,
        duration: revealConfig.HERO_TITLE_DURATION,
        ease: revealConfig.HERO_TITLE_EASE,
      }, start)
      timeline.fromTo(incoming, {
        yPercent: 100,
        autoAlpha: 0,
      }, {
        yPercent: 0,
        autoAlpha: 1,
        duration: revealConfig.HERO_TITLE_DURATION,
        ease: revealConfig.HERO_TITLE_EASE,
        immediateRender: false,
        onComplete: () => setCurrentSlide(nextIndex),
      }, start)
    })

    intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) timeline.play()
      else timeline.pause()
    })
    intersectionObserver.observe(title)
  }

  return () => {
    disposed = true
    intersectionObserver?.disconnect()
    resizeObserver.disconnect()
    window.removeEventListener('resize', measureHeight)
    timeline?.kill()
    gsap.killTweensOf(slides)
    gsap.set(slides, { clearProps: 'transform,opacity,visibility' })
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== 0))
    })
    viewport.style.removeProperty('height')
  }
}
