// Which build is this?
//
// The hosted artifact is one page with no account and no counting; the web build (VITE_TARGET=web)
// has the optional sign-in and the anonymous counts. This one constant decides, and the bundler
// reads it at build time: what it guards is simply not in the artifact's files at all.

export const WEB_TARGET = import.meta.env.PROD === true && import.meta.env.VITE_TARGET === 'web';
