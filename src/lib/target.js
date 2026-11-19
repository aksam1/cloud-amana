// Which build is this?
//
// The hosted artifact is one page with no account and no counting; the web build (VITE_TARGET=web)
// has the optional sign-in and the anonymous counts. This one constant decides, and the bundler
// reads it at build time: the code it guards (the counts' sending, the sign-in) is dropped from the
// artifact's files. Page text written for both builds may remain there, never shown.

export const WEB_TARGET = import.meta.env.PROD === true && import.meta.env.VITE_TARGET === 'web';
