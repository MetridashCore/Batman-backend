import admin, { ServiceAccount } from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

const serviceAccountCredentials: ServiceAccount = serviceAccount as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountCredentials),
  databaseURL: "https://metridash-web-default-rtdb.firebaseio.com"
});

export default admin;