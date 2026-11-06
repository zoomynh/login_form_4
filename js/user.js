// Сторінка користувача: привітання і демонстрація AES-GCM

const session = requireRole("user");
let lastCipher = null;

(async () => {
  const me = (await getAllUsers()).find((u) => u.login === session.login);
  document.getElementById("userName").textContent = me ? me.fullName : session.login;
})();

document.getElementById("encryptBtn").addEventListener("click", async () => {
  const text = document.getElementById("demoText").value;
  lastCipher = await encryptData(text);
  document.getElementById("demoOut").textContent = "Шифротекст (IV:дані):\n" + lastCipher;
});

document.getElementById("decryptBtn").addEventListener("click", async () => {
  const out = document.getElementById("demoOut");
  if (!lastCipher) {
    out.textContent = "Спочатку зашифруйте текст.";
    return;
  }
  const plain = await decryptData(lastCipher);
  out.textContent = "Шифротекст:\n" + lastCipher + "\n\nРозшифровано:\n" + plain;
});
