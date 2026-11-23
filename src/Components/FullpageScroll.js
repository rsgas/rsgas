import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { revealConfig } from '../config/reveal.js'
import { scrollConfig } from '../config/scroll.js'

gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger, SplitText)

const innerSelector = '[data-inner-scroll], [data-masonry-scroll]'
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Return the active section ID, or null when no section is active.
export function userCurrentSession() {
  return document.querySelector('[data-section="stop"]:not([aria-hidden="true"])')?.id || null
}

// Set up section navigation, reveal animations, and input handlers.
export function mountFullpageScroll() {
  const sections = Array.from(document.querySelectorAll('[data-section="stop"]'))
  const passthroughSections = Array.from(document.querySelectorAll('[data-section="passthrough"]'))
  if (!sections.length) return

  let currentIndex = 0
  let activeIndex = -1
  let isAnimating = false
  let lastJumpTargetIndex = -1
  let lockUntil = 0
  let lastMovementDirection = 1
  let lastWindowY = window.scrollY
  let suppressSettleUntil = 0
  let settleTimer = 0
  let wheelTimer = 0
  let wheelDelta = 0
  let wheelDirection = 0
  let wheelScope = ''
  let touchGesture = null
  const sectionTimelines = new WeakMap()
  const sectionSplits = new WeakMap()
  const preloadedImages = new WeakSet()
  const edgeTimes = new WeakMap()
  const edgeWheelStates = new WeakMap()
  const innerScrollStates = new WeakMap()
  const registeredInnerScrolls = new WeakSet()

  // Get a section's document position, including the current page scroll.
  const sectionTop = (section) => section.getBoundingClientRect().top + window.scrollY
  // Find a section's nested scrollable content.
  const getInnerScroll = (section) => section?.querySelector(innerSelector)
  // Check whether nested content can scroll.
  const hasOverflow = (inner) => inner.scrollHeight > inner.clientHeight
  // Block input while a section jump is running or settling.
  const isLocked = () => isAnimating || Date.now() < lockUntil
  // Map scroll direction to the edge of a nested scroller.
  const edgeKey = (direction) => direction > 0 ? 'bottom' : 'top'

  // Correct the page position without triggering smooth-scroll CSS.
  const scrollInstantly = (top) => {
    const behavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, top)
    document.documentElement.style.scrollBehavior = behavior
    suppressSettleUntil = Date.now() + scrollConfig.SCROLLEND_DEBOUNCE
  }

  // Find the closest full-page section for the current scroll position.
  const nearestStopIndex = (position) => sections.reduce((nearest, section, index) => (
    Math.abs(sectionTop(section) - position) < Math.abs(sectionTop(sections[nearest]) - position)
      ? index
      : nearest
  ), 0)

  // Find a non-stopping section currently between two full-page sections.
  const passthroughAt = (position) => passthroughSections.find((section) => (
    position >= sectionTop(section) &&
    position < sectionTop(section) + section.offsetHeight
  ))

  // Remember when input first reached a nested scroller's edge.
  const recordEdge = (inner, direction, time = Date.now()) => {
    const key = edgeKey(direction)
    const times = edgeTimes.get(inner) || {}
    times[key] = time
    edgeTimes.set(inner, times)

    const states = edgeWheelStates.get(inner) || {}
    states[key] = { enteredAt: time, blocked: true, lastInputAt: time }
    edgeWheelStates.set(inner, states)
  }

  // Position nested scroll areas at the correct edge when entering a section.
  const setInnerLanding = (section, direction) => {
    const inner = getInnerScroll(section)
    if (!inner || !hasOverflow(inner)) return

    if (direction > 0) {
      inner.scrollTop = 0
      recordEdge(inner, -1)
    } else {
      inner.scrollTop = inner.scrollHeight
      recordEdge(inner, 1)
    }

    innerScrollStates.set(inner, {
      top: inner.scrollTop <= 0,
      bottom: inner.scrollTop + inner.clientHeight >= inner.scrollHeight,
    })
  }

  // Collect reveal targets while excluding cards managed by their own observer.
  const revealElements = (section, layer) => {
    const selector = `[data-reveal="${layer}"]`
    return [
      ...(section.matches(selector) ? [section] : []),
      ...section.querySelectorAll(selector),
    ].filter((element) => !element.closest('[data-card-reveal]'))
  }

  // Notify section components when a reveal lifecycle step occurs.
  const dispatchRevealEvent = (section, name) => {
    section.dispatchEvent(new CustomEvent(name, { bubbles: true }))
  }

  // Reset the section background wipe before another reveal.
  const resetBackground = (section) => {
    gsap.killTweensOf(section, '--background-reveal')
    gsap.set(section, { '--background-reveal': 0 })
  }

  // Reveal the section background, respecting reduced-motion preferences.
  const revealBackground = (section) => {
    if (reducedMotion) {
      gsap.set(section, { '--background-reveal': 1 })
      return
    }

    resetBackground(section)
    gsap.to(section, {
      '--background-reveal': 1,
      duration: revealConfig.BG_DURATION,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  // Wait for an image to load before decoding it.
  const decodeImage = (image) => {
    const loaded = image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true })
        image.addEventListener('error', resolve, { once: true })
      })
    return loaded.then(() => (
      typeof image.decode === 'function' ? image.decode() : undefined
    ))
  }

  // Start loading section images early, with a timeout fallback for decoding.
  const preloadImages = (section) => {
    const images = Array.from(section.querySelectorAll('img')).filter((image) => {
      if (preloadedImages.has(image)) return false
      preloadedImages.add(image)
      image.loading = 'eager'
      return true
    })
    if (!images.length) return

    let timeout
    const decoded = Promise.all(images.map((image) => decodeImage(image).catch(() => undefined)))
    Promise.race([
      decoded,
      new Promise((resolve) => {
        timeout = window.setTimeout(resolve, revealConfig.IMAGE_DECODE_TIMEOUT)
      }),
    ]).finally(() => window.clearTimeout(timeout))
  }

  // Cancel a section's reveal and restore its hidden starting state.
  const resetSectionReveal = (section) => {
    sectionTimelines.get(section)?.kill?.()
    sectionTimelines.delete(section)
    const split = sectionSplits.get(section)
    if (split) {
      split.revert()
      sectionSplits.delete(section)
    }

    const targets = [
      ...revealElements(section, 'media'),
      ...revealElements(section, 'text'),
    ]
    resetBackground(section)
    gsap.killTweensOf(targets)
    gsap.set(targets, { clearProps: 'transform,opacity,visibility,willChange' })
    gsap.set(targets, { x: 40, opacity: 0, visibility: 'hidden' })
    section.removeAttribute('data-reveal-complete')
    dispatchRevealEvent(section, 'sectionrevealreset')
    revealElements(section, 'media').forEach((element) => {
      dispatchRevealEvent(element, 'sectionrevealreset')
    })
  }

  // Hide a section and mark it unavailable to assistive technology.
  const hideSection = (section) => {
    resetSectionReveal(section)
    gsap.killTweensOf(section)
    gsap.set(section, { autoAlpha: 0 })
    section.setAttribute('aria-hidden', 'true')
  }

  // Clear reveal styles and announce that the section is ready.
  const finishSectionReveal = (section, targets) => {
    gsap.set(section, { '--background-reveal': 1 })
    gsap.set(targets, { clearProps: 'transform,opacity,visibility,willChange' })
    const hidden = targets.filter((element) => {
      const style = getComputedStyle(element)
      return style.visibility !== 'visible' || Number(style.opacity) < 1
    })
    if (hidden.length) gsap.set(hidden, { x: 0, opacity: 1, visibility: 'visible' })

    section.dataset.revealComplete = 'true'
    dispatchRevealEvent(section, 'sectionrevealcomplete')
  }

  // Coordinate background, media, and text entrance animations for a section.
  const animateSection = (section) => {
    const media = revealElements(section, 'media')
    const text = revealElements(section, 'text')
    const heroTitle = section.matches('.hero') ? section.querySelector('.hero-title') : null
    const heroTitleSlider = heroTitle?.querySelector('[data-hero-title-slider]')
    const textTargets = heroTitle && !heroTitleSlider
      ? text.filter((element) => element !== heroTitle)
      : text
    const token = {}
    sectionTimelines.set(section, token)
    revealBackground(section)
    preloadImages(section)
    dispatchRevealEvent(section, 'sectionrevealstart')

    const timeline = gsap.timeline({ paused: true })
    sectionTimelines.set(section, timeline)

    // Add a stagger-free entrance for one reveal layer.
    const addLayer = (targets, label, time, duration, onComplete) => {
      if (!targets.length) return
      timeline.addLabel(label, time)
      timeline.set(targets, { visibility: 'visible', willChange: 'transform, opacity' }, label)
      timeline.fromTo(targets, { x: 40, opacity: 0 }, {
        x: 0,
        opacity: 1,
        duration,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility,willChange',
        onComplete,
      }, label)
    }

    const textStart = revealConfig.BG_DURATION * revealConfig.TEXT_START_PROGRESS
    // Reveal hero text as characters unless the title is driven by its own slider.
    const addTextLayer = () => {
      addLayer(textTargets, 'text', textStart, revealConfig.TEXT_DURATION)
      if (!heroTitle || heroTitleSlider) return

      const split = new SplitText(heroTitle, {
        type: 'chars,words',
        charsClass: 'hero-char',
        wordsClass: 'hero-word',
      })
      sectionSplits.set(section, split)
      gsap.set(split.chars, { x: 40, opacity: 0, visibility: 'hidden' })
      timeline.set(heroTitle, { x: 0, opacity: 1, visibility: 'visible' }, 'text')
      timeline.set(split.chars, { visibility: 'visible', willChange: 'transform, opacity' }, 'text')
      timeline.fromTo(split.chars, { x: 40, opacity: 0 }, {
        x: 0,
        opacity: 1,
        duration: revealConfig.TEXT_DURATION,
        stagger: revealConfig.HERO_CHAR_STAGGER,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility,willChange',
      }, 'text')
    }

    // Start media and text at their configured offsets within the timeline.
    if (media.length) {
      const mediaStart = revealConfig.BG_DURATION * revealConfig.MEDIA_START_PROGRESS
      addLayer(media, 'media', mediaStart, revealConfig.MEDIA_DURATION, () => {
        // Let components know their media entrance has finished.
        media.forEach((element) => dispatchRevealEvent(element, 'sectionmediarevealcomplete'))
      })
    }
    addTextLayer()
    // Restore SplitText markup and finish the section after all timeline layers complete.
    timeline.eventCallback('onComplete', () => {
      const split = sectionSplits.get(section)
      const splitChars = split ? split.chars : []
      if (split) {
        split.revert()
        sectionSplits.delete(section)
      }
      finishSectionReveal(section, [...media, ...textTargets, ...(heroTitle ? [heroTitle] : []), ...splitChars])
    })
    timeline.play()
  }

  // Show a section immediately when entrance animation should be skipped.
  const showSectionImmediately = (section) => {
    sectionTimelines.get(section)?.kill?.()
    sectionTimelines.delete(section)
    const split = sectionSplits.get(section)
    if (split) {
      split.revert()
      sectionSplits.delete(section)
    }

    revealBackground(section)
    preloadImages(section)
    dispatchRevealEvent(section, 'sectionrevealstart')
    const media = revealElements(section, 'media')
    const text = revealElements(section, 'text')
    const targets = [...revealElements(section, 'bg'), ...media, ...text]
    gsap.set(targets, { clearProps: 'transform,opacity,visibility,willChange' })
    gsap.set(targets, { x: 0, opacity: 1, visibility: 'visible' })
    media.forEach((element) => dispatchRevealEvent(element, 'sectionmediarevealcomplete'))
    finishSectionReveal(section, targets)
  }

  // Mark the target active, preload nearby images, and run its reveal.
  const activateSection = (index, animate = true) => {
    if (activeIndex >= 0 && activeIndex !== index) hideSection(sections[activeIndex])
    currentIndex = index
    activeIndex = index

    const section = sections[index]
    preloadImages(section)
    if (sections[index - 1]) preloadImages(sections[index - 1])
    if (sections[index + 1]) preloadImages(sections[index + 1])
    section.removeAttribute('aria-hidden')
    gsap.set(section, { autoAlpha: 1 })

    if (animate && !reducedMotion) {
      animateSection(section)
      return
    }

    showSectionImmediately(section)
  }

  // Clear a partial wheel gesture before switching input scopes.
  const resetWheelAccumulator = () => {
    wheelDelta = 0
    wheelDirection = 0
    wheelScope = ''
    window.clearTimeout(wheelTimer)
    wheelTimer = 0
  }

  // Combine wheel deltas until they pass the relevant navigation threshold.
  const accumulateWheel = (direction, amount, threshold, scope) => {
    if (wheelDirection !== direction || wheelScope !== scope) {
      resetWheelAccumulator()
      wheelDirection = direction
      wheelScope = scope
    }

    wheelDelta += amount
    window.clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(resetWheelAccumulator, scrollConfig.ACCUMULATOR_RESET)

    if (wheelDelta >= threshold) {
      resetWheelAccumulator()
      goToSection(currentIndex + direction, direction)
    }
  }

  // Jump to a requested section and activate it once the scroll arrives.
  const goToSection = (index, direction = Math.sign(index - currentIndex)) => {
    if (isLocked() || index < 0 || index >= sections.length || index === currentIndex) return

    resetWheelAccumulator()
    lastJumpTargetIndex = index
    gsap.killTweensOf(sections[currentIndex])
    gsap.set(sections[currentIndex], { y: 0 })
    preloadImages(sections[index])
    setInnerLanding(sections[index], direction)
    isAnimating = true
    // Finish once, whether the tween reaches the target early or completes normally.
    const finishJump = () => {
      if (!isAnimating) return
      isAnimating = false
      lockUntil = Date.now() + scrollConfig.LOCK_AFTER_JUMP
      activateSection(index)
      scheduleSettledPosition()
    }

    let jumpTween
    jumpTween = gsap.to(window, {
      scrollTo: sections[index],
      duration: reducedMotion ? 0 : scrollConfig.JUMP_DURATION,
      ease: 'power3.inOut',
      onUpdate: () => {
        const targetTop = sectionTop(sections[index])
        const reachedTarget = direction > 0
          ? window.scrollY >= targetTop
          : window.scrollY <= targetTop
        if (reachedTarget) {
          jumpTween.kill()
          finishJump()
        }
      },
      onComplete: finishJump,
    })
  }

  // Snap to a section and synchronize its active and nested-scroll state.
  const syncToStop = (index, animate = false, resetInner = true) => {
    currentIndex = index
    if (resetInner) setInnerLanding(sections[index], 1)
    scrollInstantly(sectionTop(sections[index]))
    activateSection(index, animate)
  }

  // Resolve a target element to its containing full-page section.
  const findSectionForTarget = (target) => {
    if (!(target instanceof Element)) return null
    return target.closest('[data-section="stop"]')
  }

  // Find the nested scroller containing an input target, if any.
  const targetInner = (target, section) => {
    if (!(target instanceof Element)) return null
    const inner = target.closest(innerSelector)
    return inner && section.contains(inner) ? inner : null
  }

  // Check whether nested content can continue scrolling in this direction.
  const canInnerScroll = (inner, direction) => direction > 0
    ? inner.scrollTop + inner.clientHeight < inner.scrollHeight
    : inner.scrollTop > 0

    // Let nested content scroll first; move sections only after it reaches an edge.
  const handleWheel = (event) => {
    const direction = Math.sign(event.deltaY)
    if (!direction) return

    if (isLocked()) {
      event.preventDefault()
      resetWheelAccumulator()
      return
    }
    lastMovementDirection = direction

    const section = sections[currentIndex]
    const inner = targetInner(event.target, section)
    if (inner && hasOverflow(inner) && canInnerScroll(inner, direction)) {
      resetWheelAccumulator()
      return
    }

    event.preventDefault()

    if (inner && hasOverflow(inner)) {
      const key = edgeKey(direction)
      const states = edgeWheelStates.get(inner) || {}
      let state = states[key]
      const now = Date.now()
      if (!state) {
        recordEdge(inner, direction, now)
        resetWheelAccumulator()
        return
      }

      state = edgeWheelStates.get(inner)[key]
      if (now - state.enteredAt < scrollConfig.EDGE_COOLDOWN) {
        state.blocked = true
        state.lastInputAt = now
        resetWheelAccumulator()
        return
      }
      if (state.blocked) {
        if (now - state.lastInputAt < scrollConfig.ACCUMULATOR_RESET) {
          state.lastInputAt = now
          resetWheelAccumulator()
          return
        }
        state.blocked = false
      }

      accumulateWheel(direction, Math.abs(event.deltaY), scrollConfig.WHEEL_EDGE_DELTA, `edge-${key}`)
      return
    }

    accumulateWheel(direction, Math.abs(event.deltaY), scrollConfig.WHEEL_MIN_DELTA, 'page')
  }

  // Track nested scroller edges so repeated input can leave the section reliably.
  const markInitialInnerEdges = () => {
    document.querySelectorAll(innerSelector).forEach((inner) => {
      const overflow = hasOverflow(inner)
      const top = inner.scrollTop <= 0
      const bottom = overflow && inner.scrollTop + inner.clientHeight >= inner.scrollHeight
      const previous = innerScrollStates.get(inner)
      if (overflow) {
        if (!previous && top) recordEdge(inner, -1)
        if (!previous && bottom) recordEdge(inner, 1)
        if (previous && top && !previous.top) recordEdge(inner, -1)
        if (previous && bottom && !previous.bottom) recordEdge(inner, 1)
      }
      innerScrollStates.set(inner, { top: overflow && top, bottom })

      if (!registeredInnerScrolls.has(inner)) {
        registeredInnerScrolls.add(inner)
        // Record when a nested scroller reaches its top or bottom.
        inner.addEventListener('scroll', () => {
          const nextOverflow = hasOverflow(inner)
          const nextTop = nextOverflow && inner.scrollTop <= 0
          const nextBottom = nextOverflow && inner.scrollTop + inner.clientHeight >= inner.scrollHeight
          const last = innerScrollStates.get(inner) || { top: false, bottom: false }
          if (nextTop && !last.top) recordEdge(inner, -1)
          if (nextBottom && !last.bottom) recordEdge(inner, 1)
          innerScrollStates.set(inner, { top: nextTop, bottom: nextBottom })
        }, { passive: true })
      }
    })
  }

  // Apply a small resisted offset while touch input is blocked at a scroll edge.
  const animateRubberBand = (section, deltaY) => {
    const offset = Math.sign(deltaY) * Math.min(
      scrollConfig.RUBBER_BAND_MAX,
      Math.abs(deltaY) * scrollConfig.RUBBER_BAND_RESISTANCE,
    )
    gsap.set(section, { y: offset })
  }

  // Return a rubber-banded section to its resting position.
  const releaseRubberBand = (section) => {
    if (!section) return
    gsap.to(section, {
      y: 0,
      duration: scrollConfig.RUBBER_BAND_RETURN_DURATION,
      ease: 'power3.out',
    })
  }

  // Capture the start of a single-finger gesture and its nested-scroll state.
  const onTouchStart = (event) => {
    if (event.touches.length !== 1) {
      touchGesture = null
      return
    }

    const touch = event.touches[0]
    const target = event.target
    const section = sections[currentIndex]
    const inner = targetInner(target, section)
    const times = inner ? edgeTimes.get(inner) || {} : {}
    const topAtStart = inner ? inner.scrollTop <= 0 : false
    const bottomAtStart = inner
      ? inner.scrollTop + inner.clientHeight >= inner.scrollHeight
      : false

    touchGesture = {
      section,
      inner,
      carousel: target instanceof Element && target.closest('.beginning-images'),
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startedAt: performance.now(),
      wallStartedAt: Date.now(),
      topAtStart,
      bottomAtStart,
      edgeAtStart: times,
      axis: '',
      edgeCandidate: false,
      reachedEdge: false,
      nativeRefresh: false,
      blocked: isLocked(),
    }
  }

  // Route vertical swipes to nested scrolling or full-page navigation.
  const onTouchMove = (event) => {
    if (!touchGesture || event.touches.length !== 1) return
    const touch = event.touches[0]
    const deltaX = touch.clientX - touchGesture.startX
    const deltaY = touch.clientY - touchGesture.startY
    touchGesture.currentX = touch.clientX
    touchGesture.currentY = touch.clientY

    // Let Android handle downward pulls at the page top as native refresh gestures.
    if (touchGesture.nativeRefresh) return
    if (currentIndex === 0 && window.scrollY <= 1 && deltaY > 0 && !touchGesture.inner) {
      touchGesture.nativeRefresh = true
      return
    }

    if (touchGesture.blocked || isLocked()) {
      if (event.cancelable) event.preventDefault()
      return
    }

    if (touchGesture.carousel && !touchGesture.axis) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < scrollConfig.CAROUSEL_AXIS_LOCK_DISTANCE) return
      touchGesture.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
    }

    if (touchGesture.axis === 'x') return

    const direction = Math.sign(-deltaY)
    if (!direction) return
    lastMovementDirection = direction

    const inner = touchGesture.inner
    if (inner && hasOverflow(inner) && canInnerScroll(inner, direction)) {
      touchGesture.edgeCandidate = false
      return
    }

    if (event.cancelable) event.preventDefault()

    if (inner && hasOverflow(inner)) {
      const atStart = direction > 0
        ? touchGesture.bottomAtStart
        : touchGesture.topAtStart
      const key = edgeKey(direction)
      let edgeAtStart = touchGesture.edgeAtStart[key]
      if (atStart && !edgeAtStart) {
        recordEdge(inner, direction, touchGesture.wallStartedAt)
        edgeAtStart = touchGesture.wallStartedAt
      }

      if (!atStart) {
        touchGesture.reachedEdge = true
        const times = edgeTimes.get(inner) || {}
        if (!times[key]) recordEdge(inner, direction)
        touchGesture.edgeCandidate = false
        animateRubberBand(touchGesture.section, deltaY)
        return
      }

      touchGesture.edgeCandidate = Boolean(
        edgeAtStart &&
        touchGesture.wallStartedAt - edgeAtStart >= scrollConfig.EDGE_COOLDOWN,
      )
      animateRubberBand(touchGesture.section, deltaY)
      return
    }

    animateRubberBand(touchGesture.section, deltaY)
  }

  // Decide whether a completed swipe should change sections.
  const finishTouch = () => {
    if (!touchGesture) return
    const gesture = touchGesture
    touchGesture = null

    if (gesture.nativeRefresh) return
    if (gesture.axis === 'x' || gesture.blocked) {
      releaseRubberBand(gesture.section)
      return
    }

    const deltaY = gesture.startY - gesture.currentY
    const distance = Math.abs(deltaY)
    const elapsed = Math.max(
      (performance.now() - gesture.startedAt) / 1000,
      scrollConfig.TOUCH_MIN_ELAPSED_SECONDS,
    )
    const velocity = distance / elapsed
    const direction = Math.sign(deltaY)
    const deliberate = distance >= scrollConfig.TOUCH_MIN_DISTANCE &&
      velocity >= scrollConfig.TOUCH_MIN_VELOCITY
    const canLeaveInner = !gesture.inner ||
      !hasOverflow(gesture.inner) ||
      (gesture.edgeCandidate && !gesture.reachedEdge)

    if (deliberate && canLeaveInner && direction) {
      gsap.set(gesture.section, { y: 0 })
      goToSection(currentIndex + direction, direction)
    } else {
      releaseRubberBand(gesture.section)
    }
  }

  // Snap the page to the closest section after native or animated scrolling settles.
  const syncSettledPosition = () => {
    if (isAnimating) return
    if (Date.now() < suppressSettleUntil) {
      scheduleSettledPosition()
      return
    }
    const passthrough = passthroughAt(window.scrollY)
    if (passthrough) {
      if (activeIndex >= 0 && activeIndex === lastJumpTargetIndex) {
        scrollInstantly(sectionTop(sections[activeIndex]))
        return
      }
      if (Date.now() < lockUntil) {
        scheduleSettledPosition()
        return
      }
      let targetIndex = lastMovementDirection > 0
        ? sections.findIndex((section) => sectionTop(section) > window.scrollY)
        : sections.reduce((previous, section, index) => (
          sectionTop(section) < window.scrollY ? index : previous
        ), -1)
      if (targetIndex === currentIndex) {
        targetIndex = currentIndex + Math.sign(window.scrollY - sectionTop(sections[currentIndex]))
      }
      if (targetIndex >= 0 && targetIndex < sections.length) {
        goToSection(targetIndex, lastMovementDirection)
      } else {
        syncToStop(nearestStopIndex(window.scrollY), false)
      }
      return
    }

    const index = nearestStopIndex(window.scrollY)
    if (Math.abs(sectionTop(sections[index]) - window.scrollY) > 1) {
      syncToStop(index, false, false)
    } else if (index !== activeIndex) {
      activateSection(index)
    }
  }

  // Debounce scroll settling until jumps and short input locks finish.
  const scheduleSettledPosition = () => {
    window.clearTimeout(settleTimer)
    const delay = Math.max(
      scrollConfig.SCROLLEND_DEBOUNCE,
      suppressSettleUntil - Date.now(),
      lockUntil - Date.now(),
    )
    settleTimer = window.setTimeout(syncSettledPosition, delay)
  }

  // Initialize the active section from the URL hash or current scroll position.
  const syncInitialPosition = () => {
    const hashTarget = location.hash ? document.getElementById(location.hash.slice(1)) : null
    const stopTarget = findSectionForTarget(hashTarget)
    const targetIndex = stopTarget
      ? sections.indexOf(stopTarget)
      : nearestStopIndex(hashTarget
        ? hashTarget.getBoundingClientRect().top + window.scrollY
        : window.scrollY)
    syncToStop(Math.max(0, targetIndex), activeIndex < 0)
  }

  // Recalculate section positions after viewport dimensions change.
  const onResize = () => {
    ScrollTrigger.refresh()
    markInitialInnerEdges()
    if (isAnimating) return
    const inPassthrough = passthroughAt(window.scrollY)
    const targetIndex = inPassthrough
      ? nearestStopIndex(window.scrollY)
      : activeIndex >= 0 ? activeIndex : nearestStopIndex(window.scrollY)
    syncToStop(targetIndex, false, Boolean(inPassthrough) || targetIndex !== activeIndex)
  }

  sections.forEach(hideSection)
  markInitialInnerEdges()

  syncInitialPosition()

  // Keep the active section synchronized with manual scroll movement.
  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastWindowY
    if (delta) lastMovementDirection = Math.sign(delta)
    lastWindowY = window.scrollY
    scheduleSettledPosition()
  }, { passive: true })

  window.addEventListener('scrollend', syncSettledPosition)
  window.addEventListener('resize', onResize)
  window.addEventListener('hashchange', syncInitialPosition)
  window.addEventListener('popstate', syncInitialPosition)

  // Handle wheel input inside nested scrollers without allowing page-level default scroll.
  document.addEventListener('wheel', (event) => {
    if (event.target instanceof Element && event.target.closest(innerSelector)) {
      handleWheel(event)
    }
  }, { capture: true, passive: false })

  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
  document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
  document.addEventListener('touchend', finishTouch, { capture: true, passive: true })
  // Release any touch feedback if the browser cancels the gesture.
  document.addEventListener('touchcancel', () => {
    if (touchGesture) releaseRubberBand(touchGesture.section)
    touchGesture = null
  }, { capture: true, passive: true })

  // Map keyboard navigation keys to section jumps while preserving normal form controls.
  window.addEventListener('keydown', (event) => {
    const target = event.target
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !(target instanceof Element) ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
      target.isContentEditable
    ) return

    const directions = {
      ArrowDown: 1,
      PageDown: 1,
      Space: 1,
      ArrowUp: -1,
      PageUp: -1,
    }
    const direction = directions[event.code] || directions[event.key]
    if (!direction) return
    if (isLocked()) {
      event.preventDefault()
      return
    }
    if (
      direction > 0 &&
      (event.code === 'Space' || event.key === ' ') &&
      target.closest('a, button, [role="button"]')
    ) return

    const inner = getInnerScroll(sections[currentIndex])
    if (inner && hasOverflow(inner) && canInnerScroll(inner, direction)) return

    event.preventDefault()
    goToSection(currentIndex + direction, direction)
  })

  // Route internal links through the same section navigation logic.
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a[href^="#"]')
    if (!link) return

    const target = document.getElementById(link.hash.slice(1))
    if (!target) return
    event.preventDefault()

    const stop = findSectionForTarget(target)
    if (stop) {
      const index = sections.indexOf(stop)
      if (index === currentIndex) {
        syncToStop(index, false)
      } else {
        goToSection(index, Math.sign(index - currentIndex))
      }
      return
    }

    if (target.closest('[data-section="passthrough"]')) {
      const index = nearestStopIndex(target.getBoundingClientRect().top + window.scrollY)
      syncToStop(index, false)
    }
  })

  // Capture wheel gestures outside nested scrollers for full-page navigation.
  const observer = Observer.create({
    target: window,
    type: 'wheel',
    preventDefault: true,
    ignore: ['[data-inner-scroll]', '[data-masonry-scroll]'],
    onChangeY: (self) => {
      if (self.event?.type === 'wheel' && !(self.event.target instanceof Element && self.event.target.closest(innerSelector))) {
        handleWheel(self.event)
      }
    },
  })

  const workTitle = document.querySelector('.work-divider')
  if (workTitle) {
    // Reveal the standalone Work divider when it enters the viewport.
    const text = revealElements(workTitle, 'text')
    if (reducedMotion) {
      revealBackground(workTitle)
      gsap.set(text, { clearProps: 'transform,opacity,visibility,willChange' })
      gsap.set(text, { x: 0, opacity: 1, visibility: 'visible' })
    } else {
      gsap.set(text, { x: 40, opacity: 0, visibility: 'hidden' })
      const timeline = gsap.timeline({ paused: true })
      timeline.addLabel('text', revealConfig.BG_DURATION * revealConfig.TEXT_START_PROGRESS)
        .set(text, { visibility: 'visible', willChange: 'transform, opacity' }, 'text')
        .fromTo(text, { x: 40, opacity: 0 }, {
          x: 0,
          opacity: 1,
          duration: revealConfig.TEXT_DURATION,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility,willChange',
        }, 'text')

      // Reset the divider when it leaves view so it can replay on return.
      const resetWorkTitle = () => {
        resetBackground(workTitle)
        timeline.pause(0)
        gsap.set(text, { x: 40, opacity: 0, visibility: 'hidden' })
      }
      // Replay the divider's text and background wipe on either entry direction.
      const playWorkTitle = () => {
        revealBackground(workTitle)
        gsap.set(text, { x: 40, opacity: 0, visibility: 'hidden' })
        timeline.restart()
      }
      ScrollTrigger.create({
        trigger: workTitle,
        start: 'top 82%',
        onEnter: playWorkTitle,
        onEnterBack: playWorkTitle,
        onLeave: resetWorkTitle,
        onLeaveBack: resetWorkTitle,
      })
    }
  }

  const marquee = document.querySelector('.marquee')
  if (marquee) {
    if (reducedMotion) {
      revealBackground(marquee)
    } else {
      // Replay the marquee background wipe whenever it enters the viewport.
      const animateMarqueeBackground = () => revealBackground(marquee)
      const resetMarqueeBackground = () => resetBackground(marquee)
      ScrollTrigger.create({
        trigger: marquee,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: animateMarqueeBackground,
        onEnterBack: animateMarqueeBackground,
        onLeave: resetMarqueeBackground,
        onLeaveBack: resetMarqueeBackground,
      })
    }
  }

  // Pause infinite decorative animations while their elements are offscreen.
  const loopObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'
    })
  })
  const loopElements = Array.from(document.querySelectorAll('.marquee-track, .hero, .hero *'))
    .filter((element) => getComputedStyle(element).animationIterationCount.includes('infinite'))
  loopElements.forEach((element) => {
    loopObserver.observe(element)
  })

  // Refresh scroll triggers after fonts, images, or the full page finish loading.
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
    image.addEventListener('error', () => ScrollTrigger.refresh(), { once: true })
  })
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })

  return observer
}
