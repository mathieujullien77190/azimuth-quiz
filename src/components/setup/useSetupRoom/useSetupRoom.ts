import { reporting } from '@/helpers/reportError';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NAME_PLACEHOLDERS, PLAYER_COLORS } from '@/data';
import { loadLastJoinedRoom, saveLastJoinedRoom } from '@/helpers/lastRoom';
import { playersByArrival } from '@/helpers/roomPlayers';
import { freePlaceholder, isNameTakenError } from '@/helpers/roomName';
import { useDebouncedValue } from '@/helpers/useDebouncedValue';
import { useRoomPresence } from '@/helpers/useRoomPresence';
import { useTranslation } from '@/i18n';
import { usePlayerName } from '@/settings';

import type { SetupPartyProps, SetupRoomAdapter } from './types';

/** Delai d'immobilite du champ nom avant d'envoyer un renommage a la room. */
const NAME_SYNC_DELAY_MS = 600;

/**
 * Toute la logique de room en ligne derriere l'ecran de setup d'un jeu, identique pour tous : etat, effets
 * Firestore, valeurs derivees et actions deja resolues. Chaque jeu branche sa collection/son store via `adapter`
 * (voir `SetupRoomAdapter`) ; le container passe `party` tel quel a `SetupScreenShell`, rien ici ne rend.
 */
