const grayscale = ['#424242', '#505050', '#5d5d5d', '#6a6a6a', '#777777', '#858585', '#929292', '#a0a0a0', '#adadad', '#bababa', '#686868', '#999999']

export function grayPlaceholder(width, height, index) {
  const background = grayscale[index % grayscale.length]
  const foreground = grayscale[(index + 5) % grayscale.length]
  const accent = grayscale[(index + 8) % grayscale.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice"><rect width="100%" height="100%" fill="${background}"/><circle cx="${width * 0.5}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.12}" fill="${accent}" opacity=".72"/><path d="M0 ${height * 0.78} L${width * 0.28} ${height * 0.56} L${width * 0.5} ${height * 0.34} L${width * 0.72} ${height * 0.56} L${width} ${height * 0.75} V${height} H0Z" fill="${foreground}" opacity=".7"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
