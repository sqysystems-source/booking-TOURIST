# Εγκατάσταση R2 — booking-tourist

## Τι μπαίνει σε κάθε project

Στο **booking-tourist Vercel project** παραμένουν τα έξι δημόσια Firebase variables που ήδη χρησιμοποιεί το build: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.

Προσθέστε εκεί και μόνο εκεί:

| Variable | Τιμή |
| --- | --- |
| `FIREBASE_CLIENT_EMAIL` | Service account του υπάρχοντος tourist Firebase project |
| `FIREBASE_PRIVATE_KEY` | Πλήρες private_key του ίδιου account. Υποστηρίζονται πραγματικές αλλαγές γραμμής και κυριολεκτικά `\n`. Στο Vercel βάζετε την τιμή χωρίς εξωτερικά εισαγωγικά. |
| `ALLOWED_ORIGINS` | Ακριβές HTTPS origin του SQySystems, χωρίς τελική `/`. Πολλαπλά εγκεκριμένα origins χωρίζονται με κόμμα. Χωρίς `*`. |
| `R2_ACCOUNT_ID` | Cloudflare Account ID, 32 δεκαεξαδικοί χαρακτήρες |
| `R2_ACCESS_KEY_ID` | Access key με πρόσβαση μόνο στο bucket αυτού του πελάτη |
| `R2_SECRET_ACCESS_KEY` | Secret του ίδιου token |
| `R2_BUCKET_NAME` | Bucket αυτού του πελάτη |
| `R2_PUBLIC_BASE_URL` | `https://images.your-real-domain.gr`, χωρίς path/query. Σταθερό δημόσιο custom domain του bucket. |

Στο **SQySystems Vercel project δεν προστίθεται κανένα variable ή secret**. Η υπάρχουσα εγγραφή `merchant_stores` / σύνδεση `booking_tourist` παραμένει ίδια. Το `storeApiBaseUrl` πρέπει ήδη να είναι το HTTPS origin του booking-tourist. Το panel στέλνει το Firebase ID token του συνδεδεμένου tourist χρήστη σε `storeApiBaseUrl + /api/r2`. Δεν χρησιμοποιείται Master token ή ανταλλαγή νέων κωδικών.

Το αρχικό tourist project δεν είχε server, Firebase Admin ή allowed-origin configuration. Γι' αυτό τα δύο Admin credentials και το `ALLOWED_ORIGINS` είναι νέα και απαραίτητα. Το `FIREBASE_PROJECT_ID` επαναχρησιμοποιείται. Ο λογαριασμός πελάτη χρειάζεται ακόμη `users/{uid}.role == 'admin'` στο ίδιο tenant Firebase. Δεν προσθέτουμε αυτόματα ρόλους.

## Cloudflare

1. R2 → Create bucket: ξεχωριστό bucket για αυτόν τον πελάτη. Μην χρησιμοποιήσετε bucket άλλου πελάτη.
2. R2 → Manage R2 API Tokens → Create API token: **Object Read & Write**, εφαρμογή μόνο στο συγκεκριμένο bucket. Αποθηκεύστε Access Key ID / Secret Access Key μόνο στα δύο αντίστοιχα variables του booking-tourist. Το backend χρειάζεται Get/Put/Delete object. Δεν χρειάζεται διαχείριση άλλων buckets.
3. Bucket → Settings → Custom Domains → Connect Domain: συνδέστε π.χ. `images.your-real-domain.gr`, σε DNS zone που ελέγχετε στο Cloudflare, και περιμένετε να ενεργοποιηθεί το HTTPS. Αυτό είναι το `R2_PUBLIC_BASE_URL`. Μην χρησιμοποιήσετε το S3 API endpoint ως δημόσιο URL. Το bucket περιέχει δημόσιες εικόνες· ακόμη και εικόνες πρόχειρων βιλών είναι προσβάσιμες εάν γνωρίζει κάποιος το URL.
4. Bucket → Settings → CORS policy: χρησιμοποιήστε **ακριβώς το JSON του `r2.cors.example.json`**, αντικαθιστώντας `https://YOUR_SQYSYSTEMS_DOMAIN` με το πραγματικό origin που εμφανίζεται στη γραμμή διεύθυνσης του admin. Πρόσθετα origins μόνο εφόσον πραγματικά χρησιμοποιούνται. Η πηγή του browser upload είναι το SQySystems, οπότε το δικό του origin χρειάζεται στη bucket CORS. Το backend CORS ρυθμίζεται ξεχωριστά με `ALLOWED_ORIGINS`.
5. Συνιστάται lifecycle rule που διαγράφει μόνο το prefix `_uploads/` μετά από 1 ημέρα. Μην ορίσετε expiration στο `villas/`. Αυτό καθαρίζει προσωρινά uploads ακόμη και αν ο browser κλείσει πριν ολοκληρωθεί η αποστολή.

