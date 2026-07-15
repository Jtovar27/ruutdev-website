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
    { href: '/', en: 'Home', es: 'Inicio' },
    { href: '/solutions', en: 'Solutions', es: 'Soluciones' },
    { href: '/work', en: 'Work', es: 'Proyectos' },
    { href: '/process', en: 'Process', es: 'Proceso' },
    { href: '/about', en: 'About', es: 'Acerca de' },
    { href: '/contact', en: 'Contact', es: 'Contacto' }
  ]),
  pricing: Object.freeze({
    websitePlans: Object.freeze([
      { id: 'simple', setup: 149, monthly: 45, checkoutId: 'monthly-simple-setup', checkoutUrl: 'https://buy.stripe.com/aFafZi9HF6FK7vBd0k4Vy00' },
      { id: 'standard', setup: 249, monthly: 97, checkoutId: 'monthly-standard-setup', checkoutUrl: 'https://buy.stripe.com/6oU7sM8DB5BG5nt3pK4Vy01' },
      { id: 'growth', setup: 399, monthly: 145, checkoutId: 'monthly-growth-setup', checkoutUrl: 'https://buy.stripe.com/eVq6oI2fd4xC5nt7G04Vy02' }
    ]),
    oneTime: Object.freeze({ starter: 800, business: 1500, advanced: 2500 }),
    deposits: Object.freeze({
      website: Object.freeze({ amount: 500, checkoutUrl: 'https://buy.stripe.com/4gM3cw4nlfcgdTZaSc4Vy03' }),
      softwareAutomation: Object.freeze({ amount: 750, checkoutUrl: 'https://buy.stripe.com/7sYaEY2fd1lq4jpf8s4Vy04' })
    })
  }),
  // Public only after the owner confirms status, permission, and evidence.
  projects: Object.freeze([]),
  socialLinks: Object.freeze([]),
  legalLinks: Object.freeze([
    { href: '/privacy', en: 'Privacy', es: 'Privacidad' },
    { href: '/terms', en: 'Terms', es: 'Términos' }
  ]),
  legal: Object.freeze({ businessMailingAddress: '4561 Teoli Ct, Kissimmee, FL 34746, USA' }),
  analytics: Object.freeze({ provider: null, measurementId: null }),
  seo: Object.freeze({
    home: Object.freeze({ enTitle: 'RuutDev | Bilingual Websites and Business Systems', esTitle: 'RuutDev | Websites bilingües y sistemas empresariales', enDescription: 'RuutDev builds bilingual websites, custom business systems, and practical automation for service businesses in Florida and beyond.', esDescription: 'RuutDev construye websites bilingües, sistemas empresariales personalizados y automatizaciones prácticas para negocios de servicios en Florida y otros mercados.' }),
    solutions: Object.freeze({ enTitle: 'Solutions | RuutDev', esTitle: 'Soluciones | RuutDev', enDescription: 'Explore bilingual websites, custom business systems, and practical automation for service businesses.', esDescription: 'Explora websites bilingües, sistemas empresariales personalizados y automatizaciones prácticas para negocios de servicios.' }),
    websites: Object.freeze({ enTitle: 'Conversion Websites | RuutDev', esTitle: 'Websites de conversión | RuutDev', enDescription: 'Bilingual, mobile-first websites with lead capture, accessibility, performance, SEO, and analytics foundations.', esDescription: 'Websites bilingües y mobile-first con captación, accesibilidad, rendimiento y bases de SEO y analytics.' }),
    businessSystems: Object.freeze({ enTitle: 'Custom Business Systems | RuutDev', esTitle: 'Sistemas empresariales personalizados | RuutDev', enDescription: 'Custom portals, internal tools, dashboards, reporting, and workflows shaped around real business operations.', esDescription: 'Portales, herramientas internas, dashboards, reportes y flujos adaptados a las operaciones reales del negocio.' }),
    automationAi: Object.freeze({ enTitle: 'Automation and AI | RuutDev', esTitle: 'Automatización e IA | RuutDev', enDescription: 'Practical, supervised automation for routing, classification, summaries, tasks, connected tools, and structured follow-up.', esDescription: 'Automatización práctica y supervisada para routing, clasificación, resúmenes, tareas, herramientas conectadas y seguimiento.' }),
    work: Object.freeze({ enTitle: 'Work | RuutDev', esTitle: 'Proyectos | RuutDev', enDescription: 'Selected RuutDev work is published with accurate project status and verified details.', esDescription: 'Los proyectos seleccionados de RuutDev se publican con estado correcto y detalles verificados.' }),
    process: Object.freeze({ enTitle: 'Process | RuutDev', esTitle: 'Proceso | RuutDev', enDescription: 'A clear six-step process for understanding, scoping, building, validating, launching, and improving digital projects.', esDescription: 'Un proceso claro de seis etapas para entender, definir, construir, validar, lanzar y mejorar proyectos digitales.' }),
    about: Object.freeze({ enTitle: 'About RuutDev | Independent Development Studio', esTitle: 'Acerca de RuutDev | Estudio independiente', enDescription: 'RuutDev is an independent, founder-led development studio based in Florida and serving clients in English and Spanish.', esDescription: 'RuutDev es un estudio independiente dirigido por su fundador, con sede en Florida y servicio en inglés y español.' }),
    pricing: Object.freeze({ enTitle: 'Pricing | RuutDev Website Plans and Custom Builds', esTitle: 'Precios | Planes y proyectos personalizados de RuutDev', enDescription: 'Compare managed website plans, one-time website builds, and custom systems from RuutDev.', esDescription: 'Compara planes administrados, websites de pago único y sistemas personalizados de RuutDev.' }),
    contact: Object.freeze({ enTitle: 'Start a Project | RuutDev', esTitle: 'Iniciar un proyecto | RuutDev', enDescription: 'Tell RuutDev what your service business is trying to improve. No technical vocabulary required.', esDescription: 'Cuéntale a RuutDev qué necesita mejorar tu negocio de servicios. No necesitas vocabulario técnico.' }),
    privacy: Object.freeze({ enTitle: 'Privacy Policy | RuutDev', esTitle: 'Política de privacidad | RuutDev', enDescription: 'How RuutDev collects, uses, and protects personal information.', esDescription: 'Cómo RuutDev recopila, utiliza y protege la información personal.' }),
    terms: Object.freeze({ enTitle: 'Terms and Conditions | RuutDev', esTitle: 'Términos y condiciones | RuutDev', enDescription: 'Terms governing RuutDev development services, payments, intellectual property, and support.', esDescription: 'Términos que rigen los servicios, pagos, propiedad intelectual y soporte de RuutDev.' }),
    pay: Object.freeze({ enTitle: 'Make a Payment | RuutDev', esTitle: 'Realizar un pago | RuutDev', enDescription: 'Secure RuutDev client payments for approved website plans and project deposits.', esDescription: 'Pagos seguros para planes aprobados y depósitos de proyectos de RuutDev.' }),
    paymentSuccess: Object.freeze({ enTitle: 'Payment Received | RuutDev', esTitle: 'Pago recibido | RuutDev', enDescription: 'Payment confirmation and next steps for RuutDev clients.', esDescription: 'Confirmación de pago y próximos pasos para clientes de RuutDev.' }),
    projectIntake: Object.freeze({ enTitle: 'Project Intake | RuutDev', esTitle: 'Formulario de proyecto | RuutDev', enDescription: 'Secure project intake form for approved RuutDev clients.', esDescription: 'Formulario seguro para proyectos aprobados de RuutDev.' }),
    notFound: Object.freeze({ enTitle: 'Page Not Found | RuutDev', esTitle: 'Página no encontrada | RuutDev', enDescription: 'The requested RuutDev page could not be found.', esDescription: 'No se encontró la página solicitada de RuutDev.' })
  })
});
