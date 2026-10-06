import { timingSafeEqual } from "node:crypto";

//for password hashing and verifying

const encoder = new TextEncoder();

//Fallback constants
const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 64;

const bytesToBase64 = (bytes: Uint8Array): string => {
    return btoa(String.fromCharCode(...bytes));
}

const base64ToBytes = (value: string) => {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export const hashPassword = async (password: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        HASH_LENGTH
    )

    return [
        "pbkdf2",
        "sha-256",
        ITERATIONS,
        bytesToBase64(salt),
        bytesToBase64(new Uint8Array(hash))
    ].join("$")
}

export const verifyPassword = async (password: string, hash: string) => {
    const [algorithm, hashingAlgorithm, iterationString, saltString, hashString] = hash?.split("$");



    // Make sure the stored format is valid
    if (
        algorithm !== "pbkdf2" ||
        hashingAlgorithm !== "sha-256" ||
        !iterationString ||
        !saltString ||
        !hashString
    ) {
        return false;
    }

    const iterations = Number(iterationString);

    //salt in hash to bytes
    const salt = base64ToBytes(saltString);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    )

    const hashBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        HASH_LENGTH
    )
    const calculatedHash = new Uint8Array(hashBits);
    const storedHash = base64ToBytes(hashString);

    const result =
        storedHash.byteLength === calculatedHash.byteLength &&
        timingSafeEqual(storedHash, calculatedHash);

    return result;
}