// Browser-side anonymous interest only. Never accepts names, payments, or personal details.
for (const form of document.querySelectorAll('form[data-need-id]')) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const status = form.querySelector('[role="status"]');
    button.disabled = true;
    status.textContent = 'Recording anonymous interest…';
    try {
      const response = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needId: form.dataset.needId, kind: form.querySelector('select').value
        })
      });
      if (!response.ok) throw Error('Refused');
      status.textContent = 'Interest noted. Please speak with your church steward to arrange help. Nothing was pledged or completed here.';
    } catch {
      status.textContent = 'Interest could not be recorded. You can still speak with your steward.';
    } finally {
      button.disabled = false;
    }
  });
}