export const useSetupRoom = <S extends { playerName: string }, R extends Partial<S>>(
  adapter: SetupRoomAdapter<S, R>,
  settings: S,
  updateSettings: (patch: Partial<S>) => void,
  initialChoice: 'host' | 'join' | null,
) => {
  const { store } = adapter;
  const router = useRouter();
  const t = useTranslation();
  // Le nom est la seule chose partagee par les 3 jeux (voir `usePlayerName`) : chaque setup lit/ecrit ce store.
  // Avant son hydratation, les reglages du jeu evitent un flash vide (Compass peut deja avoir un nom sur disque) ;
  // l'effet de synchro ci-dessous reconcilie ensuite les deux.
  const sharedPlayerName = usePlayerName((s) => s.playerName);
  const playerNameReady = usePlayerName((s) => s.ready);
  const setSharedPlayerName = usePlayerName((s) => s.setPlayerName);
  const soloName = playerNameReady ? sharedPlayerName : settings.playerName;

  // Une seule fois, a la premiere hydratation du nom partage : s'il a deja un nom, les reglages du jeu l'adoptent ;
  // sinon, si les reglages du jeu en avaient un (Compass seulement), il alimente le store partage (migration).
  // Ne rejoue jamais, donc ne lutte pas avec `onChangeName`.
  const syncedPlayerNameRef = useRef(false);
  useEffect(() => {
    if (!playerNameReady || syncedPlayerNameRef.current) return;
    syncedPlayerNameRef.current = true;
    if (sharedPlayerName !== '') {
      if (settings.playerName !== sharedPlayerName) updateSettings({ playerName: sharedPlayerName } as Partial<S>);
    } else if (settings.playerName !== '') {
      setSharedPlayerName(settings.playerName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerNameReady]);

  // Hote/joiner est un etat d'UI local, pas une preference : on repart de zero a chaque ouverture. Rejoindre
  // montre les sections en lecture seule (reflet de `roomSettings`) au lieu de les masquer.
  const [onlineChoice, setOnlineChoice] = useState<'host' | 'join' | null>(initialChoice);
  const [hostedSilently, setHostedSilently] = useState(false);
  const mode = hostedSilently ? 'host' : onlineChoice;
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  // Incremente quand « Rejoindre » est rappuye avec un code deja saisi : il est reverifie (la room existe peut-etre
  // maintenant), ce que le texte inchange ne declencherait pas.
  const [joinAttempt, setJoinAttempt] = useState(0);
  const readOnly = mode === 'join';

  // Quitter le mode hote (Solo ou Rejoindre) supprime la room, comme `handleQuit` en partie : pas de transfert
  // d'hote, et sinon elle reste orpheline dans Firestore (`removeRoomPlayer` plus bas ne retire que la presence de
  // cet appareil : une room sans hote a deja laisse un joiner « se reconnecter » a une room abandonnee).
  const leaveHostedRoom = () => {
    if (mode === 'host' && roomCode !== null) adapter.deleteRoom(roomCode).catch(reporting('setup.deleteRoom', { kind: 'background', room: roomCode }));
  };

  const resetChoice = useCallback(() => {
    setOnlineChoice(null);
    setHostedSilently(false);
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  }, []);

  const chooseSolo = () => {
    leaveHostedRoom();
    resetChoice();
  };

  const chooseHost = () => {
    // Une room existe deja (celle du solo, apres un lancement rate) : la montrer plutot qu'en creer une seconde.
    if (hostedSilently) {
      setOnlineChoice('host');
      setHostedSilently(false);
      return;
    }
    setOnlineChoice('host');
    setRoomCode(null);
    adapter.createRoom(adapter.roomSettingsFrom(settings)).then(setRoomCode);
  };

  const chooseJoin = () => {
    leaveHostedRoom();
    setOnlineChoice('join');
    setHostedSilently(false);
    setRoomCode(null);
    // Rappuye sur « Rejoindre » sans etre connecte : le code saisi est reverifie, pas efface.
    if (onlineChoice === 'join' && joinStatus !== 'valid') {
      setJoinStatus('idle');
      setJoinAttempt((attempt) => attempt + 1);
      return;
    }
    // Depuis un autre choix, le code de la room precedente est propose ; depuis « Rejoindre » connecte (puce
    // « Quitter »), le champ repart vide, sinon il rejoindrait aussitot la meme room.
    setJoinCode(onlineChoice === 'join' ? '' : (previousCode ?? ''));
    setJoinStatus('idle');
  };

  // Hote : chaque changement de reglage est pousse dans la room pour que les joiners restent synchro. L'echec est
  // avale (ex. room supprimee par `deletePreviousRoomsByHost`) : personne ne lit cette promesse, et une rejection
  // non geree ferait planter l'ecran.
  useEffect(() => {
    if (mode !== 'host' || roomCode === null) return;
    adapter.updateRoomSettings(roomCode, adapter.roomSettingsFrom(settings)).catch(reporting('setup.updateSettings', { room: roomCode }));
  }, [adapter, mode, roomCode, settings]);

  // Derniere room rejointe par cet appareil : « Rejoindre » remplit le code avec (connexion immediate si elle existe
  // encore, sinon code invalide comme n'importe quel code saisi). Editable.
  const [previousCode, setPreviousCode] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadLastJoinedRoom()
      .then((code) => {
        if (!cancelled && code !== null && adapter.isValidRoomCode(code)) setPreviousCode(code);
      })
      .catch(reporting('setup.previousRoom', { kind: 'background' }));
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  // Rejoindre : un code bien forme declenche une verification unique, contre la forme consonne+voyelle du code (pas
  // seulement sa longueur), pour qu'une coquille ne lance pas de lecture Firestore ni « code introuvable ».
  // Appliquer les reglages de l'hote est un effet separe plus bas (reflet de `roomSettings`).
  useEffect(() => {
    if (mode !== 'join') return;
    const code = joinCode.trim().toLowerCase();
    if (!adapter.isValidRoomCode(code)) return;

    let cancelled = false;
    adapter
      .roomExists(code)
      .then((exists) => {
        if (cancelled) return;
        setJoinStatus(exists ? 'valid' : 'invalid');
        if (exists) {
          saveLastJoinedRoom(code);
          setPreviousCode(code);
        }
      })
      .catch(reporting('setup.roomExists', { kind: 'background' }));

    return () => {
      cancelled = true;
    };
  }, [adapter, mode, joinCode, joinAttempt]);

  // Code auquel cet appareil est connecte (hote ou joiner valide) ; null tant qu'on parcourt juste les puces.
  const connectedRoomCode =
    mode === 'host' ? roomCode : mode === 'join' && joinStatus === 'valid' ? joinCode.trim().toLowerCase() : null;

  // Ceci ne gere que la garde « room connectee » et l'etat `starting` couvrant l'intervalle (GPS puis aller-retour
  // Firestore), remis a faux seulement en cas d'echec (le succes quitte l'ecran). Chaque appareil (hote compris)
  // reagit ensuite au `screen` de la room passant a `'game'` (effet plus bas) et navigue seul.
  const [starting, setStarting] = useState(false);
  const pendingRunRef = useRef<((code: string) => Promise<void>) | null>(null);
  // Un lancement rate (`run` rejete : lieux introuvables, pas de reseau...) n'ecrit rien dans la room, qui reste
  // au salon : le bouton relance simplement ; `startFailed` ne pilote que la notice.
  const [startFailed, setStartFailed] = useState(false);
  const startOnlineGame = async (run: (code: string) => Promise<void>) => {
    setStartFailed(false);
    if (connectedRoomCode !== null) {
      setStarting(true);
      await run(connectedRoomCode).catch((error) => {
        // La notice dit seulement que le lancement a echoue ; la cause est loggee.
        reporting('setup.startGame', { kind: 'background', room: connectedRoomCode })(error);
        setStarting(false);
        setStartFailed(true);
      });
      return;
    }
    if (mode === 'join') return;
    setStarting(true);
    try {
      const code = await adapter.createRoom(adapter.roomSettingsFrom(settings));
      pendingRunRef.current = run;
      setRoomCode(code);
      setHostedSilently(true);
    } catch {
      setStarting(false);
      setStartFailed(true);
    }
  };
  useEffect(() => {
    if (!startFailed) return;
    const timeout = setTimeout(() => setStartFailed(false), 4000);
    return () => clearTimeout(timeout);
  }, [startFailed]);

  // Partage avec l'ecran de jeu en ligne, qui ne fait que le lire : cet ecran seul gere connexion/deconnexion,
  // car il etablit toujours la room avant toute navigation vers le jeu.
  const players = store((s) => s.players);
  const hostUid = store((s) => s.hostUid);
  const localUid = store((s) => s.localUid);
  // Nom du joueur s'il ne tape rien : le premier nom par defaut qu'aucun autre joueur de la room n'a.
  const soloPlaceholder = freePlaceholder(NAME_PLACEHOLDERS, players, localUid);
  const roomSettings = store((s) => s.roomSettings);
  const roomScreen = store((s) => s.gameState.screen);
  // L'ecran de jeu a pris le relais (la room a quitte le salon) : le lancement est fini. Cet ecran reste monte
  // dessous et son splash modal resterait sinon par-dessus le jeu, d'ou la remise a zero au rendu (pattern React
  // de state derive) plutot qu'en effet.
  if (starting && roomScreen !== 'options') setStarting(false);
  const connectionLost = store((s) => s.connectionLost);
  // Detection de coupure pour toute la vie de la room (cet ecran reste monte sous le jeu) : voir `useRoomPresence`.
  // Qui perd la connexion quitte la partie.
  useRoomPresence(store, adapter, connectedRoomCode);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    store.getState().connect(connectedRoomCode);
    return () => store.getState().disconnect();
  }, [connectedRoomCode, store]);

  // Connecte et cet appareil present dans la room.
  useEffect(() => {
    const run = pendingRunRef.current;
    if (run === null || connectedRoomCode === null || localUid === null || !(localUid in players)) return;
    pendingRunRef.current = null;
    run(connectedRoomCode).catch((error) => {
      reporting('setup.startGame', { kind: 'background', room: connectedRoomCode })(error);
      setStarting(false);
      setStartFailed(true);
    });
  }, [connectedRoomCode, localUid, players]);

  // Pour un joiner, reflete les reglages de l'hote sur les siens (affichage en lecture seule) : l'unique
  // `subscribeToRoomSettings` ouvert par `connect()` tient `roomSettings` a jour, ceci l'applique a chaque changement.
  useEffect(() => {
    if (mode !== 'join' || roomSettings === null) return;
    updateSettings(roomSettings);
  }, [mode, roomSettings, updateSettings]);

  // Inscrit cet appareil dans la liste des joueurs (hote et joiner) et le renomme quand le nom change. Le
  // renommage attend la fin de la frappe (sinon chaque touche ecrirait un nom a moitie tape). Un nom deja pris est
  // refuse (`nameTaken`) : le champ se rouvre avec la raison, retaper retente. Tout autre echec (ex. room
  // supprimee, voir le nettoyage juste dessous) est avale.
  const [nameTaken, setNameTaken] = useState(false);
  const roomName = useDebouncedValue(soloName, NAME_SYNC_DELAY_MS);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    adapter
      .joinRoomPresence(connectedRoomCode, roomName.trim() || soloPlaceholder)
      .then((uid) => {
        store.setState({ localUid: uid });
        setNameTaken(false);
      })
      .catch((error) => setNameTaken(isNameTakenError(error)));
  }, [adapter, connectedRoomCode, roomName, soloPlaceholder, store]);

  // Quitte la room *precedente* au changement de room (ou en quittant l'ecran), sinon elle reste listee avec un
  // hote qui ne reviendra pas. L'hote supprime la room comme `handleQuit` ; un joiner retire seulement sa presence.
  // Effet separe expres : il ne doit se declencher que sur un vrai changement de room. Echec avale : apres le reset
  // « room supprimee » d'un joiner, la room n'existe plus et les regles refusent l'ecriture (permission denied).
  useEffect(() => {
    if (connectedRoomCode === null || localUid === null) return;
    const isHostOfThisRoom = localUid === hostUid;
    return () => {
      if (isHostOfThisRoom) adapter.deleteRoom(connectedRoomCode).catch(reporting('setup.deleteRoom', { kind: 'background', room: connectedRoomCode }));
      else {
        const report = reporting('setup.leaveRoom', { kind: 'background', room: connectedRoomCode });
        // `permission-denied` ici = room deja disparue (l'hote est parti avant) : rien a quitter, pas une erreur.
        adapter.removeRoomPlayer(connectedRoomCode, localUid).catch((error) => {
          if ((error as { code?: unknown } | null)?.code !== 'permission-denied') report(error);
        });
      }
    };
  }, [adapter, connectedRoomCode, localUid, hostUid]);

  // Deux facons d'etre deconnecte, abonnees directement au store (pas un `useEffect` qui lit des valeurs deja
  // selectionnees : ce serait un state derive, l'anti-pattern de `react-hooks/set-state-in-effect`). Une fois notre
  // uid vu dans `players`, son absence veut dire que l'hote nous a retire (`removeRoomPlayer`) ; la room qui
  // disparait (nouvelle room de l'hote, `deletePreviousRoomsByHost`) est un cas a part, montre au joiner seulement.
  const [disconnectReason, setDisconnectReason] = useState<'kicked' | 'deleted' | null>(null);
  // Auto-ferme plus bas, mais quitte aussi la room ensuite : plus rien a quoi rester connecte.
  const dismissDisconnectNotice = useCallback(() => {
    setDisconnectReason(null);
    // L'ecran de jeu est ouvert par-dessus (celui-ci reste monte dessous) : quitter la room = rentrer a l'accueil.
    // Un simple reset detruirait l'etat de la room sous l'ecran de jeu sans rien pour le renvoyer a l'accueil.
    if (store.getState().gameState.screen !== 'options') router.dismissTo('/');
    resetChoice();
  }, [resetChoice, router, store]);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    let hasBeenPresent = false;
    return store.subscribe((state) => {
      if (!state.roomExists) {
        if (mode === 'join') setDisconnectReason('deleted');
        return;
      }
      if (state.localUid === null) return;
      if (state.localUid in state.players) hasBeenPresent = true;
      else if (hasBeenPresent) {
        // Quitter volontairement (`handleQuit` de l'ecran en ligne, branche joiner) retire la presence comme une
        // expulsion ; `consumeVoluntaryLeave` les distingue. Pas de notice, juste le meme reset qu'une notice fermee.
        if (store.getState().consumeVoluntaryLeave()) dismissDisconnectNotice();
        else setDisconnectReason('kicked');
      }
    });
  }, [connectedRoomCode, dismissDisconnectNotice, mode, store]);

  // L'hote qui lance passe `screen` a 'game' pour tous les appareils (hote compris, via son abonnement) : cet
  // unique effet y emmene tout le monde. Une fois par partie : `roomScreen` change pendant la partie ('game',
  // 'reveal'... 'end'), et un `push` par changement empilait un NOUVEL ecran de jeu (recap vide, « Accueil » ne
  // faisait que depiler).
  const gameOpenedRef = useRef(false);
  useEffect(() => {
    if (roomScreen === 'options' || connectedRoomCode === null) {
      gameOpenedRef.current = false;
      return;
    }
    if (gameOpenedRef.current) return;
    gameOpenedRef.current = true;
    router.push({ pathname: adapter.gamePath, params: { code: connectedRoomCode } });
  }, [adapter.gamePath, roomScreen, connectedRoomCode, router]);

  useEffect(() => {
    if (disconnectReason === null && !connectionLost) return;
    const timeout = setTimeout(dismissDisconnectNotice, 2000);
    return () => clearTimeout(timeout);
  }, [disconnectReason, connectionLost, dismissDisconnectNotice]);

  // Garde sur `connectedRoomCode` plutot que remis a `{}` en partant : les entrees perimees ne s'affichent jamais
  // hors connexion. Garde aussi sur `localUid` : le snapshot des joueurs peut arriver avant que `joinRoomPresence`
  // resolve notre uid, et on ne distinguerait plus notre entree des autres (mieux vaut rien que nous voir en double).
  const connectedPlayers =
    connectedRoomCode === null || localUid === null ? [] : playersByArrival(players).slice(0, adapter.maxPlayers);
  const isHost = localUid !== null && localUid === hostUid;
  // Solo garde le rouge fixe du multijoueur local ; une fois connecte, le badge prend la couleur assignee par l'hote.
  const soloColor =
    connectedRoomCode !== null && localUid !== null
      ? (players[localUid]?.color ?? adapter.colors[0])
      : PLAYER_COLORS[0];

  // Hote : a chaque changement de joueurs connectes (arrivee, depart, expulsion), recalcule toutes les couleurs
  // par ordre d'arrivee et les ecrit ; les joiners ne calculent rien et lisent, donc tous les appareils concordent.
  useEffect(() => {
    if (!isHost || connectedRoomCode === null) return;
    const colorByUid: Record<string, string> = {};
    playersByArrival(players).forEach(([uid, player], index) => {
      const color = adapter.colors[index % adapter.colors.length];
      if (player.color !== color) colorByUid[uid] = color;
    });
    adapter.updateRoomPlayerColors(connectedRoomCode, colorByUid).catch(reporting('setup.updateColors', { room: connectedRoomCode }));
  }, [adapter, isHost, connectedRoomCode, players]);

  // Les sections en lecture seule reagissent a un tap/toggle, seulement pour expliquer pourquoi rien ne se passe :
  // auto-ferme quelques secondes apres.
  const [readOnlyNotice, setReadOnlyNotice] = useState(false);
  useEffect(() => {
    if (!readOnlyNotice) return;
    const timeout = setTimeout(() => setReadOnlyNotice(false), 2000);
    return () => clearTimeout(timeout);
  }, [readOnlyNotice]);
  const notifyReadOnly = () => setReadOnlyNotice(true);
  // « Preparation de la partie... » (spinner, `overlayLoading`) couvre le setup pendant le lancement, sauf si une
  // notice de deconnexion prime.
  const overlayLoading = starting && !connectionLost && disconnectReason === null;
  const overlayMessage = connectionLost
    ? t.setup.online.connectionLostNotice
    : disconnectReason === 'kicked'
      ? t.setup.online.kickedNotice
      : disconnectReason === 'deleted'
        ? t.setup.online.roomDeletedNotice
        : overlayLoading
          ? t.game.loading
          : startFailed
            ? t.setup.online.startFailedNotice
            : readOnlyNotice
              ? t.setup.readOnlyNotice
              : null;
  // Un tap sur la notice ferme celle qui s'affiche avant son auto-fermeture de 2 s. Le splash de chargement ne se
  // ferme pas : il part seul quand l'ecran de jeu prend le relais.
  const dismissOverlay = () => {
    if (overlayLoading) return;
    if (disconnectReason !== null || connectionLost) dismissDisconnectNotice();
    else if (startFailed) setStartFailed(false);
    else setReadOnlyNotice(false);
  };

  const party: SetupPartyProps = {
    soloName,
    soloPlaceholder,
    soloColor,
    // Libre seul ou en hote (le nouveau nom part dans la room, voir `roomName`) ; verrouille en joiner connecte,
    // sauf si le nom a ete refuse et doit changer.
    nameEditable: connectedRoomCode === null || mode === 'host' || nameTaken,
    nameError: nameTaken && connectedRoomCode !== null ? t.setup.online.nameTaken : null,
    onChangeName: (text) => {
      setSharedPlayerName(text);
      updateSettings({ playerName: text } as Partial<S>);
    },
    connectedPlayers,
    localUid,
    hostUid,
    isHost,
    onKick: (uid) => {
      if (connectedRoomCode === null) return;
      adapter.removeRoomPlayer(connectedRoomCode, uid).catch(reporting('setup.kickPlayer', { room: connectedRoomCode }));
    },
    onlineChoice,
    onChooseSolo: chooseSolo,
    onChooseHost: chooseHost,
    onChooseJoin: chooseJoin,
    roomCode: hostedSilently ? null : roomCode,
    joinCode,
    onJoinCodeChange: setJoinCode,
    // Resolu ici pour que la vue dumb n'importe pas `isValidRoomCode` : cela tire `room.ts`, qui importe
    // `firebase/firestore` au niveau module, ce qu'une vue dumb ne doit jamais dependre de.
    joinCodeIsValid: adapter.isValidRoomCode(joinCode.trim().toLowerCase()),
    joinStatus,
  };

  return {
    party,
    readOnly,
    starting,
    connectedRoomCode,
    overlayMessage,
    overlayLoading,
    dismissOverlay,
    notifyReadOnly,
    startOnlineGame,
  };
};