Ο browser κάνει PUT απευθείας στο account S3 endpoint με URL 120 δευτερολέπτων. Η υπογραφή δεσμεύει bucket/key, MIME και Content-Length. Ο browser ορίζει μόνος του Content-Length από το αρχείο· μην το προσθέσετε χειροκίνητα στο JavaScript. Το custom domain χρησιμοποιείται για εμφάνιση, όχι για signed PUT.

## Ασφάλεια και καθαρισμός

Το backend επαληθεύει το ID token με έλεγχο ανάκλησης στο tourist project και ελέγχει τον τρέχοντα ρόλο admin από τη Firestore. Bucket, endpoint και δημόσιο URL προέρχονται αποκλειστικά από server configuration. Το browser request περιέχει μόνο villa ID, ελεγχόμενα metadata ή κλειδί εικόνας της συγκεκριμένης βίλας.

Το προσωρινό upload γράφει στο `_uploads/{villaId}/...`. Το completion ελέγχει πραγματικό μήκος, MIME και αρχικά bytes JPEG/PNG/WebP, διαβάζοντας έως 8 MiB, και δημοσιεύει τα ελεγμένα bytes σε διαφορετικό σταθερό `villas/{villaId}/{uuid}.ext`. Έτσι το προσωρινό PUT δεν μπορεί να αλλάξει αποθηκευμένη εικόνα. Το completion περνά έως 8 MiB από τον backend για αυτόν τον έλεγχο· υπολογίστε ανάλογο bandwidth. Δεν γίνεται μετατροπή ή συμπίεση εικόνων. Ο έλεγχος υπογραφής αρχείου δεν είναι πλήρης αποκωδικοποίηση εικόνας.

Η βίλα αποθηκεύει `{url, alt, r2Key}`. Η πρώτη εικόνα παραμένει εξώφυλλο. Μέχρι 12 εικόνες ανά αποθηκευμένη βίλα και μέχρι 12 επιπλέον μη αποθηκευμένα uploads ανά βίλα για ασφαλή αντικατάσταση εικόνων πριν την αποθήκευση.

Η εσωτερική `_villaImages` είναι προσβάσιμη μόνο από Admin SDK. Οι browser εγγραφές στις `villas` απαγορεύονται πλέον από τα tourist Firestore rules: αποθήκευση και διαγραφή περνούν από το ίδιο backend. Οι συναλλαγές συντονίζουν αποθήκευση βίλας / κατάσταση εικόνας, ώστε ένα διαγραμμένο object να μην μπορεί να προστεθεί ξανά και μια χρησιμοποιούμενη εικόνα να μην διαγραφεί. Δημόσια και admin reads παραμένουν όπως πριν.

Αφαίρεση αποθηκευμένης εικόνας εφαρμόζεται μετά την επιτυχή αποθήκευση της βίλας. Κλείσιμο χωρίς αποθήκευση καθαρίζει τις νέες εικόνες μέσω ασφαλούς discard. Αν κλείσει απότομα η καρτέλα ή διακοπεί η σύνδεση, παραμένουν καταχωρισμένες για καθαρισμό: η επόμενη μεταφόρτωση/αποθήκευση/διαγραφή της ίδιας βίλας επιχειρεί cleanup, με όριο 24 ωρών για εγκαταλελειμμένα uploads. Χωρίς επόμενη ενέργεια δεν υπάρχει αυτόματο cron για τελικά ορφανά `villas/` objects. Το lifecycle καθαρίζει μόνο τα προσωρινά `_uploads/`.

