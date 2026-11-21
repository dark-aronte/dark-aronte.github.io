# Engineering Lab — Dark Aronte

Dimostrazione interattiva di architetture software documentate e diagnostica locale riproducibile.

## Componenti

La mappa interattiva presenta collegamenti e informazioni sui progetti esistenti: ARONTE AEGIS, FileCheck, Integrity Studio, Diff Studio, Digital Mirror ed Elena ADC. **Non è una console di monitoraggio remoto.**

La console del laboratorio esegue quattro controlli esclusivamente nel browser:

1. Verifica del contesto sicuro (HTTPS o contesto equivalente).
2. Disponibilità Web Crypto API.
3. Calcolo SHA-256 di `abc`, confrontato con il digest di riferimento noto `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
4. Invocazione del generatore crittografico locale e controllo basilare di due campioni, senza affermare di certificare la qualità del generatore.

La durata misura esclusivamente l'esecuzione di questi controlli sul dispositivo in uso. Non è un benchmark comparabile fra dispositivi né un test antivirus.

Al termine è possibile esportare un rapporto JSON contenente data, esiti e durata.

## Sicurezza e privacy

Nessuna richiesta di rete applicativa o trasmissione di documenti; i dati di prova sono costanti e il rapporto è generato localmente. Il sito può comunque richiedere le proprie risorse statiche per caricare la pagina. Il test non prova l'assenza di vulnerabilità del dispositivo, dei browser o dei servizi collegati.

L'interfaccia è bilingue, adattiva e utilizzabile mediante tastiera. Animazioni e transizioni non sono essenziali al funzionamento; sono rispettate le preferenze di movimento ridotto.

## Collaudo

Eseguire `node scripts/test-engineering-lab.mjs` dalla radice del repository. Il test verifica il calcolo reale di SHA-256 tramite WebCrypto in Node, gli esiti, la struttura del rapporto, la traduzione, i collegamenti e le interazioni simulate. Integrato nelle verifiche generali di GitHub Actions.
