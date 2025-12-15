// =====================
// Utilitaires généraux
// =====================

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

function getCurrentUser() {
  const raw = localStorage.getItem('currentUser');
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
  clearToken();
  window.location.href = '/';
}

// Affiche l’email dans le header si connecté
function updateHeaderUserEmail() {
  const span = document.getElementById('current-user-email');
  if (!span) return;
  const user = getCurrentUser();
  span.textContent = user ? user.email : '';
}

// =====================
// Page LOGIN
// =====================

function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginMsg = document.getElementById('login-message');
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

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Erreur de connexion');
        }

        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);

        loginMsg.textContent = 'Connexion réussie. Redirection...';
        loginMsg.style.color = 'green';

        setTimeout(() => {
          // Redirection en fonction du rôle (pour l’instant MOA vers /dashboard)
          if (data.user.role === 'MOA') {
            window.location.href = '/dashboard';
          } else {
            // Plus tard : gérer Architecte, BET, etc.
            window.location.href = '/dashboard';
          }
        }, 700);
      } catch (err) {
        console.error(err);
        loginMsg.textContent = err.message;
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

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Erreur lors de la création du compte');
        }

        registerMsg.textContent = 'Compte créé. Vous pouvez vous connecter.';
        registerMsg.style.color = 'green';
        registerForm.reset();
      } catch (err) {
        console.error(err);
        registerMsg.textContent = err.message;
        registerMsg.style.color = 'red';
      }
    });
  }
}

// =====================
// Page DASHBOARD (MOA)
// =====================

function initDashboardPage() {
  updateHeaderUserEmail();
  loadProjects();

  const form = document.getElementById('create-project-form');
  const msg = document.getElementById('create-project-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    const payload = {
      name: document.getElementById('project-name-input').value.trim(),
      location: document.getElementById('project-location-input').value.trim(),
      type: document.getElementById('project-type-input').value.trim(),
      surface: document.getElementById('project-surface-input').value || null,
      budget: document.getElementById('project-budget-input').value || null,
    };

    if (!payload.name || !payload.location) {
      msg.textContent = 'Nom et localisation sont obligatoires.';
      msg.style.color = 'red';
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la création du projet');
      }

      const project = await res.json();
      msg.textContent = 'Projet créé avec succès.';
      msg.style.color = 'green';
      form.reset();
      appendProjectToList(project);

    } catch (err) {
      console.error(err);
      msg.textContent = err.message;
      msg.style.color = 'red';
    }
  });
}

async function loadProjects() {
  const token = getToken();
  if (!token) {
    window.location.href = '/';
    return;
  }

  const list = document.getElementById('projects-list');
  if (!list) return;

  list.innerHTML = '<p>Chargement des projets...</p>';

  try {
    const res = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Erreur lors du chargement des projets');
    }

    const projects = await res.json();

    if (!projects.length) {
      list.innerHTML = '<p>Aucun projet pour le moment.</p>';
      return;
    }

    list.innerHTML = '';
    projects.forEach(appendProjectToList);
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p>Erreur lors du chargement des projets.</p>';
  }
}

function appendProjectToList(project) {
  const list = document.getElementById('projects-list');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'project-item';

  const link = document.createElement('a');
  link.href = `/project?id=${project.id}`;
  link.textContent = project.name;

  const meta = document.createElement('p');
  meta.textContent = `${project.location} • Statut : ${project.status || 'En cours'}`;

  item.appendChild(link);
  item.appendChild(meta);
  list.appendChild(item);
}

// =====================
// Page PROJECT (détail + édition MOA + bouton "terminé")
// =====================

