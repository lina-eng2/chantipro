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

function updateHeaderUserEmail() {
  const span = document.getElementById('current-user-email');
  if (!span) return;
  const user = getCurrentUser();
  span.textContent = user ? user.email : '';
}

// =====================
// Routing par rôle (front)
// =====================

function normalizeRole(role) {
  if (!role) return '';
  return String(role).trim().toLowerCase();
}

const ROLE_ROUTES = {
  moa: '/dashboard/moa',
  architecte: '/dashboard/architecte',
  amoa: '/dashboard/amoa',
  bet: '/dashboard/bet',
  bct: '/dashboard/bct',
  labo: '/dashboard/labo',
  topographe: '/dashboard/topographe',
};

function getDashboardRouteForRole(role) {
  const key = normalizeRole(role);
  return ROLE_ROUTES[key] || '/dashboard/moa';
}

// =====================
// Page LOGIN (login.html)
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
          window.location.href = getDashboardRouteForRole(data.user.role);
        }, 400);

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
// Projets : liste + affichage (utilisé par plusieurs rôles)
// =====================

async function loadProjectsToContainer(containerId = 'projects-list') {
  const token = getToken();
  if (!token) {
    window.location.href = '/';
    return;
  }

  const list = document.getElementById(containerId);
  if (!list) return;

  list.innerHTML = '<p>Chargement des projets...</p>';

  try {
    const res = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Erreur lors du chargement des projets');
    }

    const projects = await res.json();

    if (!projects.length) {
      list.innerHTML = '<p>Aucun projet pour le moment.</p>';
      return;
    }

    list.innerHTML = '';
    projects.forEach((p) => appendProjectToList(p, containerId));

  } catch (err) {
    console.error(err);
    list.innerHTML = '<p>Erreur lors du chargement des projets.</p>';
  }
}

function appendProjectToList(project, containerId = 'projects-list') {
  const list = document.getElementById(containerId);
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
  list.prepend(item);
}

// =====================
// Dashboard MOA (dashboard-moa.html)
// =====================

function initDashboardMOAPage() {
  updateHeaderUserEmail();

  const token = getToken();
  if (!token) {
    window.location.href = '/';
    return;
  }

  loadProjectsToContainer('projects-list');

  // dashboard-moa.html doit avoir ces IDs :
  // form id="create-project-form"
  // p id="create-project-message"
  // inputs: project-name-input, project-location-input, project-type-input, project-surface-input, project-budget-input
  const form = document.getElementById('create-project-form');
  const msg = document.getElementById('create-project-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (msg) {
      msg.textContent = '';
      msg.style.color = 'inherit';
    }

    const payload = {
      name: document.getElementById('project-name-input')?.value.trim(),
      location: document.getElementById('project-location-input')?.value.trim(),
      type: document.getElementById('project-type-input')?.value.trim() || '',
      surface: document.getElementById('project-surface-input')?.value || null,
      budget: document.getElementById('project-budget-input')?.value || null,
    };

    if (!payload.name || !payload.location) {
      if (msg) {
        msg.textContent = 'Nom et localisation sont obligatoires.';
        msg.style.color = 'red';
      }
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

      if (msg) {
        msg.textContent = 'Projet créé avec succès.';
        msg.style.color = 'green';
      }

      form.reset();
      appendProjectToList(project, 'projects-list');

    } catch (err) {
      console.error(err);
      if (msg) {
        msg.textContent = err.message;
        msg.style.color = 'red';
      }
    }
  });
}

// =====================
// Dashboards autres rôles (minimalistes)
// =====================

function initGenericRoleDashboard(containerId = 'projects-list') {
  updateHeaderUserEmail();
  loadProjectsToContainer(containerId);
}

function initAMOAPage() { initGenericRoleDashboard('projects-list'); }
function initBETPage() { initGenericRoleDashboard('projects-list'); }
function initBCTPage() { initGenericRoleDashboard('projects-list'); }
function initLaboPage() { initGenericRoleDashboard('projects-list'); }
function initTopographePage() { initGenericRoleDashboard('projects-list'); }

