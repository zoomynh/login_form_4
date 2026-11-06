// Сторінка адміністратора: дешифрування користувачів і побудова таблиці

const session = requireRole("admin");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function renderUsers() {
  const admin = await getAdmin(session.login);
  document.getElementById("adminName").textContent = admin ? admin.fullName : session.login;

  const users = await getAllUsers();          // дешифрування кожного запису
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";
  users.forEach((u, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(u.fullName)}</td>
      <td>${escapeHtml(u.login)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone)}</td>
      <td class="mono">${escapeHtml(u.passwordHash.slice(0, 16))}…</td>
      <td>${escapeHtml(u.registeredAt)}</td>
      <td><button class="btn small danger" data-login="${escapeHtml(u.login)}">Видалити</button></td>`;
    tbody.appendChild(row);
  });
  document.getElementById("emptyText").classList.toggle("hidden", users.length > 0);

  tbody.querySelectorAll("button[data-login]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (confirm(`Видалити користувача ${btn.dataset.login}?`)) {
        await deleteUser(btn.dataset.login);
        renderUsers();
      }
    })
  );

  // Показ сирих (зашифрованих) даних
  document.getElementById("rawData").textContent =
    getEncryptedUsers().map((s, i) => `[${i}] ${s}`).join("\n\n") || "(порожньо)";
}

renderUsers();
