import gsap from 'gsap'
import { scrollConfig } from '../config/scroll.js'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function mountBeginningCarousel() {
  const viewport = document.querySelector('.beginning-images')
  const track = viewport?.querySelector('.beginning-track')
  if (!viewport || !track) return

  const originals = Array.from(track.children)
  if (!originals.length) return

  let axis = ''
  let origin = 0
  let loopLength = 0
  let position = 0
  let velocity = 0
  let wheelBoost = 0
  let isVisible = false
  let mediaEntered = false
  let isPressed = false
  let pointerId = null
  let dragAxis = ''
  let lastCoordinate = 0
  let startCoordinate = 0
  let startCrossCoordinate = 0
  let lastPointerTime = 0

  const coordinate = (rect) => axis === 'x' ? rect.left : rect.top
  const wrapPosition = (value) => gsap.utils.wrap(origin, origin + loopLength, value)

  const draw = () => {
    gsap.set(track, {
      x: axis === 'x' ? -position : 0,
      y: axis === 'y' ? -position : 0,
    })
  }

  const rebuild = () => {
    axis = window.matchMedia('(max-width: 900px)').matches ? 'x' : 'y'
    gsap.set(track, { x: 0, y: 0 })
    track.replaceChildren(...originals)
    originals.forEach((frame) => track.append(frame.cloneNode(true)))

    const firstRect = originals[0].getBoundingClientRect()
    const nextRect = track.children[originals.length].getBoundingClientRect()
    const loop = coordinate(nextRect) - coordinate(firstRect)
    if (!loop) return

    const visibleLength = axis === 'x' ? viewport.clientWidth : viewport.clientHeight
    const copiesEachSide = Math.max(1, Math.ceil(visibleLength / loop))

    track.replaceChildren()
    for (let copy = -copiesEachSide; copy <= copiesEachSide; copy += 1) {
      originals.forEach((frame) => {
        const node = copy === 0 ? frame : frame.cloneNode(true)
        if (copy !== 0) {
          node.setAttribute('aria-hidden', 'true')
          node.querySelectorAll('img').forEach((image) => {
            image.alt = ''
          })
        }
        track.append(node)
      })
    }

    const originalStart = copiesEachSide * originals.length
    const trackRect = track.getBoundingClientRect()
    const originalRect = track.children[originalStart].getBoundingClientRect()
    const nextSetRect = track.children[originalStart + originals.length].getBoundingClientRect()
    origin = coordinate(originalRect) - coordinate(trackRect)
    loopLength = coordinate(nextSetRect) - coordinate(originalRect)
    position = origin
    velocity = reducedMotion ? 0 : scrollConfig.CAROUSEL_BASE_SPEED
    wheelBoost = 0
    draw()
  }

  const io = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting
  })
  io.observe(viewport)
  viewport.addEventListener('sectionmediarevealcomplete', () => {
    mediaEntered = true
  })
  viewport.addEventListener('sectionrevealreset', () => {
    mediaEntered = false
  })

  const resizeObserver = new ResizeObserver(rebuild)
  resizeObserver.observe(viewport)
  rebuild()

  gsap.ticker.add((_, deltaTime) => {
    if (!isVisible || !mediaEntered || isPressed || !loopLength) return
    const elapsed = Math.min(deltaTime / 1000, scrollConfig.CAROUSEL_MAX_FRAME_DELTA)
    if (!elapsed) return

    wheelBoost *= Math.exp(-elapsed / scrollConfig.CAROUSEL_BOOST_DECAY)
    const baseSpeed = reducedMotion ? 0 : scrollConfig.CAROUSEL_BASE_SPEED
    const targetVelocity = baseSpeed + wheelBoost
    const decay = scrollConfig.CAROUSEL_DRAG_DECAY
    velocity += (targetVelocity - velocity) * (1 - Math.exp(-elapsed / decay))
    position = wrapPosition(position + velocity * elapsed)
    draw()
  })

  viewport.addEventListener('wheel', (event) => {
    if (reducedMotion || axis !== 'y') return
    wheelBoost = gsap.utils.clamp(
      -scrollConfig.CAROUSEL_BOOST_LIMIT,
      scrollConfig.CAROUSEL_BOOST_LIMIT,
      wheelBoost + event.deltaY * scrollConfig.CAROUSEL_WHEEL_BOOST,
    )
  }, { passive: true })

  const getPointerCoordinates = (event) => axis === 'x'
    ? [event.clientX, event.clientY]
    : [event.clientY, event.clientX]

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    isPressed = true
    pointerId = event.pointerId
    dragAxis = ''
    const [primary, cross] = getPointerCoordinates(event)
    startCoordinate = primary
    lastCoordinate = primary
    startCrossCoordinate = cross
    lastPointerTime = performance.now()
    velocity = 0
    viewport.dataset.dragging = 'true'
    viewport.setPointerCapture(pointerId)
  })

  viewport.addEventListener('pointermove', (event) => {
    if (!isPressed || event.pointerId !== pointerId) return
    const [primary, cross] = getPointerCoordinates(event)
    const primaryDelta = primary - startCoordinate
    const crossDelta = cross - startCrossCoordinate

    if (!dragAxis && Math.max(Math.abs(primaryDelta), Math.abs(crossDelta)) >= scrollConfig.CAROUSEL_AXIS_LOCK_DISTANCE) {
      dragAxis = Math.abs(primaryDelta) >= Math.abs(crossDelta) ? axis : axis === 'x' ? 'y' : 'x'
    }

    if (dragAxis === axis) {
      event.preventDefault()
      const now = performance.now()
      const elapsed = (now - lastPointerTime) / 1000
      const movement = primary - lastCoordinate
      position = wrapPosition(position - movement)
      if (elapsed > 0) velocity = -movement / elapsed
      draw()
      lastPointerTime = now
    }
    lastCoordinate = primary
  })

  const releasePointer = (event) => {
    if (!isPressed || event.pointerId !== pointerId) return
    isPressed = false
    pointerId = null
    viewport.removeAttribute('data-dragging')
    velocity = dragAxis === axis && !reducedMotion
      ? gsap.utils.clamp(
        -scrollConfig.CAROUSEL_DRAG_SPEED_LIMIT,
        scrollConfig.CAROUSEL_DRAG_SPEED_LIMIT,
        velocity,
      )
      : reducedMotion ? 0 : scrollConfig.CAROUSEL_BASE_SPEED
  }

  viewport.addEventListener('pointerup', releasePointer)
  viewport.addEventListener('pointercancel', releasePointer)
  viewport.addEventListener('lostpointercapture', releasePointer)
}
