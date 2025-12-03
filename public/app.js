// -------- Utils généraux --------
function getCurrentPage() {
  const body = document.querySelector('body');
  return body ? body.getAttribute('data-page') : null;
}

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  window.location.href = '/';
}

// Afficher l’email de l’utilisateur connecté dans le header (si présent)
function displayCurrentUserEmail() {
  const span = document.getElementById('current-user-email');
  if (!span) return;
  const user = getCurrentUser();
  if (user && user.email) {
    span.textContent = user.email + (user.role ? ' (' + user.role + ')' : '');
  } else {
    span.textContent = '';
  }
}

// Forcer la connexion pour certaines pages
function requireLogin() {
  const token = getToken();
  if (!token) {
    window.location.href = '/';
    return null;
  }
  return token;
}

// -------- LOGIN / REGISTER --------
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-message');
  const registerForm = document.getElementById('register-form');
  const registerMsg = document.getElementById('register-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginMsg.textContent = '';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          loginMsg.textContent = data.error || 'Erreur de connexion.';
          loginMsg.style.color = 'red';
          return;
        }

        setToken(data.token);
        setCurrentUser(data.user);

        loginMsg.textContent = 'Connexion réussie. Redirection...';
        loginMsg.style.color = 'green';

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 700);

      } catch (err) {
        console.error(err);
        loginMsg.textContent = 'Erreur serveur.';
        loginMsg.style.color = 'red';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      registerMsg.textContent = '';

      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value.trim();
      const role = document.getElementById('register-role').value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        if (!res.ok) {
          registerMsg.textContent = data.error || 'Erreur lors de la création du compte.';
          registerMsg.style.color = 'red';
          return;
        }

        registerMsg.textContent = 'Compte créé avec succès. Vous pouvez vous connecter.';
        registerMsg.style.color = 'green';
        registerForm.reset();

      } catch (err) {
        console.error(err);
        registerMsg.textContent = 'Erreur serveur.';
        registerMsg.style.color = 'red';
      }
    });
  }
}

// -------- DASHBOARD : Liste & création de projets --------
async function loadProjects() {
  const listContainer = document.getElementById('projects-list');
  if (!listContainer) return;

  const token = requireLogin();
  if (!token) return;

  try {
    const res = await fetch('/api/projects', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!res.ok) {
      listContainer.innerHTML = '<p>Erreur lors du chargement des projets.</p>';
      return;
    }

    const projects = await res.json();

    if (projects.length === 0) {
      listContainer.innerHTML = '<p>Aucun projet pour le moment. Créez votre premier chantier ci-dessus.</p>';
      return;
    }

    listContainer.innerHTML = '';

    projects.forEach(p => {
      const div = document.createElement('div');
      div.className = 'project-item';
      div.innerHTML = `
        <a href="/project?id=${p.id}">${p.name}</a>
        <div><small>${p.location} • Statut : ${p.status}</small></div>
      `;
      listContainer.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    listContainer.innerHTML = '<p>Erreur réseau lors du chargement des projets.</p>';
  }
}

function initProjectForm() {
  const form = document.getElementById('project-form');
  const message = document.getElementById('form-message');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';

    const token = requireLogin();
    if (!token) return;

    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const type = document.getElementById('type').value.trim();
    const surface = document.getElementById('surface').value;
    const budget = document.getElementById('budget').value;

    if (!name || !location) {
      message.textContent = 'Merci de remplir au minimum le nom et la localisation.';
      message.style.color = 'red';
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name, location, type, surface, budget })
      });

      const data = await res.json();

      if (!res.ok) {
        message.textContent = data.error || 'Erreur lors de la création du projet.';
        message.style.color = 'red';
        return;
      }

      message.textContent = 'Projet créé avec succès !';
      message.style.color = 'green';
      form.reset();
      loadProjects();

    } catch (err) {
      console.error(err);
      message.textContent = 'Erreur réseau.';
      message.style.color = 'red';
    }
  });
}

// -------- PAGE PROJET : Détail --------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadProjectDetail() {
  const id = getQueryParam('id');
  if (!id) return;

  const token = requireLogin();
  if (!token) return;

  try {
    const res = await fetch(`/api/projects/${id}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('project-name').textContent = data.error || 'Projet introuvable';
      return;
    }

    const p = data;

    document.getElementById('project-name').textContent = p.name;
    document.getElementById('project-id').textContent = p.id;
    document.getElementById('project-location').textContent = p.location || '-';
    document.getElementById('project-type').textContent = p.type || '-';
    document.getElementById('project-surface').textContent = p.surface || '-';
    document.getElementById('project-budget').textContent = p.budget || '-';
    document.getElementById('project-status').textContent = p.status || '-';
    document.getElementById('project-createdAt').textContent =
      p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '-';

  } catch (err) {
    console.error(err);
    document.getElementById('project-name').textContent = 'Erreur de chargement';
  }
}

// -------- INIT --------
document.addEventListener('DOMContentLoaded', () => {
  const page = getCurrentPage();

  if (page === 'login') {
    initLoginForm();
  } else if (page === 'dashboard') {
    requireLogin();
    displayCurrentUserEmail();
    loadProjects();
    initProjectForm();
  } else if (page === 'project') {
    requireLogin();
    displayCurrentUserEmail();
    loadProjectDetail();
  } else if (page === 'confidentialite') {
    displayCurrentUserEmail();
  }
});