// =====================
// Page PROJECT (project.html)
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
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Erreur lors du chargement du projet');
    }

    const project = await res.json();

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

      document.getElementById('project-name').textContent = updatedProject.name;
      document.getElementById('project-location').textContent = updatedProject.location;
      document.getElementById('project-type').textContent = updatedProject.type || '-';
      document.getElementById('project-surface').textContent = updatedProject.surface || '-';
      document.getElementById('project-budget').textContent = updatedProject.budget || '-';
      document.getElementById('project-status').textContent = updatedProject.status || '-';

      if (messageEl) {
        messageEl.textContent = 'Projet mis à jour avec succès.';
        messageEl.style.color = 'green';
      }

    } catch (err) {
      console.error(err);
      if (messageEl) {
        messageEl.textContent = err.message;
        messageEl.style.color = 'red';
      }
    }
  });
}

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
// Dashboard Architecte (dashboard-architecte.html)
// =====================

async function initArchitectePage() {
  updateHeaderUserEmail();

  const token = getToken();
  if (!token) { window.location.href = '/'; return; }

  const select = document.getElementById("archi-project-select");
  const list = document.getElementById("archi-doc-list");
  const form = document.getElementById("archi-upload-form");
  const msg = document.getElementById("archi-upload-msg");

  if (!select || !list || !form || !msg) return;

  const resProjects = await fetch("/api/projects", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!resProjects.ok) {
    msg.textContent = "Impossible de charger les projets.";
    msg.style.color = "red";
    return;
  }

  const projects = await resProjects.json();
  select.innerHTML = "";
  projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.location})`;
    select.appendChild(opt);
  });

  async function loadDocs(projectId) {
    list.innerHTML = "<p>Chargement...</p>";

    const res = await fetch(`/api/documents/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      list.innerHTML = `<p>Erreur: ${data.error || "chargement documents"}</p>`;
      return;
    }

    const docs = await res.json();
    if (!docs.length) { list.innerHTML = "<p>Aucun document.</p>"; return; }

    list.innerHTML = "";
    docs.forEach(d => {
      const div = document.createElement("div");
      div.className = "project-item";

      const a = document.createElement("a");
      a.href = d.storage_path;
      a.target = "_blank";
      a.textContent = `[${d.doc_type}] ${d.filename}`;

      div.appendChild(a);

      if (d.doc_type === "convention") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-secondary";
        btn.textContent = "Signer la convention";
        btn.style.marginLeft = "10px";

        btn.onclick = async () => {
          const r = await fetch(`/api/documents/${projectId}/sign/${d.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await r.json().catch(() => ({}));
          alert(r.ok ? "Convention signée ✅" : (data.error || "Erreur signature"));
        };

        div.appendChild(btn);
      }

      list.appendChild(div);
    });
  }

  if (select.value) loadDocs(select.value);
  select.addEventListener("change", () => loadDocs(select.value));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.style.color = "inherit";

    const projectId = select.value;
    const fileInput = document.getElementById("archi-file");
    const type = document.getElementById("archi-doc-type").value;

    if (!projectId) { msg.textContent = "Choisis un projet."; msg.style.color="red"; return; }
    if (!fileInput?.files?.[0]) { msg.textContent = "Choisis un fichier."; msg.style.color="red"; return; }

    const fd = new FormData();
    fd.append("doc_type", type);
    fd.append("file", fileInput.files[0]);

    const r = await fetch(`/api/documents/${projectId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      msg.textContent = data.error || "Erreur upload";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Document uploadé ✅";
    msg.style.color = "green";
    fileInput.value = "";
    loadDocs(projectId);
  });
}

// =====================
// Initialisation globale
// =====================

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page');

  if (page === 'login') initLoginPage();
  else if (page === 'dashboard-moa') initDashboardMOAPage();
  else if (page === 'dashboard-architecte') initArchitectePage();
  else if (page === 'dashboard-amoa') initAMOAPage();
  else if (page === 'dashboard-bet') initBETPage();
  else if (page === 'dashboard-bct') initBCTPage();
  else if (page === 'dashboard-labo') initLaboPage();
  else if (page === 'dashboard-topographe') initTopographePage();
  else if (page === 'project') {
    loadProjectDetail();
    initEditProjectForm();
    initMarkCompleteButton();
  } else {
    updateHeaderUserEmail();
  }
});
