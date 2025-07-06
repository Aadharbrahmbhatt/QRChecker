import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
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

const resultDiv = document.getElementById("result");

// ✅ Add participant
window.addParticipant = async function () {
  const name = document.getElementById("newName").value.trim().toLowerCase();
  const number = document.getElementById("newNumber").value.trim();
  if (!name || !number) return alert("Please fill both fields");

  try {
    await addDoc(collection(db, "student-data"), {
      name,
      number,
      count: 0
    });
    alert("✅ Participant added!");
    document.getElementById("newName").value = "";
    document.getElementById("newNumber").value = "";
  } catch (e) {
    console.error("Error adding participant: ", e);
    alert("❌ Failed to add participant");
  }
};

// ✅ Show styled message
function showMessage(message, bgColor) {
  resultDiv.innerText = message;
  resultDiv.style.display = "block";
  resultDiv.style.backgroundColor = bgColor;
  resultDiv.style.color = "#fff";
  resultDiv.style.textShadow = "0 0 10px #fff";

  setTimeout(() => {
    resultDiv.style.display = "none";
  }, 5000);
}

// ✅ Scanner setup
const scanner = new Html5Qrcode("reader");
const config = { fps: 10, qrbox: 250 };
let scanning = true;

function pauseScanner() {
  scanning = false;
  scanner.pause();
  setTimeout(() => {
    scanner.resume();
    scanning = true;
  }, 4000);
}

scanner.start(
  { facingMode: "environment" },
  config,
  async (decodedText) => {
    if (!scanning) return;
    if (!decodedText.includes("token=")) return;

    pauseScanner(); // prevent duplicate scans

    const token = new URL(decodedText).searchParams.get("token");
    const passRef = doc(db, "passes", token);
    const passSnap = await getDoc(passRef);

    if (!passSnap.exists()) {
      showMessage("❌ Invalid QR Code", "#8b0000");
      return;
    }

    const data = passSnap.data();

    if (data.scanned) {
      showMessage("❌ Already Scanned!", "#aa0000");
      return;
    }

    // ✅ Update passes
    await updateDoc(passRef, {
      scanned: true,
      scanDevice: navigator.userAgent
    });

    // ✅ Update student-data count = 1
    const q = query(
      collection(db, "student-data"),
      where("name", "==", data.name),
      where("number", "==", data.contact)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (studentDoc) => {
        await updateDoc(doc(db, "student-data", studentDoc.id), { count: 1 });
      });

      showMessage(`✅ ${data.name.toUpperCase()} has entered the party!`, "#006633");
    } else {
      showMessage("❌ User not found in database", "#b30000");
    }
  },
  (err) => {
    //console.warn("Scanner error:", err);
  }
);
