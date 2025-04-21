import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_fdniMq1d2wO2-dcGHHig0jsMSB9xKbY",
  authDomain: "personal-expense-tracker-1c190.firebaseapp.com",
  projectId: "personal-expense-tracker-1c190",
  storageBucket: "personal-expense-tracker-1c190.firebasestorage.app",
  messagingSenderId: "728234175169",
  appId: "1:728234175169:web:54a6e029b02b91b3264240"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;