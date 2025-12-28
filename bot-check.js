// Lightweight bot suspicion heuristics + redirect to verification
(function () {
  try {
    const LS_KEY = 'humanVerified';
    const alreadyVerified = localStorage.getItem(LS_KEY) === 'true';

    function isLikelyBot() {
      const ua = navigator.userAgent || '';
      const hints = [
        () => navigator.webdriver === true,
        () => /HeadlessChrome|PhantomJS|Playwright|Puppeteer/i.test(ua),
        () => /bot|crawler|spider|crawling/i.test(ua),
        () => (navigator.languages || []).length === 0,
        () => (navigator.plugins || []).length === 0,
      ];
      return hints.some((fn) => {
        try { return !!fn(); } catch { return false; }
      });
    }

    function shouldChallenge() {
      const params = new URLSearchParams(location.search);
      if (params.get('forceCaptcha') === 'true') return true;
      if (alreadyVerified) return false;
      return isLikelyBot();
    }

    function redirectToVerify() {
      const target = '/verify.html?redirect=' + encodeURIComponent(location.pathname + location.search + location.hash);
      // Avoid loops
      if (!location.pathname.endsWith('/verify.html')) {
        location.replace(target);
      }
    }

    // Run ASAP after DOM is ready
    if (shouldChallenge()) {
      redirectToVerify();
    }
  } catch (e) {
    // Fail open — do nothing if any error
  }
})();
