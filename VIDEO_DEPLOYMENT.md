# Villa Video Tour — εγκατάσταση

Αυτό είναι patch ΠΑΝΩ στην έκδοση με το homepage hero slider. Περιέχει μόνο αλλαγμένα/νέα αρχεία, χωρισμένα σε SQySystems/ και booking-tourist/. Διατηρεί το hero, τη σύνδεση tenant, τους χρήστες, το storeApiBaseUrl, το υπάρχον R2 bucket, τα variables και τις εξαρτήσεις.

## Εγκατάσταση

1. Αντιγράψτε τα περιεχόμενα κάθε φακέλου στο αντίστοιχο υπάρχον project.
2. Δεν χρειάζονται νέα variables ή bucket. Τα υπάρχοντα Firebase Admin και R2 credentials παραμένουν ΜΟΝΟ στο booking-tourist backend.
3. Στο booking-tourist/vercel.json προστέθηκαν μόνο: `media-src 'self' https://images.sqysystems.com` και `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`. Αν το πραγματικό R2_PUBLIC_BASE_URL σας αλλάξει, αλλάξτε το συγκεκριμένο media-src origin. Δεν χρησιμοποιείται wildcard για media/iframes. Το SQySystems έχει ήδη συμβατή CSP.
4. Κρατήστε το υπάρχον bucket CORS που επιτρέπει PUT από το πραγματικό admin origin `https://www.sqysystems.com` και GET/HEAD από το public site. Το υφιστάμενο r2.cors.example.json της έκδοσης hero αρκεί. Δεν χρειάζεται νέο header για το upload.
5. Κάντε deploy πρώτα το booking-tourist backend και μετά το SQySystems. Το public UI και το backend πρέπει να διαθέτουν τα νέα αρχεία. Δεν γίνονται αυτόματα αλλαγές σε live ρυθμίσεις.
6. Το tourist firestore.rules περιλαμβάνει πλέον το προαιρετικό video στο documented villa field contract· οι browser εγγραφές παραμένουν απαγορευμένες και η εσωτερική _villaVideos απαγορεύεται ήδη από τον default deny. Εφαρμόστε μόνο στο TOURIST Firebase project, όχι στο Master. Το SQySystems/reference/tourist.firestore.rules είναι αντίγραφο αναφοράς.

## Χρήση και δοκιμή

1. Συνδεθείτε στο ίδιο public/admin-tourist.html. Ανοίξτε υπάρχουσα βίλα ή αποθηκεύστε πρώτα μία νέα ως πρόχειρη.
2. Στο «Βίντεο περιήγησης» γράψτε τίτλο και ανεβάστε ένα MP4 ή WebM έως 200 MiB. Για MP4 προτιμήστε H.264/AAC και web-optimized / fast-start export. Θα εμφανιστεί προεπισκόπηση με controls. Πατήστε «Αποθήκευση» της βίλας για να δημοσιευτεί το metadata.
3. Εναλλακτικά βάλτε πλήρη HTTPS σύνδεσμο δημόσιου YouTube ή Vimeo και πατήστε «Χρήση συνδέσμου», έπειτα «Αποθήκευση». Δεν επιτρέπονται αυθαίρετα iframe HTML, arbitrary providers ή εξωτερικά MP4 URLs. Private/unlisted Vimeo links που απαιτούν hash δεν υποστηρίζονται.
4. Ανοίξτε villa.html?slug=YOUR_VILLA_SLUG. Βίλα χωρίς video δεν εμφανίζει κενή ενότητα. Η R2 έκδοση εμφανίζει responsive 16:9 player, native controls/fullscreen, playsinline, poster από την πρώτη εικόνα, preload metadata και χωρίς autoplay. Για YouTube/Vimeo, πατήστε Play για να φορτωθεί ο εξωτερικός player· δεν συνδέεται με τον provider πριν από το click. Πληκτρολόγιο και mobile πρέπει να λειτουργούν κανονικά.
5. Αλλάξτε τίτλο και αποθηκεύστε. Έπειτα δοκιμάστε αντικατάσταση αρχείου, αντικατάσταση με embed και αφαίρεση. Η παλιά R2 έκδοση διαγράφεται ΜΟΝΟ μετά την επιτυχή αποθήκευση. Ακύρωση/κλείσιμο χωρίς αποθήκευση διατηρεί το αποθηκευμένο video και καθαρίζει νέα μη αποθηκευμένα uploads. Το admin preview σταματά όταν κλείσει το editor ή ανακληθεί η συνεδρία.
6. Δοκιμάστε διαγραφή βίλας, δύο tabs με παλιές revisions, ανάκληση admin ρόλου και λάθος τύπο/υπερβολικό μέγεθος αρχείου. Δεν πρέπει να επιτρέπεται επισύναψη διαγραμμένου ή ξένου R2 key.

