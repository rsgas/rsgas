import { heroHeadlines } from '../data/hero-headlines.js'

export function renderHero() {
  return `
    <section class="hero" id="home" data-section="stop" data-reveal="bg" data-scrollbar-theme="dark" aria-labelledby="hero-title">
      <p class="hero-kicker" data-reveal="text">Cinematographer <span>×</span> Director</p>
      <h1 id="hero-title" class="hero-title" data-reveal="text" aria-live="off">
        <span class="hero-title-window" data-hero-title-slider>
          ${heroHeadlines.map((headline, index) => `
            <span class="hero-title-slide" aria-hidden="${index !== 0}">
              <span class="hero-title-slide-content">${headline.before}<em>${headline.emphasis}</em></span>
            </span>
          `).join('')}
        </span>
      </h1>
      <div class="hero-bottom" data-reveal="text">
        <p>MUHAMAD RIZKY IBRAHIM<br>BANDUNG, INDONESIA</p>
        <a class="hero-cta" href="#beginning" aria-label="Scroll to the beginning">Discover <span>↓</span></a>
      </div>
    </section>
  `
}
