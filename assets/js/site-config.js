/** @typedef {'en'|'es'} Locale */
/** @typedef {'client'|'demo'|'concept'} ProjectStatus */

window.RUUTDEV = Object.freeze({
  business: Object.freeze({
    name: 'RuutDev',
    email: 'helloruutdev@hotmail.com',
    phoneDisplay: '+1 (407) 694-6371',
    phone: '+14076946371',
    whatsapp: 'https://wa.me/14076946371',
    location: 'Florida, USA'
  }),
  features: Object.freeze({ futureProductEnabled: false, analyticsEnabled: false }),
  languages: Object.freeze(['en', 'es']),
  navigation: Object.freeze([
    { href: '/solutions', en: 'Solutions', es: 'Soluciones' },
    { href: '/work', en: 'Work', es: 'Proyectos' },
    { href: '/process', en: 'Process', es: 'Proceso' },
    { href: '/about', en: 'About', es: 'Acerca de' },
    { href: '/contact', en: 'Contact', es: 'Contacto' }
  ]),
  pricing: Object.freeze({
    websitePlans: Object.freeze([
      { id: 'simple', setup: 149, monthly: 45 },
      { id: 'standard', setup: 249, monthly: 97 },
      { id: 'growth', setup: 399, monthly: 145 }
    ]),
    oneTime: Object.freeze({ starter: 800, business: 1500, advanced: 2500 })
  }),
  projects: Object.freeze([
    { slug: 'taxes-insurance-group', title: 'Taxes Insurance Group', status: 'client', industry: 'Tax and insurance services', services: ['Website', 'Bilingual experience'], featured: true, liveUrl: null },
    { slug: 'la-cafebreria', title: 'La Cafebrería', status: 'client', industry: 'Hospitality', services: ['Website', 'Content structure'], featured: true, liveUrl: null },
    { slug: 'acaballo-equestrian-school', title: 'AC.aballo Equestrian School', status: 'client', industry: 'Equestrian education', services: ['Website', 'Lead capture'], featured: true, liveUrl: null }
  ]),
  analytics: Object.freeze({ provider: null, measurementId: null })
});