## Schema και ασφάλεια

Το video είναι προαιρετικό, ή null κατά την αφαίρεση:

```json
{
  "video": {
    "url": "https://images.sqysystems.com/villas/VILLA_ID/video/UUID.mp4",
    "storageType": "r2",
    "title": "Villa walkthrough",
    "r2Key": "villas/VILLA_ID/video/UUID.mp4",
    "updatedAt": "2026-10-30T12:00:00.000Z"
  }
}
```

Για embeds, storageType = youtube ή vimeo και url = canonical allowlisted embed URL. Δεν αποθηκεύεται r2Key. Το updatedAt είναι ISO timestamp που παράγει ο server. Παλιός client που παραλείπει το video field διατηρεί το ήδη αποθηκευμένο video. Ο νέος client στέλνει ρητά null για αφαίρεση.

Το ίδιο /api/r2 δέχεται video-presign, video-complete, video-discard και video-cleanup με tenant Firebase ID token και τον υπάρχοντα server-side admin role έλεγχο. Αποθήκευση/διαγραφή της βίλας συντονίζονται με το _villaVideos registry στην ίδια Firestore transaction. Ένα αποθηκευμένο video δεν μπορεί να διαγραφεί από discard· διαγραμμένο asset δεν μπορεί να επισυναφθεί ξανά.

Τα signed PUT URLs ισχύουν 15 λεπτά, υπογράφουν MIME και Content-Length και γράφουν μόνο σε `_uploads/videos/{villaId}/{uuid}.mp4|webm`. Μέχρι δύο pending αντικαταστάσεις ανά βίλα και ένα αποθηκευμένο video ανά βίλα. Το completion ελέγχει πραγματικά metadata και μέχρι 64 bytes υπογραφής container (MP4 ftyp / WebM EBML), και κάνει conditional R2 server-side copy σε νέο immutable `villas/{villaId}/video/{uuid}.ext`. Το ETag condition αποτρέπει staging replay από το να αλλάξει το validated αντικείμενο. Δεν μεταφέρεται ολόκληρο το video μέσω Vercel και δεν υπάρχει transcoding, έλεγχος πλήρους container/codec ή αυτόματο adaptive streaming. Ο τελικός codec πρέπει να υποστηρίζεται από τον browser.

Η υπάρχουσα lifecycle rule για _uploads/ καλύπτει και τα προσωρινά video. Εγκαταλελειμμένα τελικά assets άνω των 24 ωρών καθαρίζονται στην επόμενη σχετική ενέργεια. Δεν προστίθεται cron. Για χειροκίνητη επανάληψη cleanup χρησιμοποιήστε authenticated `{ "action":"video-cleanup", "id":"VILLA_DOCUMENT_ID" }`. Οι εικόνες/hero και τα παλιά Firebase αρχεία δεν διαγράφονται από αυτή τη λειτουργία.

Official compatibility reference used for conditional CopyObject and bounded GetObject: https://developers.cloudflare.com/r2/api/s3/api/
