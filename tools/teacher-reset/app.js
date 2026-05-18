const form = document.querySelector('#reset-form');
const projectUrlInput = document.querySelector('#project-url');
const teacherCodeInput = document.querySelector('#teacher-code');
const usernameInput = document.querySelector('#username');
const newPasswordInput = document.querySelector('#new-password');
const submitButton = document.querySelector('#submit-button');
const statusBox = document.querySelector('#status');

const STORAGE_KEY = 'ellie_teacher_reset_project_url';

const setStatus = (message, type) => {
  statusBox.textContent = message;
  statusBox.className = `status is-${type}`;
};

const clearStatus = () => {
  statusBox.textContent = '';
  statusBox.className = 'status';
};

const normalizeProjectUrl = (value) => value.trim().replace(/\/+$/, '');

const normalizeUsername = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');

const getReadableError = async (response) => {
  try {
    const data = await response.json();
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {}

  return `Reset failed (${response.status}).`;
};

projectUrlInput.value = localStorage.getItem(STORAGE_KEY) || '';

projectUrlInput.addEventListener('input', () => {
  localStorage.setItem(STORAGE_KEY, normalizeProjectUrl(projectUrlInput.value));
});

usernameInput.addEventListener('input', () => {
  usernameInput.value = normalizeUsername(usernameInput.value);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();

  const projectUrl = normalizeProjectUrl(projectUrlInput.value);
  const teacherCode = teacherCodeInput.value.trim();
  const username = normalizeUsername(usernameInput.value);
  const newPassword = newPasswordInput.value;

  if (!projectUrl || !teacherCode || !username || !newPassword) {
    setStatus('Fill in every field first.', 'error');
    return;
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
    setStatus('Use your Supabase project URL, like https://your-project-ref.supabase.co.', 'error');
    return;
  }

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    setStatus('Username must be 3 to 32 letters, numbers, dots, dashes, or underscores.', 'error');
    return;
  }

  if (newPassword.length < 6 || newPassword.length > 72) {
    setStatus('New password must be 6 to 72 characters.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Resetting...';

  try {
    const response = await fetch(`${projectUrl}/functions/v1/teacher-reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-teacher-secret': teacherCode,
      },
      body: JSON.stringify({
        username,
        newPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(await getReadableError(response));
    }

    setStatus(`Password reset for ${username}. Give the student their new password.`, 'success');
    newPasswordInput.value = '';
    newPasswordInput.focus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Reset failed.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Reset password';
  }
});
