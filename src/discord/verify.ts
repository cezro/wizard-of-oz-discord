import nacl from "tweetnacl";

function hexToUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g);
  if (!pairs) throw new Error("Invalid hex string");
  return new Uint8Array(pairs.map((byte) => parseInt(byte, 16)));
}

export function verifyDiscordRequest(
  publicKeyHex: string,
  signature: string,
  timestamp: string,
  body: string,
): boolean {
  try {
    const publicKey = hexToUint8Array(publicKeyHex);
    const sig = hexToUint8Array(signature);
    const timestampBytes = new TextEncoder().encode(timestamp);
    const bodyBytes = new TextEncoder().encode(body);
    const message = new Uint8Array(timestampBytes.length + bodyBytes.length);
    message.set(timestampBytes);
    message.set(bodyBytes, timestampBytes.length);
    return nacl.sign.detached.verify(message, sig, publicKey);
  } catch {
    return false;
  }
}
