const mathUtils = require("./math-utils");

let i = 1;

otherIncomingRequests();
longRequestNonBlocking(50000);

/**
 * DO NOT CHANGE IT
 */
function otherIncomingRequests() {
    setInterval(() => {
        console.log(`Id: ${i++}. Doing new incoming request`);
    }, 50);
}

/**
 * Funzione non bloccante per calcolare i numeri primi
 * @param {*} n
 * @returns
 */
function longRequestNonBlocking(n) {
    let id = i++;
    console.log(`Id: ${id}. Starting non-blocking request. Find primes from 2 to ${n}`);
    const start = new Date();
    const primes = [];
    const chunkSize = 1000; // Elabora 100 numeri alla volta
    let current = 2; // Inizio dell'intervallo

    // Funzione che elabora un chunk
    const interval = setInterval(() => {
        if (current <= n) { 
            const end = Math.min(current + chunkSize, n); // Definisci la fine dell'intervallo
            console.log(`Id: ${id}. Elaborating primes from ${current} to ${end}`);

            // Elabora il chunk attuale di numeri primi
            const primesChunk = mathUtils.getPrimeNumbersWithinRange(current, end);
            primes.push(...primesChunk);
            console.log(`Id: ${id}. Suspended non-blocking request`);

            // Aggiorna l'inizio per il prossimo chunk
            current = end + 1;
        } else {
            const finish = new Date();
            console.log(`Id: ${id}. Finished non-blocking request. Elapsed ms: ${finish.getTime() - start.getTime()}`);
            console.log(`Primes: ${primes.join(', ')}`);
            clearInterval(interval);
        }
    }, 50);
}