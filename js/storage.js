// Робота зі сховищами: IndexedDB (адміністратори) та LocalStorage (користувачі).

const DB_NAME = "SecureAppDB";
const DB_VERSION = 1;
const USERS_KEY = "secureapp_users";
const SESSION_KEY = "secureapp_session";

// Відкриття бази даних IndexedDB і початкове заповнення з db/admins.json
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("admins", { keyPath: "login" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function seedAdmins() {
  const db = await openDb();
  const count = await new Promise((res) => {
    const r = db.transaction("admins").objectStore("admins").count();
    r.onsuccess = () => res(r.result);
  });
  if (count > 0) return;
  const admins = await (await fetch("db/admins.json")).json();
  const tx = db.transaction("admins", "readwrite");
  admins.forEach((a) => tx.objectStore("admins").put(a));
  await new Promise((res) => (tx.oncomplete = res));
}

async function getAdmin(login) {
  await seedAdmins();
  const db = await openDb();
  return new Promise((res) => {
    const r = db.transaction("admins").objectStore("admins").get(login);
    r.onsuccess = () => res(r.result || null);
  });
}

// Користувачі: масив зашифрованих рядків у LocalStorage
function getEncryptedUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

async function getAllUsers() {
  const list = getEncryptedUsers();
  const users = [];
  for (const item of list) users.push(await decryptData(item));
  return users;
}

async function saveAllUsers(users) {
  const encrypted = [];
  for (const u of users) encrypted.push(await encryptData(u));
  localStorage.setItem(USERS_KEY, JSON.stringify(encrypted));
}

async function addUser(user) {
  const users = await getAllUsers();
  users.push(user);
  await saveAllUsers(users);
}

async function deleteUser(login) {
  const users = (await getAllUsers()).filter((u) => u.login !== login);
  await saveAllUsers(users);
}

// Сесія (sessionStorage): хто увійшов і з якою роллю
function setSession(login, role) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ login, role }));
}
function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "index.html";
}
function requireRole(role) {
  const s = getSession();
  if (!s || s.role !== role) location.href = "index.html";
  return s;
}
