/**
 * Copia al portapapeles.
 *
 * `navigator.clipboard` no existe en contextos no seguros ni durante el render
 * en servidor, así que la función informa de si ha podido copiar en lugar de
 * fallar en silencio: la interfaz necesita saberlo para no confirmar algo que
 * no ha ocurrido.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
