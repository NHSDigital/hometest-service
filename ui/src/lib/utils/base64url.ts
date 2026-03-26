export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const base64 = btoa(binary);
  const paddingStart = base64.indexOf("=");
  const unpadded = paddingStart >= 0 ? base64.slice(0, paddingStart) : base64;
  return unpadded.replaceAll(/\+/g, "-").replaceAll(/\//g, "_");
}

export function base64UrlDecode(input: string): string {
  const base64 =
    input.replaceAll(/-/g, "+").replaceAll(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}