Για χειροκίνητη επανάληψη cleanup, από ενεργό SQySystems tourist session καλέστε το ίδιο authenticated `/api/r2` με `{ "action":"cleanup", "id":"THE_VILLA_DOCUMENT_ID" }`. Χρησιμοποιήστε τον ID token του ίδιου tenant. Το endpoint δεν επιτρέπει διαγραφή referenced εικόνων. Αποτυχία καθαρισμού δεν αναιρεί επιτυχημένη αποθήκευση και εμφανίζει σχετική προειδοποίηση.

Οι παλιές Firebase εικόνες, metadata `storagePath`, εξωτερικά/τοπικά URLs που ήδη υπάρχουν και προεπισκοπήσεις Firebase διατηρούνται. Δεν δημιουργούνται νέα Firebase uploads και δεν διαγράφονται/μεταφέρονται παλιά Firebase αρχεία. Ακόμη και κατά τη διαγραφή βίλας τα παλιά Firebase objects παραμένουν. Δεν χρειάζεται deploy των Storage rules. Το δημόσιο site ήδη διαβάζει κανονικά stable HTTPS URLs και η υπάρχουσα CSP επιτρέπει τις εικόνες. Το SQySystems δεν έχει περιοριστικό connect-src/img-src που να χρειάζεται αλλαγή. Δεν προστέθηκαν wildcard origins ή αλλαγές CSP.

## Σειρά εγκατάστασης

1. Αντιγράψτε τα περιεχόμενα `booking-tourist/` και `SQySystems/` στους αντίστοιχους υπάρχοντες φακέλους. Μην αντικαταστήσετε ολόκληρα projects με αυτό το ZIP αλλαγών.
2. Ρυθμίστε bucket/custom domain/CORS και τα παραπάνω booking-tourist variables. `.env.example` είναι υπόδειγμα με placeholders. Το build δεν φορτώνει αυτόματα `.env.local`· τοπικά φορτώστε τα variables στο shell ή χρησιμοποιήστε `node --env-file=.env.local scripts/build-config.mjs`.
3. Στο booking-tourist τρέξτε `npm ci`. Διατηρούνται τα υπάρχοντα scripts και προστίθενται μόνο Firebase Admin και τα δύο AWS SDK packages με lockfile. Vercel Node.js 22 συνιστάται. Η συνάρτηση έχει maxDuration 60 δευτερόλεπτα.
4. Κάντε deploy το booking-tourist backend και τα αλλαγμένα SQySystems αρχεία σε συντονισμένο παράθυρο συντήρησης. Μετά περάστε **μόνο στο tourist Firebase project** το `firestore.rules` (`firebase deploy --only firestore:rules --project YOUR_TOURIST_PROJECT_ID`). Το αντίγραφο `SQySystems/reference/tourist.firestore.rules` είναι αναφορά και ΔΕΝ είναι Master rules. Δεν αλλάζετε την υπάρχουσα σύνδεση tenant ή τους χρήστες.
5. Τα παλιά ανοιχτά tourist tabs πρέπει να ανανεωθούν: μετά τα νέα rules δεν μπορούν να γράφουν απευθείας Firestore. Η δημόσια προβολή συνεχίζει να διαβάζει όπως πριν.
6. Ελέγξτε στο πραγματικό admin: login → αποθήκευση πρόχειρης βίλας → upload JPEG/PNG/WebP → σειρά/alt/εξώφυλλο → Αποθήκευση → δημόσια εμφάνιση. Δοκιμάστε ακύρωση αλλαγών, αφαίρεση εικόνας, διαγραφή βίλας, δεύτερη καρτέλα με παλιά revision, μη εξουσιοδοτημένο origin και μη-admin token.
7. Σε rollback επαναφέρετε μαζί backend/panel/rules της προηγούμενης έκδοσης. Μην επαναφέρετε μόνο browser-write rules ενώ λειτουργεί η νέα διαγραφή R2, γιατί αυτά συμμετέχουν στην προστασία από ταυτόχρονη αποθήκευση/διαγραφή.

Επίσημη τεκμηρίωση: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ · https://developers.cloudflare.com/r2/buckets/cors/ · https://firebase.google.com/docs/auth/admin/verify-id-tokens
