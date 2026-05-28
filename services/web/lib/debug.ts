function isDebugEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_VOICE_DEBUG === "true" ||
    process.env.VOICE_DEBUG === "true"
  );
}

export function isVoiceDebugEnabled(): boolean {
  return isDebugEnabled();
}

export function debugLog(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!isDebugEnabled()) {
    return;
  }

  const prefix = `[VoiceSupport:${scope}]`;

  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export function debugWarn(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!isDebugEnabled()) {
    return;
  }

  const prefix = `[VoiceSupport:${scope}]`;

  if (data !== undefined) {
    console.warn(prefix, message, data);
  } else {
    console.warn(prefix, message);
  }
}

export function debugError(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!isDebugEnabled()) {
    return;
  }

  const prefix = `[VoiceSupport:${scope}]`;

  if (data !== undefined) {
    console.error(prefix, message, data);
  } else {
    console.error(prefix, message);
  }
}
