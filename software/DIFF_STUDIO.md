# Diff Studio — Dark Aronte

Strumento di confronto testuale eseguito interamente nel browser e disponibile in italiano e inglese.

## Funzioni

- Incolla due versioni di un testo oppure importa file leggibili nei formati TXT, MD, CSV, JSON, XML o HTML.
- Riconosce righe identiche, inserite o eliminate; una sostituzione è rappresentata da una eliminazione e una aggiunta.
- Mostra i numeri di riga dei due documenti e le differenze in un'interfaccia a contrasto elevato.
- Esporta il risultato completo in JSON o una patch in formato testuale unified diff.
- Offre opzioni per ignorare spazi e differenze maiuscolo/minuscolo. Quando queste opzioni sono attive, alcuni cambiamenti originali possono non comparire.
- Non carica file su server né utilizza servizi terzi.

## Limiti tecnici

- Massimo 1 MiB di contenuto e 1.600 righe per documento, con limite combinato di 2.600.000 celle nella matrice di confronto.
- Non apre direttamente DOCX e PDF binari; occorre prima esportare il testo.
- Il calcolo adotta la longest common subsequence con matrice limitata, per garantire risultati riproducibili. Non rileva modifiche semantiche né certifica provenienza o autenticità.
- Le terminazioni CRLF e LF vengono uniformate per il confronto; una differenza nella presenza dell'ultima terminazione è indicata separatamente.
- Il browser non conserva automaticamente i documenti o i risultati. Salvare manualmente gli eventuali report.

## Test

Eseguire dalla radice del repository:

```sh
node scripts/test-diff-studio.mjs
node scripts/test-diff-interface.mjs
```

La suite comprende confronti di righe, importazione simulata, esportazione JSON/patch, cambio lingua, gestione errori e uso sicuro di `textContent`. È integrata con la validazione generale del sito e la verifica AEGIS CSP e Trustprint.
