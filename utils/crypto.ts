// E2EE Utilities using Web Crypto API

// 1. Generate User Identity Keys (RSA-OAEP for Key Exchange)
export async function generateIdentityKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// 2. Export Key to JWK (for storage/transmission)
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return window.crypto.subtle.exportKey("jwk", key);
}

// 3. Import Public Key from JWK
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// 4. Import Private Key from JWK
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// 5. Generate Symmetric Key for Conversation (AES-GCM)
export async function generateConversationKey() {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// 6. Wrap Conversation Key for a Participant (Encrypt AES key with RSA Public Key)
export async function wrapKey(symmetricKey: CryptoKey, recipientPublicKey: CryptoKey): Promise<string> {
  // Export symmetric key first
  const rawKey = await window.crypto.subtle.exportKey("raw", symmetricKey);
  
  // Encrypt the raw key
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawKey
  );
  
  return arrayBufferToBase64(encrypted);
}

// 7. Unwrap Conversation Key (Decrypt AES key with my RSA Private Key)
export async function unwrapKey(encryptedKeyBase64: string, myPrivateKey: CryptoKey): Promise<CryptoKey> {
  const encrypted = base64ToArrayBuffer(encryptedKeyBase64);
  
  const rawKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    myPrivateKey,
    encrypted
  );
  
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// 8. Encrypt Message Content
export async function encryptMessage(text: string, conversationKey: CryptoKey): Promise<{ content: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    conversationKey,
    encoded
  );
  
  return {
    content: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  };
}

// 9. Decrypt Message Content
export async function decryptMessage(encryptedContent: string, ivBase64: string, conversationKey: CryptoKey): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedContent);
  const iv = base64ToArrayBuffer(ivBase64);
  
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      conversationKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "[Decryption Error]";
  }
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
