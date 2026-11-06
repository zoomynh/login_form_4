// Модуль шифрування: AES-GCM (256 біт) через Web Crypto API.
// Ключ отримується з парольної фрази застосунку функцією PBKDF2.

const APP_PASSPHRASE = "KAI-TECH-585KB-web-crypto";
const APP_KEY_SALT = "secureapp-static-salt-v1";
const PBKDF2_ITERATIONS = 100000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let cachedKey = null;

// Отримання симетричного ключа AES з парольної фрази
async function getAesKey() {
  if (cachedKey) return cachedKey;
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(APP_PASSPHRASE), "PBKDF2", false, ["deriveKey"]
  );
  cachedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(APP_KEY_SALT),
      iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return cachedKey;
}

// Шифрування об'єкта: JSON -> AES-GCM -> base64 (iv:шифротекст)
async function encryptData(obj) {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = enc.encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return toBase64(iv) + ":" + toBase64(cipher);
}

// Дешифрування рядка, створеного encryptData
async function decryptData(packed) {
  const [ivB64, dataB64] = packed.split(":");
  const key = await getAesKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivB64) }, key, fromBase64(dataB64)
  );
  return JSON.parse(dec.decode(plain));
}

// Хешування пароля PBKDF2-SHA-256 з індивідуальною сіллю
async function hashPassword(password, saltB64, iterations = PBKDF2_ITERATIONS) {
  const salt = saltB64 ? fromBase64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, baseKey, 256
  );
  return { salt: toBase64(salt), hash: toBase64(bits) };
}
