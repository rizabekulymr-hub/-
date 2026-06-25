const form = document.querySelector('#supportForm');
const statusText = document.querySelector('#status');
const submitBtn = document.querySelector('#submitBtn');

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = `status ${type || ''}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Жіберіліп жатыр...', '');
  submitBtn.disabled = true;

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Қате шықты.');
    }

    setStatus(result.message, 'success');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'Жіберу мүмкін болмады.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