function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProjectDetail() {
  updateHeaderUserEmail();

  const projectId = getProjectIdFromUrl();
  if (!projectId) return;

  const token = getToken();
  if (!token) {
    window.location.href = '/';
    return;
  }

  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Erreur lors du chargement du projet');
    }

    const project = await res.json();

    // Affichage des infos
    document.getElementById('project-name').textContent = project.name;
    document.getElementById('project-id').textContent = project.id;
    document.getElementById('project-location').textContent = project.location;
    document.getElementById('project-type').textContent = project.type || '-';
    document.getElementById('project-surface').textContent = project.surface || '-';
    document.getElementById('project-budget').textContent = project.budget || '-';
    document.getElementById('project-status').textContent = project.status || '-';
    document.getElementById('project-created-at').textContent = project.created_at
      ? new Date(project.created_at).toLocaleString()
      : '-';

    // Pré-remplir le formulaire d’édition
    const editName = document.getElementById('edit-name');
    const editLocation = document.getElementById('edit-location');
    const editType = document.getElementById('edit-type');
    const editSurface = document.getElementById('edit-surface');
    const editBudget = document.getElementById('edit-budget');
    const editStatus = document.getElementById('edit-status');

    if (editName) editName.value = project.name || '';
    if (editLocation) editLocation.value = project.location || '';
    if (editType) editType.value = project.type || '';
    if (editSurface) editSurface.value = project.surface || '';
    if (editBudget) editBudget.value = project.budget || '';
    if (editStatus && project.status) editStatus.value = project.status;

  } catch (err) {
    console.error(err);
  }
}

function initEditProjectForm() {
  const form = document.getElementById('edit-project-form');
  if (!form) return;

  const messageEl = document.getElementById('edit-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const projectId = getProjectIdFromUrl();
    if (!projectId) return;

    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    const payload = {
      name: document.getElementById('edit-name').value.trim(),
      location: document.getElementById('edit-location').value.trim(),
      type: document.getElementById('edit-type').value.trim(),
      surface: document.getElementById('edit-surface').value || null,
      budget: document.getElementById('edit-budget').value || null,
      status: document.getElementById('edit-status').value
    };

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }

      const updatedProject = await res.json();

      // Met à jour l’affichage
      document.getElementById('project-name').textContent = updatedProject.name;
      document.getElementById('project-id').textContent = updatedProject.id;
      document.getElementById('project-location').textContent = updatedProject.location;
      document.getElementById('project-type').textContent = updatedProject.type || '-';
      document.getElementById('project-surface').textContent = updatedProject.surface || '-';
      document.getElementById('project-budget').textContent = updatedProject.budget || '-';
      document.getElementById('project-status').textContent = updatedProject.status || '-';

      messageEl.textContent = 'Projet mis à jour avec succès.';
      messageEl.style.color = 'green';
    } catch (err) {
      console.error(err);
      messageEl.textContent = err.message;
      messageEl.style.color = 'red';
    }
  });
}

// ⭐ Bouton "Marquer comme terminé"
function initMarkCompleteButton() {
  const btn = document.getElementById('mark-complete-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const token = getToken();
    if (!token) {
      window.location.href = '/';
      return;
    }

    const projectId = getProjectIdFromUrl();
    if (!projectId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Complet' })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
      }

      const updatedProject = await res.json();
      document.getElementById('project-status').textContent = updatedProject.status || '-';

      const msg = document.getElementById('edit-message');
      if (msg) {
        msg.textContent = 'Projet marqué comme complet.';
        msg.style.color = 'green';
      }
    } catch (err) {
      console.error(err);
      const msg = document.getElementById('edit-message');
      if (msg) {
        msg.textContent = err.message;
        msg.style.color = 'red';
      }
    }
  });
}

// =====================
// Initialisation globale
// =====================

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const page = body.getAttribute('data-page');

  if (page === 'login') {
    initLoginPage();
  } else if (page === 'dashboard') {
    initDashboardPage();
  } else if (page === 'project') {
    loadProjectDetail();
    initEditProjectForm();
    initMarkCompleteButton(); // ⭐ bouton "terminé"
  } else {
    updateHeaderUserEmail();
  }
});
