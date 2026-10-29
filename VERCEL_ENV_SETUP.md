# booking-TOURIST — Environment variables

Vercel → booking-TOURIST → Settings → Environment Variables:

| Variable | Firebase web config του TOURIST tenant |
| --- | --- |
| FIREBASE_API_KEY | apiKey |
| FIREBASE_AUTH_DOMAIN | authDomain |
| FIREBASE_PROJECT_ID | projectId |
| FIREBASE_STORAGE_BUCKET | storageBucket |
| FIREBASE_MESSAGING_SENDER_ID | messagingSenderId |
| FIREBASE_APP_ID | appId |

Επιλέξτε Production και Preview αν χρησιμοποιείτε και τα δύο. Μπορούν να έχουν διαφορετικό Firebase project για δοκιμές. Για τοπική χρήση, δηλώστε τα variables στο shell και εκτελέστε npm run build. Το script δεν φορτώνει αυτόματα .env αρχεία.

Framework Other, Build Command npm run build, Output Directory . — περιέχονται στο vercel.json. Αφαιρέστε παλιά dashboard overrides που κρατούν κενό Build Command και κάντε Redeploy. Κάθε μελλοντική αλλαγή variable χρειάζεται νέο deployment.

Το build παράγει αυτόματα το js/config/firebase-config.js και αποτυγχάνει αν λείπει απαιτούμενο variable. Αυτές είναι δημόσιες Firebase web τιμές και εμφανίζονται στο JavaScript του browser. Service-account/private keys δεν χρησιμοποιούνται εδώ. Η ασφάλεια παραμένει στα tenant Auth, Firestore και Storage rules.

Το project πρέπει να είναι το ίδιο με τη σύνδεση booking_tourist στο SQySystems. Τα Firebase rules δεν αλλάζουν σε αυτό το patch. Αντιγράψτε τα αρχεία πάνω από το προηγούμενο tourist integration, όχι στο SQySystems project.
