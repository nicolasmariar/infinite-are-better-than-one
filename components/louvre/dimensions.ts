/**
 * Dimensiones compartidas de la sala y el nicho de la Gioconda.
 * Un solo lugar para que Room + Vitrine + GiocondaFrame estén coherentes.
 */

// Sala
export const ROOM_WIDTH = 14;
export const ROOM_HEIGHT = 5.5;
export const ROOM_DEPTH = 12;
export const WALL_THICKNESS = 0.2;
export const WALL_FRONT_Z = -ROOM_DEPTH / 2; // -6 — cara frontal de la pared trasera

// Hueco / nicho donde va la Gioconda (recorte rectangular en la pared trasera)
export const NICHE_W = 3;
export const NICHE_H = 3.8;
// La base del nicho está a la altura de la parte superior de la tarima:
// el "cajón" exterior de madera llega hasta acá por fuera de la pared.
export const NICHE_BOTTOM_Y = 1.05;
export const NICHE_TOP_Y = NICHE_BOTTOM_Y + NICHE_H; // 4.85
export const NICHE_LEFT_X = -NICHE_W / 2;
export const NICHE_RIGHT_X = NICHE_W / 2;
export const NICHE_CENTER_Y = (NICHE_BOTTOM_Y + NICHE_TOP_Y) / 2; // 2.75
export const NICHE_DEPTH = 0.45; // cuánto se mete el nicho hacia atrás desde la pared

// Fondo del nicho (donde cuelga el cuadro)
export const NICHE_BACK_Z = WALL_FRONT_Z - NICHE_DEPTH; // -6.45

// Posición del centro del cuadro
export const GIOCONDA_Y = 2.2; // altura del centro del cuadro
export const GIOCONDA_Z = NICHE_BACK_Z + 0.04; // pegado al fondo del nicho

// Vidrio protector — al ras de la pared frontal
export const GLASS_Z = WALL_FRONT_Z + 0.003; // ligerísimamente por delante para evitar Z-fighting
