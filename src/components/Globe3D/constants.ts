export const CAPTION_GLOBE = 'Globe 3D';
/** Points d'une route : lisse a l'oeil meme pour un demi-tour de Terre. */
export const ROUTE_STEPS = 64;
/** Degres entre deux points de l'equateur (lisse a l'oeil a ce pas). */
export const GUIDE_STEP = 5;

// --- La scene ---
// Le globe est une sphere de rayon 1 autour du milieu de la scene : toute taille ci-dessous est dans cette unite.
/** Rondeur de la boule : assez de segments pour un contour lisse meme tout zoome. */
export const SPHERE_SEGMENTS = 144;
/** Rondeur de la coque ou sont peints les continents. Elle porte le masque terre/mer en image, donc le detail de
 * la cote vient du masque, pas de cette grille — mais elle doit etre *fine* : une sphere a facettes creuse sous son
 * rayon de `1 - cos(180 / segments)` et la coque disparaitrait sous la mer sauf si `LAND_FILL_ALTITUDE` couvre ce
 * creux. A 192, il vaut 0.00013. */
export const LAND_FILL_SEGMENTS = 192;
/** Force de la peinture des continents, par-dessus la couleur de la cote : assez pour distinguer terre et mer,
 * assez peu pour que la cote reste le trait net. */
export const LAND_FILL_OPACITY = 0.38;
/** Ce qui est dessine sur le sol est pousse d'un poil, dans cet ordre, pour que chaque couche gagne ses pixels sur
 * la precedente sans scintiller. La coque doit passer le creux de ses facettes (voir `LAND_FILL_SEGMENTS`), et la
 * cote doit passer le sommet de la coque, sinon la peinture cache le trait. */
export const LAND_FILL_ALTITUDE = 1.0008;
export const LAND_ALTITUDE = 1.0016;
export const GUIDE_ALTITUDE = 1.0022;
export const ROUTE_ALTITUDE = 1.004;
export const MARK_ALTITUDE = 1.006;
/** Une route est un tube, pas une ligne : WebGL ignore l'epaisseur des lignes sur la plupart des appareils.
 * Plus fin que les pastilles, et divise par le zoom (voir `buildRoutes`) pour garder cette largeur a l'ecran. */
export const ROUTE_THICKNESS = 0.01;
export const ROUTE_SIDES = 6;
/** Les pastilles : point de depart, fin d'une reponse, pole nord. */
export const ORIGIN_DOT = 0.03;
export const MARK_DOT = 0.026;
export const POLE_DOT = 0.02;
export const DOT_SEGMENTS = 16;
/** L'anneau autour de la vraie reponse. */
export const TRUTH_RING = 0.06;
export const TRUTH_RING_THICKNESS = 0.009;
/** Pointilles de l'equateur. */
export const GUIDE_DASH = 0.05;
export const GUIDE_GAP = 0.035;
/** Lumiere recue par la boule de partout, et de la lampe qui suit la camera (le meme cote prend toujours la
 * lumiere, quelle que soit la rotation), et position de la lampe : en haut a gauche, comme en 2D. */
export const AMBIENT_LIGHT = 0.6;
export const HEADLIGHT = 0.8;
export const HEADLIGHT_POSITION: [number, number, number] = [-0.6, 0.8, 1];
/** Distance de la camera au centre du globe. La boule (rayon 1) est entre `DISTANCE - 1` et `DISTANCE + 1` :
 * la plage de profondeur est coupee autour. */
export const CAMERA_DISTANCE = 4;
export const CAMERA_NEAR = CAMERA_DISTANCE - 1.5;
export const CAMERA_FAR = CAMERA_DISTANCE + 1.5;

// --- Rotation et zoom ---
/** On ne penche pas le globe au-dela de cette latitude : les poles restent hors du milieu, la vue ne se retourne jamais. */
export const MAX_CENTER_LATITUDE = 85;
/** Zoom 1 = toute la boule tient dans le dessin. */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 14;
/** Un appui sur + ou − multiplie (ou divise) le zoom par ceci. */
export const ZOOM_STEP = 1.4;
/** Boutons : zoom, et retour a la vue de depart (nord en haut, tout en vue). */
export const ZOOM_IN_LABEL = '+';
export const ZOOM_OUT_LABEL = '−';
export const RESET_LABEL = 'N';
export const ZOOM_IN_HINT = 'Zoomer';
export const ZOOM_OUT_HINT = 'Dézoomer';
export const RESET_HINT = 'Remettre le globe au nord';

// --- Le dessin ---
/** Marge autour du globe pour que son contour ne soit pas coupe par le bord du dessin. */
export const GLOBE_MARGIN = 3;
/** Place gardee au-dessus de l'origine pour son label. */
export const LABEL_OFFSET = 11;
/** Le satellite vole a cette hauteur au-dessus du sol, en part du rayon : on le voit au-dela du contour. */
export const ORBIT_RATIO = 1.12;
/** Un tour complet de la Terre, et frequence de deplacement du satellite en vol. */
export const ORBIT_MS = 24000;
export const ORBIT_TICK_MS = 50;
/** La mer le jour : le sable du fond jour de l'app (#F3EEE3), sur fond blanc (le `background` du globe est le
 * `surface` du theme jour) : c'est ce qui fait ressortir la boule. */
export const DAY_SEA_COLOR = '#F3EEE3';
/** Les continents le jour : un bleu plus clair que l'accent (#5B88B4), dont le bleu trace alors la cote. */
export const DAY_LAND_COLOR = '#B5CCE4';
