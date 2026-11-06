// Логіка сторінки авторизації та реєстрації

const $ = (id) => document.getElementById(id);

// Перемикання вкладок «Вхід» / «Реєстрація»
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    $("loginForm").classList.toggle("hidden", !isLogin);
    $("registerForm").classList.toggle("hidden", isLogin);
  });
});

function showError(id, text) {
  const span = document.querySelector(`.error[data-for="${id}"]`);
  span.textContent = text || "";
  $(id).classList.toggle("invalid", !!text);
}

function showMessage(id, text, ok) {
  const box = $(id);
  box.textContent = text;
  box.className = "message " + (ok ? "ok" : "fail");
}

// Перевірка полів реєстрації
async function validateRegistration(data) {
  let valid = true;
  const check = (id, condition, text) => {
    showError(id, condition ? "" : text);
    if (!condition) valid = false;
  };
  check("regFullName", data.fullName.trim().split(/\s+/).length >= 2,
        "Вкажіть прізвище та ім'я");
  check("regLogin", /^[a-zA-Z0-9_]{3,20}$/.test(data.login),
        "Логін: 3–20 символів (латиниця, цифри, _)");
  check("regEmail", /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email),
        "Некоректний email");
  check("regPhone", /^\+380\d{9}$/.test(data.phone),
        "Формат телефону: +380XXXXXXXXX");
  check("regPassword", data.password.length >= 8 &&
        /[a-zA-Z]/.test(data.password) && /\d/.test(data.password),
        "Пароль: від 8 символів, обов'язково літери й цифри");
  check("regPassword2", data.password === data.password2 && data.password2 !== "",
        "Паролі не збігаються");

  if (valid) {
    const users = await getAllUsers();
    const busy = users.some((u) => u.login === data.login) || data.login === "admin";
    check("regLogin", !busy, "Такий логін уже зареєстровано");
  }
  return valid;
}

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    fullName: $("regFullName").value,
    login: $("regLogin").value.trim(),
    email: $("regEmail").value.trim(),
    phone: $("regPhone").value.trim(),
    password: $("regPassword").value,
    password2: $("regPassword2").value,
  };
  if (!(await validateRegistration(data))) {
    showMessage("registerMessage", "Виправте помилки у формі", false);
    return;
  }
  const { salt, hash } = await hashPassword(data.password);
  // Об'єкт користувача шифрується цілком перед записом у LocalStorage
  await addUser({
    fullName: data.fullName.trim(),
    login: data.login,
    email: data.email,
    phone: data.phone,
    salt,
    passwordHash: hash,
    registeredAt: new Date().toLocaleString("uk-UA"),
  });
  $("registerForm").reset();
  showMessage("registerMessage",
    "Реєстрація успішна! Дані зашифровано (AES-GCM) і збережено в LocalStorage.", true);
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const login = $("loginName").value.trim();
  const password = $("loginPassword").value;
  const asAdmin = $("isAdmin").checked;

  showError("loginName", login ? "" : "Введіть логін");
  showError("loginPassword", password ? "" : "Введіть пароль");
  if (!login || !password) return;

  // Адміністратор перевіряється за базою IndexedDB, користувач — за LocalStorage
  const account = asAdmin
    ? await getAdmin(login)
    : (await getAllUsers()).find((u) => u.login === login);

  if (account) {
    const { hash } = await hashPassword(password, account.salt, account.iterations);
    if (hash === account.passwordHash) {
      setSession(login, asAdmin ? "admin" : "user");
      location.href = asAdmin ? "admin.html" : "user.html";
      return;
    }
  }
  showMessage("loginMessage", "Невірний логін або пароль", false);
});
