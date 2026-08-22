const KEY = 0xa5;
const CIPHER = [
  156, 148, 246, 192, 215, 193, 196, 215, 229, 194, 200, 196, 204, 201, 139, 198, 202, 200,
];

function reveal(): string {
  return String.fromCharCode(...CIPHER.map((n) => n ^ KEY));
}

function bind(button: HTMLButtonElement): void {
  button.addEventListener("click", () => {
    const addr = reveal();
    const link = document.createElement("a");
    link.href = `mailto:${addr}`;
    link.rel = "nofollow noopener";
    link.textContent = addr;
    button.replaceWith(link);
  });
}

document.querySelectorAll<HTMLButtonElement>("[data-mail]").forEach(bind);
