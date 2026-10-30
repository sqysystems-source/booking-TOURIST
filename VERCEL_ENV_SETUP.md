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

Το build παράγει αυτόματα το js/config/firebase-config.js και αποτυγχάνει αν λείπει απαιτούμενο variable. Αυτές είναι δημόσιες Firebase web τιμές και εμφανίζονται στο JavaScript του browser. Το public build δεν εκπέμπει service-account/private keys. Το νέο R2 backend χρειάζεται server-only Admin credentials· δείτε το R2_DEPLOYMENT.md. Η ασφάλεια παραμένει στα tenant Auth, Firestore και Storage rules.

Το project πρέπει να είναι το ίδιο με τη σύνδεση booking_tourist στο SQySystems. Τα νέα R2 rules μεταφέρουν τις εγγραφές βιλών στο authenticated backend· δείτε τη σειρά εγκατάστασης στο R2_DEPLOYMENT.md. Αντιγράψτε τα αρχεία πάνω από το προηγούμενο tourist integration, όχι στο SQySystems project.
