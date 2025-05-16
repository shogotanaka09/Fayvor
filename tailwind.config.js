module.exports = {
	mode: 'jit',
	content: [
    './public/*.html'
  ],
	theme: {
    screens: {
      mobile: '0px',
      // > iPhone Max (Portlait)
      tablet: '429px',
      // > iPad Pro (Portlait)
      desktop: '835px',
      wide: '1440px'
    },
    spacing: Object.assign({}, ...[...Array(101)].map((_, index) => ({ [index]: `${index}px`}))),
    extend: {},
  },
	variants: {},
	plugins: [],
  important: true
}