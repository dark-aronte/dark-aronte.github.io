# Integrity Studio — Dark Aronte

Applicazione web locale per creare e verificare registri di integrità basati su SHA-256.

## Funzioni operative

1. Selezionare da 1 a 50 file (fino a 100 MiB per file), anche tramite trascinamento.
2. Calcolare le impronte SHA-256 nel browser con Web Crypto.
3. Individuare file duplicati quando dimensione e impronta coincidono.
4. Esportare un registro `integrity-manifest.json`, con formato, versione, algoritmo, data e lista di nomi, dimensioni e impronte.
5. Conservare il registro in posizione separata e attendibile.
6. Per un controllo successivo, importare il registro, selezionare i file e ripetere il calcolo.
7. Confrontare le impronte rilevando file identici, mancanti, aggiunti, con dimensioni differenti o con impronte differenti.
8. Esportare il resoconto di confronto in JSON.

## Condizioni e limiti

- Il calcolo avviene interamente nel browser. Non vengono effettuate richieste di rete dal codice applicativo per caricare documenti.
- Non sono presenti account, raccolta di file sul server o memorizzazione permanente nel browser.
- Un nome di file duplicato rende ambiguo il confronto e viene rifiutato; sono esclusi percorsi e caratteri di controllo.
- Sono previsti limiti di 50 file e 100 MiB per file, con lettura integrale di ciascun file. Su dispositivi con poca memoria il calcolo può risultare oneroso.
- L'impronta non garantisce l'autenticità del registro: un soggetto che modifichi sia i file sia il registro può generare nuovi valori coerenti.
- Non sono eseguite scansioni antivirus, identificazione dell'autore o verifica della provenienza dei documenti.
- Il registro JSON ammette al massimo 256 KiB ed è validato prima dell'utilizzo.
- La verifica non modifica e non cancella alcun file.

## Qualità e manutenzione

Eseguire `node scripts/test-integrity-studio.mjs` dalla radice del repository, seguito dai test di sito, CSP e firma AEGIS. I moduli pubblici sono `software/integrity-core.mjs` e `software/integrity-ui.mjs`.

L'interfaccia propone testi italiani e inglesi ed è progettata per desktop e smartphone. Gli script possono essere ispezionati nel repository pubblico.

## Sicurezza del sito

La pagina e i due moduli software sono inclusi nell'elenco degli asset firmati da AEGIS Trustprint. Le firme documentano l'integrità rispetto a un manifest approvato, non una protezione assoluta da vulnerabilità.
