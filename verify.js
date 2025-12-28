// Handle verification submit and call backend to validate token
(function () {
  const LS_KEY = 'humanVerified';
  const VERIFY_ENDPOINT = 'https://YOUR_WORKER_SUBDOMAIN.workers.dev/verify'; // Replace with your deployed endpoint

  function getRedirectTarget() {
    const params = new URLSearchParams(location.search);
    return params.get('redirect') || '/';
  }

  async function verifyWithServer(token) {
    try {
      if (VERIFY_ENDPOINT.includes('YOUR_WORKER_SUBDOMAIN')) {
        // No backend configured yet; fail open after client check with a warning.
        return { success: true, _note: 'No server endpoint configured; client-only pass.' };
      }
      const res = await fetch(VERIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  }

  function setMessage(msg, isError) {
    const el = document.getElementById('verifyMsg');
    if (el) {
      el.textContent = msg || '';
      el.style.color = isError ? '#dc2626' : 'var(--text-light)';
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    const btn = document.getElementById('verifyBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        const token = (window.grecaptcha && window.grecaptcha.getResponse && window.grecaptcha.getResponse()) || '';
        if (!token) {
          setMessage('Please complete the reCAPTCHA checkbox first.', true);
          return;
        }

        setMessage('Verifying…');
        const result = await verifyWithServer(token);
        if (result && result.success) {
          localStorage.setItem(LS_KEY, 'true');
          const target = getRedirectTarget();
          location.replace(target);
        } else {
          setMessage('Verification failed. Please try again.', true);
          if (window.grecaptcha && grecaptcha.reset) grecaptcha.reset();
        }
      } catch (e) {
        setMessage('Unexpected error. Please try again.', true);
      }
    });
  });
})();
