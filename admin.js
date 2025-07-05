// admin.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB6BVuHpAJuOms9t7YaS6DyGaalIoOIZ9w",
  authDomain: "fir-project-de800.firebaseapp.com",
  projectId: "fir-project-de800",
  storageBucket: "fir-project-de800.appspot.com",
  messagingSenderId: "752330359610",
  appId: "1:752330359610:web:9e523b911e11083eb34603"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const resultBox = document.getElementById("resultBox");
const scanStatus = document.getElementById("scanStatus");
const scanDetails = document.getElementById("scanDetails");

function showMessage(status, message, details) {
  scanStatus.textContent = message;
  scanStatus.className = status;
  scanDetails.textContent = details;
  resultBox.style.display = "block";
}

function extractTokenFromUrl(text) {
  try {
    const url = new URL(text);
    return url.searchParams.get("token");
  } catch (e) {
    return null;
  }
}

function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start({ facingMode: "environment" }, {
    fps: 10,
    qrbox: 250
  }, async (decodedText) => {
    const token = extractTokenFromUrl(decodedText);
    if (!token) return showMessage("error", "Invalid QR Code", decodedText);

    try {
      const docRef = doc(db, "passes", token);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return showMessage("error", "QR Code Not Found", decodedText);
      }

      const data = docSnap.data();
      if (data.scanned) {
        return showMessage("error", "Already Scanned", `Name: ${data.name}\nContact: ${data.contact}`);
      }

      await updateDoc(docRef, {
        scanned: true,
        scanDevice: navigator.userAgent
      });

      return showMessage("success", "Scan Successful ✅", `Name: ${data.name}\nContact: ${data.contact}`);
    } catch (err) {
      console.error(err);
      showMessage("error", "Scan Failed", err.message);
    }
  }, (error) => {
    console.warn("QR scan error", error);
  });
}

startScanner();
