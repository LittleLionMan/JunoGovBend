Needs a config.js in src/dbHandlers looking like this:
const dbConfig = {
    host: 'localhost',       // Hostname der MySQL-Datenbank (z.B. localhost)
    user: 'Username', // Dein MySQL-Benutzername
    password: 'Password', // Dein MySQL-Passwort
    database: 'name of the db', // Name der Datenbank, zu der du eine Verbindung herstellen möchtest
    port: 3306,              // Portnummer (Standard ist 3306 für MySQL)
};

Different queries aren't connected at the moment, because I only worked with parts of it so far. Will be changes if I ever use it for the history of another chain.
Try to make sense out of starter.js or ask me.
